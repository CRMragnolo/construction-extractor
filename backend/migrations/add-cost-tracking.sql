-- DROP vecchia tabella se esiste
DROP TABLE IF EXISTS api_usage;

-- Tabella per tracking usage e costi API
CREATE TABLE api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  construction_site_id INTEGER, -- NULLABLE
  service TEXT NOT NULL CHECK(service IN ('google_vision', 'gemini', 'perplexity')),
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd REAL NOT NULL,
  request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT -- JSON con dettagli extra
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
