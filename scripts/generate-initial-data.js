const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../assets/bible.db');
const outputPath = path.resolve(__dirname, '../assets/initial-data.json');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    return;
  }
  console.log('Connected to the Bible database.');
});

const getBooks = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM books', [], (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
};

const getVerses = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT book_id, book_name, chapter, verse, text_tzotzil, text_spanish_rv1960 FROM verses', [], (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
};

async function generateData() {
  try {
    console.log('Exporting books...');
    const books = await getBooks();
    console.log('Exporting verses...');
    const verses = await getVerses();

    const initialData = {
      books,
      verses,
    };

    fs.writeFileSync(outputPath, JSON.stringify(initialData, null, 2));
    console.log(`Successfully generated initial data at ${outputPath}`);

  } catch (error) {
    console.error('Failed to generate initial data:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Closed the database connection.');
    });
  }
}

generateData();
