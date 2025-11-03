-- =====================================================
-- CONSTRUCTION SITE EXTRACTOR - DATABASE SCHEMA
-- Estrazione automatica info da cartelli di cantiere
-- =====================================================

-- Tabella principale per cantieri estratti
CREATE TABLE IF NOT EXISTS construction_sites (
    id INT PRIMARY KEY AUTO_INCREMENT,

    -- Immagine originale
    image_path VARCHAR(500) NOT NULL,
    image_filename VARCHAR(255) NOT NULL,
    image_size INT,
    image_mimetype VARCHAR(50),
    image_width INT,
    image_height INT,

    -- Testo estratto (OCR grezzo)
    raw_text TEXT,

    -- Informazioni estratte dall'AI
    company_name VARCHAR(255),
    legal_name VARCHAR(255),
    vat_number VARCHAR(20),
    tax_code VARCHAR(20),
    phone_number VARCHAR(50),
    mobile_number VARCHAR(50),
    email VARCHAR(150),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(20),

    -- Dettagli cantiere
    construction_type VARCHAR(100),
    construction_description TEXT,
    project_name VARCHAR(255),
    project_amount DECIMAL(15,2),
    start_date DATE,
    end_date DATE,

    -- Dati arricchiti da Perplexity
    perplexity_enriched BOOLEAN DEFAULT FALSE,
    company_description TEXT,
    company_size VARCHAR(50),
    company_founded_year INT,
    company_employees INT,
    company_sector VARCHAR(100),
    company_certifications JSON,
    additional_contacts JSON,
    social_media JSON,

    -- Metadati
    extraction_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    extraction_error TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    processing_time_ms INT,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indici per ricerca veloce
    INDEX idx_company_name (company_name),
    INDEX idx_vat_number (vat_number),
    INDEX idx_status (extraction_status),
    INDEX idx_created (created_at),
    FULLTEXT idx_full_text (raw_text, company_name, legal_name, address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabella per storico elaborazioni (log)
CREATE TABLE IF NOT EXISTS extraction_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    construction_site_id INT,
    step ENUM('upload', 'vision_analysis', 'perplexity_enrichment', 'completed', 'error') NOT NULL,
    status ENUM('started', 'success', 'failed') NOT NULL,
    message TEXT,
    data JSON,
    duration_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_site (construction_site_id),
    INDEX idx_step (step),
    FOREIGN KEY (construction_site_id) REFERENCES construction_sites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabella per gestione API rate limits
CREATE TABLE IF NOT EXISTS api_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    api_name ENUM('claude', 'perplexity') NOT NULL,
    endpoint VARCHAR(100),
    request_count INT DEFAULT 1,
    response_time_ms INT,
    tokens_used INT,
    cost_estimate DECIMAL(10,4),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_api_date (api_name, date),
    UNIQUE KEY unique_api_date (api_name, endpoint, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vista per statistiche rapide
CREATE OR REPLACE VIEW extraction_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_extractions,
    SUM(CASE WHEN extraction_status = 'completed' THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN extraction_status = 'failed' THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN perplexity_enriched = TRUE THEN 1 ELSE 0 END) as enriched,
    AVG(processing_time_ms) as avg_processing_time,
    AVG(confidence_score) as avg_confidence
FROM construction_sites
GROUP BY DATE(created_at);
