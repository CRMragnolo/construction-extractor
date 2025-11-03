const fs = require('fs').promises;
const axios = require('axios');

/**
 * VisionService - Analisi immagini cartelli cantiere con Claude Vision API
 * Estrae: nome azienda, P.IVA, telefono, indirizzo, dettagli progetto
 */
class VisionService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-3-5-sonnet-20240620'; // Modello con vision
  }

  /**
   * Analizza immagine cartello cantiere
   * @param {string} imagePath - Path assoluto all'immagine
   * @returns {Promise<Object>} Dati estratti
   */
  async analyzeConstructionSite(imagePath) {
    try {
      // Leggi immagine e converti in base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Determina media type
      const ext = imagePath.toLowerCase().split('.').pop();
      const mediaTypeMap = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'gif': 'image/gif'
      };
      const mediaType = mediaTypeMap[ext] || 'image/jpeg';

      // Prompt per estrazione dati strutturati
      const prompt = `Analizza questa foto di un cartello di cantiere ed estrai TUTTE le informazioni visibili.

ISTRUZIONI:
1. Leggi attentamente TUTTO il testo presente nel cartello
2. Identifica e estrai le seguenti informazioni (se presenti):

AZIENDA:
- Nome impresa costruttrice/ditta esecutrice
- Ragione sociale completa
- Partita IVA (es: IT12345678901 o 12345678901)
- Codice Fiscale
- Indirizzo sede (via, città, CAP, provincia)
- Numero di telefono fisso
- Numero cellulare
- Email
- Sito web

PROGETTO:
- Tipo di lavori (es: "Costruzione edificio residenziale", "Ristrutturazione", ecc)
- Nome/descrizione progetto
- Importo lavori (se indicato)
- Committente (chi ha commissionato i lavori)
- Direttore lavori
- Responsabile sicurezza

RISPONDI IN QUESTO FORMATO JSON (compila SOLO i campi che trovi):
{
  "raw_text": "tutto il testo letto nel cartello",
  "company_name": "nome azienda principale",
  "legal_name": "ragione sociale completa se diversa",
  "vat_number": "solo numeri della P.IVA",
  "tax_code": "codice fiscale",
  "phone_number": "telefono fisso",
  "mobile_number": "cellulare",
  "email": "email",
  "website": "sito web",
  "address": "indirizzo completo",
  "city": "città",
  "province": "sigla provincia (es: MI, RM)",
  "postal_code": "CAP",
  "construction_type": "tipo di cantiere/lavori",
  "construction_description": "descrizione dettagliata lavori",
  "project_name": "nome progetto se presente",
  "project_amount": numero_importo_se_presente,
  "confidence_score": 0.95
}

IMPORTANTE:
- Se un campo non è presente, metti null
- Per vat_number estrai SOLO i numeri (rimuovi "IT" e spazi)
- Per confidence_score metti un valore 0-1 basato sulla leggibilità (0.95 = ottimo, 0.5 = scarso)
- Estrai anche numeri di telefono parzialmente visibili
- Se vedi più aziende (es: committente + ditta), estrai la DITTA ESECUTRICE come company_name

Rispondi SOLO con il JSON, senza altre spiegazioni.`;

      // Chiamata API Claude
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Image
                  }
                },
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      // Estrai testo risposta
      const responseText = response.data.content[0].text;

      // Parse JSON dalla risposta
      let extractedData;
      try {
        // Trova il blocco JSON nella risposta (potrebbe avere testo prima/dopo)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Nessun JSON trovato nella risposta');
        }
      } catch (parseError) {
        console.error('Errore parsing JSON:', responseText);
        throw new Error('Impossibile parsare risposta AI: ' + parseError.message);
      }

      // Validazione e pulizia dati
      extractedData = this.validateAndCleanData(extractedData);

      return extractedData;

    } catch (error) {
      if (error.response) {
        console.error('Errore API Claude:', error.response.data);
        throw new Error(`Claude API Error: ${error.response.data.error?.message || 'Unknown'}`);
      }
      throw error;
    }
  }

  /**
   * Valida e pulisce i dati estratti
   */
  validateAndCleanData(data) {
    const cleaned = { ...data };

    // Pulisci P.IVA (solo numeri)
    if (cleaned.vat_number) {
      cleaned.vat_number = cleaned.vat_number.replace(/[^0-9]/g, '');
      if (cleaned.vat_number.length !== 11) {
        cleaned.vat_number = null; // P.IVA italiana deve avere 11 cifre
      }
    }

    // Pulisci Codice Fiscale
    if (cleaned.tax_code) {
      cleaned.tax_code = cleaned.tax_code.toUpperCase().replace(/\s/g, '');
      if (cleaned.tax_code.length !== 16 && cleaned.tax_code.length !== 11) {
        cleaned.tax_code = null;
      }
    }

    // Pulisci numeri di telefono
    if (cleaned.phone_number) {
      cleaned.phone_number = cleaned.phone_number.replace(/[^0-9+]/g, '');
    }
    if (cleaned.mobile_number) {
      cleaned.mobile_number = cleaned.mobile_number.replace(/[^0-9+]/g, '');
    }

    // Valida email
    if (cleaned.email && !cleaned.email.includes('@')) {
      cleaned.email = null;
    }

    // Valida confidence score
    if (typeof cleaned.confidence_score !== 'number' || cleaned.confidence_score < 0 || cleaned.confidence_score > 1) {
      cleaned.confidence_score = 0.7; // Default
    }

    // Converti project_amount in numero
    if (cleaned.project_amount) {
      const amount = parseFloat(String(cleaned.project_amount).replace(/[^0-9.]/g, ''));
      cleaned.project_amount = isNaN(amount) ? null : amount;
    }

    return cleaned;
  }
}

module.exports = VisionService;
