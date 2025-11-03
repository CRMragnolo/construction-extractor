const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'construction_extractor.db');

console.log('🚀 Inizializzazione database SQLite...');
console.log(`📁 Path database: ${dbPath}`);

try {
  // Crea database
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  console.log('✅ Database creato/aperto con successo');

  // Crea tabelle manualmente
  console.log('📊 Creazione tabelle...');

  // Tabella construction_sites
  db.exec(`
    CREATE TABLE IF NOT EXISTS construction_sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_path TEXT NOT NULL,
      image_filename TEXT NOT NULL,
      image_size INTEGER,
      image_mimetype TEXT,
      image_width INTEGER,
      image_height INTEGER,
      raw_text TEXT,
      company_name TEXT,
      legal_name TEXT,
      vat_number TEXT,
      tax_code TEXT,
      phone_number TEXT,
      mobile_number TEXT,
      email TEXT,
      website TEXT,
      address TEXT,
      city TEXT,
      province TEXT,
      postal_code TEXT,
      construction_type TEXT,
      construction_description TEXT,
      project_name TEXT,
      project_amount REAL,
      start_date TEXT,
      end_date TEXT,
      perplexity_enriched INTEGER DEFAULT 0,
      company_description TEXT,
      company_size TEXT,
      company_founded_year INTEGER,
      company_employees INTEGER,
      company_sector TEXT,
      company_certifications TEXT,
      additional_contacts TEXT,
      social_media TEXT,
      extraction_status TEXT DEFAULT 'pending' CHECK(extraction_status IN ('pending', 'processing', 'completed', 'failed')),
      extraction_error TEXT,
      confidence_score REAL,
      processing_time_ms INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('  ✅ Tabella construction_sites creata');

  // Indici
  db.exec(`CREATE INDEX IF NOT EXISTS idx_company_name ON construction_sites(company_name)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_vat_number ON construction_sites(vat_number)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_status ON construction_sites(extraction_status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_created ON construction_sites(created_at)`);
  console.log('  ✅ Indici construction_sites creati');

  // Tabella extraction_logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS extraction_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      construction_site_id INTEGER,
      step TEXT NOT NULL CHECK(step IN ('upload', 'vision_analysis', 'perplexity_enrichment', 'completed', 'error')),
      status TEXT NOT NULL CHECK(status IN ('started', 'success', 'failed')),
      message TEXT,
      data TEXT,
      duration_ms INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (construction_site_id) REFERENCES construction_sites(id) ON DELETE CASCADE
    )
  `);
  console.log('  ✅ Tabella extraction_logs creata');

  db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_site ON extraction_logs(construction_site_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_logs_step ON extraction_logs(step)`);
  console.log('  ✅ Indici extraction_logs creati');

  // Tabella api_usage
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_name TEXT NOT NULL CHECK(api_name IN ('claude', 'perplexity')),
      endpoint TEXT,
      request_count INTEGER DEFAULT 1,
      response_time_ms INTEGER,
      tokens_used INTEGER,
      cost_estimate REAL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log('  ✅ Tabella api_usage creata');

  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_api_usage_unique ON api_usage(api_name, endpoint, date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_api_date ON api_usage(api_name, date)`);
  console.log('  ✅ Indici api_usage creati');

  // Verifica tabelle create
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('\n✅ Tabelle create con successo:');
  tables.forEach(t => console.log(`  - ${t.name}`));

  db.close();
  console.log('\n🎉 Database inizializzato correttamente!');

} catch (error) {
  console.error('❌ Errore durante inizializzazione:', error);
  process.exit(1);
}
