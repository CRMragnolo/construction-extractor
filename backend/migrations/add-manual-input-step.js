const Database = require('better-sqlite3');
const path = require('path');

// Migrazione per aggiungere step 'manual_input'
const dbPath = path.join(__dirname, '../construction_extractor.db');
const db = new Database(dbPath);

console.log('📝 Migrazione: Aggiunta step manual_input...');

try {
  // Verifica se migrazione già applicata
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='extraction_logs'").get();

  if (tableInfo && tableInfo.sql.includes('manual_input')) {
    console.log('⚠️ Migrazione già applicata, skip');
    db.close();
    return;
  }

  // Crea tabella temporanea con nuovo schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS extraction_logs_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        construction_site_id INTEGER,
        step TEXT NOT NULL CHECK(step IN ('upload', 'gps_extraction', 'manual_input', 'vision_analysis', 'perplexity_validation', 'perplexity_enrichment', 'completed', 'error')),
        status TEXT NOT NULL CHECK(status IN ('started', 'success', 'failed', 'warning')),
        message TEXT,
        data TEXT,
        duration_ms INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (construction_site_id) REFERENCES construction_sites(id) ON DELETE CASCADE
    );
  `);

  // Copia dati dalla vecchia tabella
  const oldTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='extraction_logs'").get();
  if (oldTableExists) {
    db.exec(`
      INSERT INTO extraction_logs_new
      SELECT * FROM extraction_logs;
    `);

    db.exec(`DROP TABLE extraction_logs;`);
  }

  db.exec(`ALTER TABLE extraction_logs_new RENAME TO extraction_logs;`);

  // Ricrea indici
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_logs_site ON extraction_logs(construction_site_id);
    CREATE INDEX IF NOT EXISTS idx_logs_step ON extraction_logs(step);
  `);

  console.log('✅ Step manual_input aggiunto!');

} catch (error) {
  if (error.message.includes('already exists') || error.message.includes('duplicate')) {
    console.log('⚠️ Migrazione già applicata, skip');
  } else {
    console.error('❌ Errore migrazione:', error.message);
  }
} finally {
  db.close();
}
