const axios = require('axios');

/**
 * PerplexityService - Arricchimento dati aziendali con Perplexity API
 * Cerca informazioni aggiuntive su aziende di costruzione
 */
class PerplexityService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
    this.model = 'llama-3.1-sonar-large-128k-online'; // Modello con ricerca web
  }

  /**
   * Arricchisce dati aziendali con ricerca web
   * @param {Object} companyData - { company_name, vat_number, city }
   * @returns {Promise<Object>} Dati arricchiti
   */
  async enrichCompanyData(companyData) {
    try {
      const { company_name, vat_number, city } = companyData;

      if (!company_name) {
        throw new Error('Nome azienda mancante per arricchimento');
      }

      // Costruisci query di ricerca
      let searchQuery = `"${company_name}"`;
      if (vat_number) {
        searchQuery += ` P.IVA ${vat_number}`;
      }
      if (city) {
        searchQuery += ` ${city}`;
      }
      searchQuery += ' impresa costruzioni edilizia';

      const prompt = `Cerca informazioni dettagliate sull'azienda di costruzioni "${company_name}"${vat_number ? ` (P.IVA: ${vat_number})` : ''}${city ? ` con sede a ${city}` : ''}.

Trova e estrai:
1. Descrizione attività aziendale
2. Dimensione azienda (micro/piccola/media/grande)
3. Anno di fondazione
4. Numero dipendenti stimato
5. Settore specifico (costruzioni residenziali, infrastrutture, ristrutturazioni, ecc)
6. Certificazioni (SOA, ISO, etc)
7. Altri contatti (PEC, telefoni aggiuntivi)
8. Social media e presenza online

Rispondi in formato JSON:
{
  "description": "descrizione attività",
  "company_size": "micro|small|medium|large",
  "founded_year": anno_numero,
  "employees": numero_stimato,
  "sector": "settore specifico",
  "certifications": ["SOA", "ISO 9001", ...],
  "additional_contacts": [
    {"type": "pec", "value": "email@pec.it"},
    {"type": "phone", "value": "+39..."}
  ],
  "social_media": {
    "facebook": "url",
    "linkedin": "url",
    "website": "url"
  },
  "found": true
}

Se non trovi l'azienda, rispondi: {"found": false}

Rispondi SOLO con JSON, senza testo aggiuntivo.`;

      // Chiamata API Perplexity
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Sei un assistente specializzato nella ricerca di informazioni su aziende di costruzioni italiane. Rispondi sempre in formato JSON strutturato.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.2, // Bassa temperatura per risposte più deterministiche
          top_p: 0.9,
          search_domain_filter: ['it'], // Limita ricerca a domini italiani
          return_images: false,
          return_related_questions: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Estrai risposta
      const responseText = response.data.choices[0].message.content;

      // Parse JSON
      let enrichedData;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          enrichedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Nessun JSON nella risposta');
        }
      } catch (parseError) {
        console.error('Errore parsing Perplexity JSON:', responseText);
        return {
          found: false,
          error: 'Impossibile parsare risposta'
        };
      }

      // Se non trovata, ritorna subito
      if (!enrichedData.found) {
        return enrichedData;
      }

      // Valida e normalizza dati
      return this.validateEnrichedData(enrichedData);

    } catch (error) {
      if (error.response) {
        console.error('Errore API Perplexity:', error.response.data);
        throw new Error(`Perplexity API Error: ${error.response.data.error?.message || 'Unknown'}`);
      }
      throw error;
    }
  }

  /**
   * Valida dati arricchiti
   */
  validateEnrichedData(data) {
    const validated = { ...data };

    // Normalizza company_size
    const validSizes = ['micro', 'small', 'medium', 'large'];
    if (validated.company_size && !validSizes.includes(validated.company_size)) {
      // Mappa varianti italiane
      const sizeMap = {
        'micro': 'micro',
        'piccola': 'small',
        'media': 'medium',
        'grande': 'large',
        'microimpresa': 'micro',
        'pmi': 'small'
      };
      validated.company_size = sizeMap[validated.company_size.toLowerCase()] || null;
    }

    // Valida founded_year (deve essere tra 1800 e anno corrente)
    if (validated.founded_year) {
      const year = parseInt(validated.founded_year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear) {
        validated.founded_year = null;
      }
    }

    // Valida employees
    if (validated.employees) {
      const emp = parseInt(validated.employees);
      if (isNaN(emp) || emp < 0) {
        validated.employees = null;
      }
    }

    // Assicura che certifications sia array
    if (validated.certifications && !Array.isArray(validated.certifications)) {
      validated.certifications = [];
    }

    // Assicura che additional_contacts sia array
    if (validated.additional_contacts && !Array.isArray(validated.additional_contacts)) {
      validated.additional_contacts = [];
    }

    // Assicura che social_media sia oggetto
    if (!validated.social_media || typeof validated.social_media !== 'object') {
      validated.social_media = {};
    }

    return validated;
  }

  /**
   * Cerca P.IVA su registri pubblici (bonus feature)
   */
  async lookupVATNumber(vatNumber) {
    try {
      // Query specifica per P.IVA italiana
      const prompt = `Cerca informazioni sulla Partita IVA italiana ${vatNumber}.

Trova:
- Ragione sociale
- Indirizzo sede legale
- Stato (attiva/cessata)
- Codice ATECO
- Data inizio attività

Rispondi in JSON:
{
  "vat_number": "${vatNumber}",
  "legal_name": "ragione sociale",
  "legal_address": "indirizzo completo",
  "status": "active|inactive",
  "ateco_code": "codice",
  "ateco_description": "descrizione attività",
  "start_date": "YYYY-MM-DD",
  "found": true
}

Se non trovi informazioni: {"found": false}`;

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            { role: 'system', content: 'Sei un assistente specializzato nella ricerca di Partite IVA italiane.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const responseText = response.data.choices[0].message.content;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { found: false };

    } catch (error) {
      console.error('Errore lookup P.IVA:', error.message);
      return { found: false, error: error.message };
    }
  }
}

module.exports = PerplexityService;
