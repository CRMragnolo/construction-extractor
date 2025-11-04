const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const schemaPath = path.join(__dirname, 'schema-sqlite.sql');

console.log('🚀 Inizializzazione database SQLite...');
console.log(`📁 Path database: ${dbPath}`);
console.log(`📁 Path schema: ${schemaPath}`);

try {
  // Crea database
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  console.log('✅ Database creato/aperto con successo');

  // Leggi e applica schema SQL
  console.log('📊 Applicazione schema...');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  console.log('✅ Schema applicato con successo');

  // Verifica tabelle create
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('\n✅ Tabelle create:');
  tables.forEach(t => console.log(`  - ${t.name}`));

  // Verifica views create
  const views = db.prepare("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name").all();
  if (views.length > 0) {
    console.log('\n✅ Views create:');
    views.forEach(v => console.log(`  - ${v.name}`));
  }

  db.close();
  console.log('\n🎉 Database inizializzato correttamente!');

} catch (error) {
  console.error('❌ Errore durante inizializzazione:', error);
  process.exit(1);
}
