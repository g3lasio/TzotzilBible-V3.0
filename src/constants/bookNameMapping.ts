/**
 * Mapping from English book names (used in reading plans) to Spanish book names (used in database)
 */
export const BOOK_NAME_MAPPING: Record<string, string> = {
  // Old Testament
  'Genesis': 'Génesis',
  'Exodus': 'Éxodo',
  'Leviticus': 'Levítico',
  'Numbers': 'Números',
  'Deuteronomy': 'Deuteronomio',
  'Joshua': 'Josué',
  'Judges': 'Jueces',
  'Ruth': 'Rut',
  '1 Samuel': '1 Samuel',
  '2 Samuel': '2 Samuel',
  '1 Kings': '1 Reyes',
  '2 Kings': '2 Reyes',
  '1 Chronicles': '1 Crónicas',
  '2 Chronicles': '2 Crónicas',
  'Ezra': 'Esdras',
  'Nehemiah': 'Nehemías',
  'Esther': 'Ester',
  'Job': 'Job',
  'Psalms': 'Salmos',
  'Proverbs': 'Proverbios',
  'Ecclesiastes': 'Eclesiastés',
  'Song of Solomon': 'Cantares',
  'Isaiah': 'Isaías',
  'Jeremiah': 'Jeremías',
  'Lamentations': 'Lamentaciones',
  'Ezekiel': 'Ezequiel',
  'Daniel': 'Daniel',
  'Hosea': 'Oseas',
  'Joel': 'Joel',
  'Amos': 'Amós',
  'Obadiah': 'Abdías',
  'Jonah': 'Jonás',
  'Micah': 'Miqueas',
  'Nahum': 'Nahúm',
  'Habakkuk': 'Habacuc',
  'Zephaniah': 'Sofonías',
  'Haggai': 'Hageo',
  'Zechariah': 'Zacarías',
  'Malachi': 'Malaquías',
  
  // New Testament
  'Matthew': 'Mateo',
  'Mark': 'Marcos',
  'Luke': 'Lucas',
  'John': 'Juan',
  'Acts': 'Hechos',
  'Romans': 'Romanos',
  '1 Corinthians': '1 Corintios',
  '2 Corinthians': '2 Corintios',
  'Galatians': 'Gálatas',
  'Ephesians': 'Efesios',
  'Philippians': 'Filipenses',
  'Colossians': 'Colosenses',
  '1 Thessalonians': '1 Tesalonicenses',
  '2 Thessalonians': '2 Tesalonicenses',
  '1 Timothy': '1 Timoteo',
  '2 Timothy': '2 Timoteo',
  'Titus': 'Tito',
  'Philemon': 'Filemón',
  'Hebrews': 'Hebreos',
  'James': 'Santiago',
  '1 Peter': '1 Pedro',
  '2 Peter': '2 Pedro',
  '1 John': '1 Juan',
  '2 John': '2 Juan',
  '3 John': '3 Juan',
  'Jude': 'Judas',
  'Revelation': 'Apocalipsis',
};

/**
 * Translate English book name to Spanish
 */
export function translateBookName(englishName: string): string {
  return BOOK_NAME_MAPPING[englishName] || englishName;
}

/**
 * Check if a book name is in English and needs translation
 */
export function needsTranslation(bookName: string): boolean {
  return bookName in BOOK_NAME_MAPPING;
}
