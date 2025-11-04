-- =====================================================
-- CONSTRUCTION SITE EXTRACTOR - SQLite SCHEMA
-- =====================================================

-- Tabella principale per cantieri estratti
CREATE TABLE IF NOT EXISTS construction_sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Immagine originale
    image_path TEXT NOT NULL,
    image_filename TEXT NOT NULL,
    image_size INTEGER,
    image_mimetype TEXT,
    image_width INTEGER,
    image_height INTEGER,

    -- Metadati GPS
    gps_latitude REAL,
    gps_longitude REAL,
    gps_altitude REAL,
    gps_location_city TEXT,
    photo_datetime TEXT,

    -- Testo estratto (OCR grezzo)
    raw_text TEXT,

    -- Informazioni estratte dall'AI
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

    -- Dettagli cantiere
    construction_type TEXT,
    construction_description TEXT,
    project_name TEXT,
    project_amount REAL,
    start_date TEXT,
    end_date TEXT,

    -- Dati arricchiti da Perplexity
    perplexity_enriched INTEGER DEFAULT 0,
    company_description TEXT,
    company_size TEXT,
    company_founded_year INTEGER,
    company_employees INTEGER,
    company_sector TEXT,
    company_certifications TEXT, -- JSON
    additional_contacts TEXT, -- JSON
    social_media TEXT, -- JSON

    -- Metadati
    extraction_status TEXT DEFAULT 'pending' CHECK(extraction_status IN ('pending', 'processing', 'completed', 'failed')),
    extraction_error TEXT,
    confidence_score REAL,
    processing_time_ms INTEGER,

    -- Audit
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Indici per ricerca veloce
CREATE INDEX IF NOT EXISTS idx_company_name ON construction_sites(company_name);
CREATE INDEX IF NOT EXISTS idx_vat_number ON construction_sites(vat_number);
CREATE INDEX IF NOT EXISTS idx_status ON construction_sites(extraction_status);
CREATE INDEX IF NOT EXISTS idx_created ON construction_sites(created_at);

-- Tabella per storico elaborazioni (log)
CREATE TABLE IF NOT EXISTS extraction_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    construction_site_id INTEGER,
    step TEXT NOT NULL CHECK(step IN ('upload', 'gps_extraction', 'manual_input', 'vision_analysis', 'perplexity_validation', 'perplexity_enrichment', 'completed', 'error')),
    status TEXT NOT NULL CHECK(status IN ('started', 'success', 'failed', 'warning')),
    message TEXT,
    data TEXT, -- JSON
    duration_ms INTEGER,
    created_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (construction_site_id) REFERENCES construction_sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_logs_site ON extraction_logs(construction_site_id);
CREATE INDEX IF NOT EXISTS idx_logs_step ON extraction_logs(step);

-- Tabella per tracking usage e costi API (NUOVA VERSIONE)
CREATE TABLE IF NOT EXISTS api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  construction_site_id INTEGER,
  service TEXT NOT NULL CHECK(service IN ('google_vision', 'gemini', 'perplexity')),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd REAL NOT NULL,
  request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT, -- JSON con dettagli extra (model, response_id, etc)
  FOREIGN KEY (construction_site_id) REFERENCES construction_sites(id) ON DELETE CASCADE
);

-- Index per query performance
CREATE INDEX IF NOT EXISTS idx_api_usage_site ON api_usage(construction_site_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(request_timestamp);

-- View per statistiche mensili
CREATE VIEW IF NOT EXISTS monthly_costs AS
SELECT
  strftime('%Y-%m', request_timestamp) as month,
  service,
  COUNT(*) as request_count,
  SUM(tokens_input) as total_tokens_input,
  SUM(tokens_output) as total_tokens_output,
  SUM(cost_usd) as total_cost_usd
FROM api_usage
GROUP BY strftime('%Y-%m', request_timestamp), service;

-- View per costo totale per cantiere
CREATE VIEW IF NOT EXISTS site_costs AS
SELECT
  construction_site_id,
  COUNT(*) as total_requests,
  SUM(cost_usd) as total_cost_usd,
  MAX(request_timestamp) as last_request
FROM api_usage
GROUP BY construction_site_id;
