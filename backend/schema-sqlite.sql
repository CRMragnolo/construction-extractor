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
    step TEXT NOT NULL CHECK(step IN ('upload', 'vision_analysis', 'perplexity_enrichment', 'completed', 'error')),
    status TEXT NOT NULL CHECK(status IN ('started', 'success', 'failed')),
    message TEXT,
    data TEXT, -- JSON
    duration_ms INTEGER,
    created_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (construction_site_id) REFERENCES construction_sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_logs_site ON extraction_logs(construction_site_id);
CREATE INDEX IF NOT EXISTS idx_logs_step ON extraction_logs(step);

-- Tabella per gestione API usage
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
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_usage_unique ON api_usage(api_name, endpoint, date);
CREATE INDEX IF NOT EXISTS idx_api_date ON api_usage(api_name, date);
