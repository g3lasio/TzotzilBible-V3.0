/**
 * Script para preparar datos offline para la app
 * Este script descarga y prepara los datos bíblicos para uso offline
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_URL || 'https://tzotzil-bible-chyrris.replit.app';
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = path.join(DIST_DIR, 'data');

const BIBLE_BOOKS = [
  { name: 'Génesis', chapters: 50 },
  { name: 'Éxodo', chapters: 40 },
  { name: 'Levítico', chapters: 27 },
  { name: 'Números', chapters: 36 },
  { name: 'Deuteronomio', chapters: 34 },
  { name: 'Josué', chapters: 24 },
  { name: 'Jueces', chapters: 21 },
  { name: 'Rut', chapters: 4 },
  { name: '1 Samuel', chapters: 31 },
  { name: '2 Samuel', chapters: 24 },
  { name: '1 Reyes', chapters: 22 },
  { name: '2 Reyes', chapters: 25 },
  { name: '1 Crónicas', chapters: 29 },
  { name: '2 Crónicas', chapters: 36 },
  { name: 'Esdras', chapters: 10 },
  { name: 'Nehemías', chapters: 13 },
  { name: 'Ester', chapters: 10 },
  { name: 'Job', chapters: 42 },
  { name: 'Salmos', chapters: 150 },
  { name: 'Proverbios', chapters: 31 },
  { name: 'Eclesiastés', chapters: 12 },
  { name: 'Cantares', chapters: 8 },
  { name: 'Isaías', chapters: 66 },
  { name: 'Jeremías', chapters: 52 },
  { name: 'Lamentaciones', chapters: 5 },
  { name: 'Ezequiel', chapters: 48 },
  { name: 'Daniel', chapters: 12 },
  { name: 'Oseas', chapters: 14 },
  { name: 'Joel', chapters: 3 },
  { name: 'Amós', chapters: 9 },
  { name: 'Abdías', chapters: 1 },
  { name: 'Jonás', chapters: 4 },
  { name: 'Miqueas', chapters: 7 },
  { name: 'Nahúm', chapters: 3 },
  { name: 'Habacuc', chapters: 3 },
  { name: 'Sofonías', chapters: 3 },
  { name: 'Hageo', chapters: 2 },
  { name: 'Zacarías', chapters: 14 },
  { name: 'Malaquías', chapters: 4 },
  { name: 'Mateo', chapters: 28 },
  { name: 'Marcos', chapters: 16 },
  { name: 'Lucas', chapters: 24 },
  { name: 'Juan', chapters: 21 },
  { name: 'Hechos', chapters: 28 },
  { name: 'Romanos', chapters: 16 },
  { name: '1 Corintios', chapters: 16 },
  { name: '2 Corintios', chapters: 13 },
  { name: 'Gálatas', chapters: 6 },
  { name: 'Efesios', chapters: 6 },
  { name: 'Filipenses', chapters: 4 },
  { name: 'Colosenses', chapters: 4 },
  { name: '1 Tesalonicenses', chapters: 5 },
  { name: '2 Tesalonicenses', chapters: 3 },
  { name: '1 Timoteo', chapters: 6 },
  { name: '2 Timoteo', chapters: 4 },
  { name: 'Tito', chapters: 3 },
  { name: 'Filemón', chapters: 1 },
  { name: 'Hebreos', chapters: 13 },
  { name: 'Santiago', chapters: 5 },
  { name: '1 Pedro', chapters: 5 },
  { name: '2 Pedro', chapters: 3 },
  { name: '1 Juan', chapters: 5 },
  { name: '2 Juan', chapters: 1 },
  { name: '3 Juan', chapters: 1 },
  { name: 'Judas', chapters: 1 },
  { name: 'Apocalipsis', chapters: 22 }
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Retry ${i + 1}/${retries} for ${url}`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return null;
}

async function downloadBibleData() {
  console.log('📖 Downloading Bible data for offline use...\n');
  
  ensureDir(DATA_DIR);
  ensureDir(path.join(DATA_DIR, 'verses'));
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'books.json'),
    JSON.stringify(BIBLE_BOOKS, null, 2)
  );
  console.log('✅ Books index saved\n');
  
  let totalChapters = 0;
  let downloadedChapters = 0;
  
  for (const book of BIBLE_BOOKS) {
    totalChapters += book.chapters;
  }
  
  console.log(`📊 Total chapters to download: ${totalChapters}\n`);
  
  for (const book of BIBLE_BOOKS) {
    const bookDir = path.join(DATA_DIR, 'verses', book.name.replace(/\s+/g, '_'));
    ensureDir(bookDir);
    
    console.log(`📚 Downloading ${book.name}...`);
    
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      const url = `${API_BASE}/api/bible/verses/${encodeURIComponent(book.name)}/${chapter}`;
      const data = await fetchWithRetry(url);
      
      if (data) {
        fs.writeFileSync(
          path.join(bookDir, `${chapter}.json`),
          JSON.stringify(data, null, 2)
        );
        downloadedChapters++;
        
        process.stdout.write(`\r   Chapter ${chapter}/${book.chapters} (${Math.round(downloadedChapters/totalChapters*100)}% total)`);
      } else {
        console.warn(`\n   ⚠️ Failed to download ${book.name} chapter ${chapter}`);
      }
      
      await new Promise(r => setTimeout(r, 100));
    }
    
    console.log(`\n   ✅ ${book.name} complete\n`);
  }
  
  console.log(`\n🎉 Download complete! ${downloadedChapters}/${totalChapters} chapters saved.`);
  
  const manifest = {
    version: '1.0.0',
    downloadedAt: new Date().toISOString(),
    books: BIBLE_BOOKS,
    totalChapters: downloadedChapters
  };
  
  fs.writeFileSync(
    path.join(DATA_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('\n📋 Manifest created. Offline data ready!');
}

if (require.main === module) {
  downloadBibleData().catch(console.error);
}

module.exports = { downloadBibleData, BIBLE_BOOKS };
