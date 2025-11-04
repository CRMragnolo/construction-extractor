const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.db');
const db = new Database(dbPath);

console.log('🔄 Applicando migrazione tracking costi...');

try {
  const migration = fs.readFileSync(path.join(__dirname, 'add-cost-tracking.sql'), 'utf8');
  db.exec(migration);
  console.log('✅ Migrazione completata con successo!');

  // Verifica tabella creata
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='api_usage'").all();
  console.log('📊 Tabelle create:', tables);

} catch (error) {
  console.error('❌ Errore migrazione:', error.message);
  process.exit(1);
} finally {
  db.close();
}
