#!/usr/bin/env python3
"""
Script para generar la base de datos SQLite de la Biblia para la app móvil.
Convierte el CSV Tzotzil a SQLite para funcionamiento offline.
"""

import csv
import sqlite3
import os
import json

CSV_FILE = 'Tzotzil_database.csv'
PROMISES_FILE = 'promesas.csv'
OUTPUT_DIR = 'temp_nevin/assets'
DB_FILE = os.path.join(OUTPUT_DIR, 'bible.db')

def create_database():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            book_number INTEGER NOT NULL,
            testament TEXT NOT NULL,
            chapters_count INTEGER DEFAULT 0
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS verses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL,
            book_name TEXT NOT NULL,
            chapter INTEGER NOT NULL,
            verse INTEGER NOT NULL,
            text_tzotzil TEXT,
            text_spanish TEXT,
            FOREIGN KEY (book_id) REFERENCES books(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS promises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            image_url TEXT
        )
    ''')
    
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_verses_book ON verses(book_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_verses_chapter ON verses(book_id, chapter)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_verses_text ON verses(text_spanish)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_verses_tzotzil ON verses(text_tzotzil)')
    
    conn.commit()
    return conn, cursor

def get_testament(book_name):
    old_testament = [
        'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio',
        'Josué', 'Jueces', 'Rut', '1 Samuel', '2 Samuel',
        '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas',
        'Esdras', 'Nehemías', 'Ester', 'Job', 'Salmos',
        'Proverbios', 'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías',
        'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel',
        'Amós', 'Abdías', 'Jonás', 'Miqueas', 'Nahúm',
        'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías'
    ]
    return 'AT' if book_name in old_testament else 'NT'

def import_bible_data(conn, cursor):
    print(f"Importando datos de la Biblia desde {CSV_FILE}...")
    
    books = {}
    book_order = []
    verses_data = []
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            book_name = row['Libro']
            chapter = int(row['Capítulo'])
            verse_num = int(row['Versículo'])
            text_tzotzil = row['Texto Tzotzil']
            text_spanish = row['Texto Español']
            
            if book_name not in books:
                book_order.append(book_name)
                books[book_name] = {
                    'chapters': set(),
                    'testament': get_testament(book_name)
                }
            
            books[book_name]['chapters'].add(chapter)
            verses_data.append({
                'book': book_name,
                'chapter': chapter,
                'verse': verse_num,
                'tzotzil': text_tzotzil,
                'spanish': text_spanish
            })
    
    book_ids = {}
    for i, book_name in enumerate(book_order, 1):
        book_info = books[book_name]
        cursor.execute('''
            INSERT INTO books (name, book_number, testament, chapters_count)
            VALUES (?, ?, ?, ?)
        ''', (book_name, i, book_info['testament'], len(book_info['chapters'])))
        book_ids[book_name] = cursor.lastrowid
    
    for verse in verses_data:
        book_id = book_ids[verse['book']]
        cursor.execute('''
            INSERT INTO verses (book_id, book_name, chapter, verse, text_tzotzil, text_spanish)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (book_id, verse['book'], verse['chapter'], verse['verse'], 
              verse['tzotzil'], verse['spanish']))
    
    conn.commit()
    
    cursor.execute('SELECT COUNT(*) FROM books')
    books_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM verses')
    verses_count = cursor.fetchone()[0]
    
    print(f"Importados: {books_count} libros, {verses_count} versículos")
    return books_count, verses_count

def import_promises(conn, cursor):
    print(f"Importando promesas desde {PROMISES_FILE}...")
    
    with open(PROMISES_FILE, 'r', encoding='utf-8-sig') as f:
        content = f.read().replace('\r\n', '\n').replace('\r', '\n')
        lines = content.strip().split('\n')
        
        count = 0
        for i, line in enumerate(lines[1:], 1):
            line = line.strip()
            if not line:
                continue
            
            if '","' in line:
                parts = line.split('","')
                text = parts[0].strip('"').strip()
                image_url = parts[1].strip('"').strip() if len(parts) > 1 else ''
            elif line.startswith('"') and ',' in line:
                last_comma = line.rfind(',')
                text = line[1:last_comma].strip().rstrip('",').strip()
                image_url = line[last_comma+1:].strip()
            else:
                parts = line.split(',', 1)
                text = parts[0].strip('"').strip()
                image_url = parts[1].strip('"').strip() if len(parts) > 1 else ''
            
            if text and text != 'text':
                cursor.execute('''
                    INSERT INTO promises (text, image_url)
                    VALUES (?, ?)
                ''', (text, image_url))
                count += 1
    
    conn.commit()
    print(f"Importadas: {count} promesas")
    return count

def generate_books_json(cursor):
    cursor.execute('''
        SELECT id, name, book_number, testament, chapters_count
        FROM books ORDER BY book_number
    ''')
    
    books = []
    for row in cursor.fetchall():
        books.append({
            'id': row[0],
            'name': row[1],
            'book_number': row[2],
            'testament': row[3],
            'chapters': row[4]
        })
    
    json_path = os.path.join(OUTPUT_DIR, 'bible_books.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(books, f, ensure_ascii=False, indent=2)
    
    print(f"Generado: {json_path}")
    return books

def main():
    print("=" * 50)
    print("Generador de Base de Datos SQLite para Biblia Móvil")
    print("=" * 50)
    
    conn, cursor = create_database()
    
    try:
        books_count, verses_count = import_bible_data(conn, cursor)
        promises_count = import_promises(conn, cursor)
        books = generate_books_json(cursor)
        
        print("\n" + "=" * 50)
        print("RESUMEN:")
        print(f"  - Libros: {books_count}")
        print(f"  - Versículos: {verses_count}")
        print(f"  - Promesas: {promises_count}")
        print(f"  - Base de datos: {DB_FILE}")
        print(f"  - Tamaño: {os.path.getsize(DB_FILE) / (1024*1024):.2f} MB")
        print("=" * 50)
        
    finally:
        conn.close()
    
    print("\n¡Base de datos generada exitosamente!")

if __name__ == '__main__':
    main()
