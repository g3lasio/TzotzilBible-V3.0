const fs = require('fs');
const path = require('path');

// EGW Books directory
const EGW_BOOKS_DIR = path.join(__dirname, 'assets/EGW BOOKS JSON');

// Load EGW Books
let egwBooksCache = null;
function loadEGWBooks() {
  if (egwBooksCache) return egwBooksCache;
  try {
    if (!fs.existsSync(EGW_BOOKS_DIR)) {
      console.log('❌ EGW books directory not found');
      return [];
    }
    const files = fs.readdirSync(EGW_BOOKS_DIR).filter(f => f.endsWith('.json'));
    egwBooksCache = files.map(file => {
      const content = fs.readFileSync(path.join(EGW_BOOKS_DIR, file), 'utf8');
      return { name: file.replace('.json', ''), pages: JSON.parse(content) };
    });
    console.log(`✅ Loaded ${egwBooksCache.length} EGW books`);
    return egwBooksCache;
  } catch (error) {
    console.error('❌ Error loading EGW books:', error);
    return [];
  }
}

// IMPROVED Search function
function searchEGWBooks(query, maxResults = 3) {
  const books = loadEGWBooks();
  const results = [];
  // Eliminar filtro de palabras cortas - ahora busca todas las palabras
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  console.log(`\n🔍 Searching for: "${query}"`);
  console.log(`   Query words: [${queryWords.join(', ')}]`);
  
  for (const book of books) {
    for (const page of book.pages) {
      if (!page.content || !Array.isArray(page.content)) continue;
      const pageText = page.content.join(' ').toLowerCase();
      let score = 0;
      
      // Calcular relevancia
      for (const word of queryWords) {
        if (pageText.includes(word)) {
          score += (pageText.match(new RegExp(word, 'gi')) || []).length;
        }
      }
      
      if (score > 0) {
        // Aumentar contexto de 300 a 600 caracteres
        const fullContent = page.content.join(' ');
        const excerpt = fullContent.substring(0, 600);
        results.push({ 
          book: book.name, 
          page: page.page, 
          content: excerpt,
          fullContent: fullContent.substring(0, 1000),
          relevance: score 
        });
      }
    }
  }
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, maxResults);
}

// Test queries
const testQueries = [
  'salvación por fe',
  'segunda venida de Cristo',
  'sábado',
  'ley de Dios',
  'Juan 3:16',
  'amor de Dios',
  'fe',
  'paz'
];

console.log('═══════════════════════════════════════════════════════');
console.log('  TEST: EGW SEARCH IMPROVEMENTS');
console.log('═══════════════════════════════════════════════════════\n');

for (const query of testQueries) {
  const results = searchEGWBooks(query, 3);
  
  console.log(`\n📖 Query: "${query}"`);
  console.log(`   Results found: ${results.length}`);
  
  if (results.length > 0) {
    console.log('   ✅ SUCCESS - Found quotes:');
    results.forEach((r, idx) => {
      console.log(`\n   [${idx + 1}] ${r.book} (página ${r.page})`);
      console.log(`       Relevance: ${r.relevance}`);
      console.log(`       Preview: "${r.content.substring(0, 150)}..."`);
    });
  } else {
    console.log('   ❌ NO RESULTS - Would trigger web fallback');
  }
  
  console.log('\n' + '─'.repeat(60));
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('  TEST COMPLETE');
console.log('═══════════════════════════════════════════════════════\n');
