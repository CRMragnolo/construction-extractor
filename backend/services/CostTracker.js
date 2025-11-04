const Database = require('better-sqlite3');
const path = require('path');

/**
 * CostTracker - Traccia usage e costi API
 */
class CostTracker {
  constructor() {
    this.db = new Database(path.join(__dirname, '../database.db'));

    // Prezzi API (USD)
    this.pricing = {
      google_vision: {
        per_image: 0.0015
      },
      gemini: {
        input_per_1m: 0.01875,  // Gemini 2.5 Flash
        output_per_1m: 0.075
      },
      perplexity: {
        // Stima basata su pricing pubblico Sonar Pro
        per_1k_tokens: 0.005
      }
    };
  }

  /**
   * Traccia chiamata Google Vision
   */
  trackGoogleVision(siteId, metadata = {}) {
    const cost = this.pricing.google_vision.per_image;

    this.db.prepare(`
      INSERT INTO api_usage (construction_site_id, service, tokens_input, tokens_output, cost_usd, metadata)
      VALUES (?, 'google_vision', 0, 0, ?, ?)
    `).run(siteId, cost, JSON.stringify(metadata));

    return cost;
  }

  /**
   * Traccia chiamata Gemini
   */
  trackGemini(siteId, tokensInput, tokensOutput, metadata = {}) {
    const costInput = (tokensInput / 1000000) * this.pricing.gemini.input_per_1m;
    const costOutput = (tokensOutput / 1000000) * this.pricing.gemini.output_per_1m;
    const totalCost = costInput + costOutput;

    this.db.prepare(`
      INSERT INTO api_usage (construction_site_id, service, tokens_input, tokens_output, cost_usd, metadata)
      VALUES (?, 'gemini', ?, ?, ?, ?)
    `).run(siteId, tokensInput, tokensOutput, totalCost, JSON.stringify(metadata));

    return totalCost;
  }

  /**
   * Traccia chiamata Perplexity
   */
  trackPerplexity(siteId, tokensInput, tokensOutput, metadata = {}) {
    const totalTokens = tokensInput + tokensOutput;
    const cost = (totalTokens / 1000) * this.pricing.perplexity.per_1k_tokens;

    this.db.prepare(`
      INSERT INTO api_usage (construction_site_id, service, tokens_input, tokens_output, cost_usd, metadata)
      VALUES (?, 'perplexity', ?, ?, ?, ?)
    `).run(siteId, tokensInput, tokensOutput, cost, JSON.stringify(metadata));

    return cost;
  }

  /**
   * Ottieni statistiche costi mensili
   */
  getMonthlyCosts(year, month) {
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

    return this.db.prepare(`
      SELECT * FROM monthly_costs WHERE month = ?
    `).all(monthStr);
  }

  /**
   * Ottieni costo totale mese corrente
   */
  getCurrentMonthTotal() {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    const result = this.db.prepare(`
      SELECT
        SUM(cost_usd) as total_cost,
        COUNT(*) as total_requests
      FROM api_usage
      WHERE strftime('%Y-%m', request_timestamp) = ?
    `).get(monthStr);

    return result || { total_cost: 0, total_requests: 0 };
  }

  /**
   * Ottieni breakdown costi per servizio (mese corrente)
   */
  getCurrentMonthBreakdown() {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    return this.db.prepare(`
      SELECT
        service,
        COUNT(*) as request_count,
        SUM(tokens_input) as total_tokens_input,
        SUM(tokens_output) as total_tokens_output,
        SUM(cost_usd) as total_cost_usd
      FROM api_usage
      WHERE strftime('%Y-%m', request_timestamp) = ?
      GROUP BY service
    `).all(monthStr);
  }

  /**
   * Ottieni costo per singolo cantiere
   */
  getSiteCost(siteId) {
    return this.db.prepare(`
      SELECT * FROM site_costs WHERE construction_site_id = ?
    `).get(siteId);
  }

  /**
   * Ottieni ultimi N request con costi
   */
  getRecentUsage(limit = 50) {
    return this.db.prepare(`
      SELECT
        api_usage.*,
        construction_sites.company_name
      FROM api_usage
      LEFT JOIN construction_sites ON api_usage.construction_site_id = construction_sites.id
      ORDER BY request_timestamp DESC
      LIMIT ?
    `).all(limit);
  }

  /**
   * Chiudi connessione DB
   */
  close() {
    this.db.close();
  }
}

module.exports = CostTracker;
