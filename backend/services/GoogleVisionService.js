const vision = require('@google-cloud/vision');
const axios = require('axios');
const CostTracker = require('./CostTracker');

/**
 * GoogleVisionService - OCR ad alta precisione con Google Cloud Vision
 * + interpretazione dati con Gemini Flash (economico e veloce)
 */
class GoogleVisionService {
  constructor(googleApiKey, siteId = null) {
    this.googleApiKey = googleApiKey;
    this.siteId = siteId;
    this.geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    this.costTracker = new CostTracker();

    // Client Google Vision (usa API key invece di service account)
    this.visionClient = null; // Inizializzeremo con API key
  }

  /**
   * Analizza cartello cantiere con Google Vision OCR + Gemini
   * @param {string} imagePath - Path assoluto all'immagine
   * @returns {Promise<Object>} Dati estratti e strutturati
   */
  async analyzeConstructionSite(imagePath) {
    try {
      // STEP 1: OCR con Google Cloud Vision
      console.log('📸 Google Vision OCR - Estrazione testo...');
      const ocrText = await this.extractTextWithVision(imagePath);

      if (!ocrText || ocrText.trim().length === 0) {
        throw new Error('Nessun testo estratto dall\'immagine');
      }

      console.log(`✅ Testo estratto (${ocrText.length} caratteri)`);

      // STEP 2: Interpretazione con Gemini Flash
      console.log('🤖 Gemini Flash - Interpretazione dati...');
      const structuredData = await this.interpretWithGemini(ocrText);

      return structuredData;

    } catch (error) {
      console.error('Errore analisi Google Vision:', error.message);
      throw error;
    }
  }

  /**
   * Estrae testo dall'immagine usando Google Cloud Vision API
   * Usa REST API con API key (no service account)
   */
  async extractTextWithVision(imagePath) {
    try {
      const fs = require('fs').promises;
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Chiamata REST API Google Vision
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.googleApiKey}`,
        {
          requests: [
            {
              image: {
                content: base64Image
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1
                }
              ],
              imageContext: {
                languageHints: ['it', 'en'] // Italiano + Inglese
              }
            }
          ]
        }
      );

      if (response.data.responses[0].error) {
        throw new Error(`Google Vision Error: ${response.data.responses[0].error.message}`);
      }

      const textAnnotations = response.data.responses[0].textAnnotations;

      if (!textAnnotations || textAnnotations.length === 0) {
        throw new Error('Nessun testo rilevato nell\'immagine');
      }

      // Il primo elemento contiene tutto il testo estratto
      const fullText = textAnnotations[0].description;

      // Traccia costo Google Vision
      if (this.siteId) {
        this.costTracker.trackGoogleVision(this.siteId, {
          text_length: fullText.length,
          annotations_count: textAnnotations.length
        });
      }

      return fullText;

    } catch (error) {
      if (error.response) {
        console.error('Errore API Google Vision:', error.response.data);
        throw new Error(`Google Vision API Error: ${error.response.data.error?.message || 'Unknown'}`);
      }
      throw error;
    }
  }

  /**
   * Interpreta il testo OCR e struttura i dati con Gemini Flash
   */
  async interpretWithGemini(ocrText) {
    try {
      const prompt = `Analizza questo testo estratto da un cartello di cantiere ed estrai le informazioni strutturate.

TESTO ESTRATTO (OCR):
${ocrText}

COMPITO:
1. Identifica l'IMPRESA ESECUTRICE (cerca etichette come "IMPRESA ESECUTRICE", "IMPRESA COSTRUTTRICE", "DITTA ESECUTRICE")
2. IGNORA: COMMITTENTE, DIRETTORE LAVORI, RESPONSABILE SICUREZZA, PROGETTISTA
3. Estrai SOLO i dati dell'impresa esecutrice

**IDENTIFICAZIONE IMPRESA - PAROLE CHIAVE:**
Cerca SOLO l'azienda con queste etichette:
- "IMPRESA COSTRUTTRICE"
- "IMPRESA ESECUTRICE"
- "DITTA ESECUTRICE"
- "IMPRESA APPALTATRICE"
- "ESECUTORE DEI LAVORI"
- "IMPRESA AFFIDATARIA"

RISPONDI IN QUESTO FORMATO JSON:
{
  "raw_text": "testo completo estratto",
  "company_name": "nome impresa esecutrice",
  "legal_name": "ragione sociale completa",
  "vat_number": "solo 11 numeri della P.IVA",
  "tax_code": "codice fiscale",
  "phone_number": "telefono fisso",
  "mobile_number": "cellulare",
  "email": "email",
  "website": "sito web",
  "address": "indirizzo completo",
  "city": "città",
  "province": "sigla provincia (es: VI, TV)",
  "postal_code": "CAP",
  "construction_type": "tipo lavori",
  "construction_description": "descrizione lavori",
  "project_name": "nome progetto",
  "project_amount": numero_importo,
  "confidence_score": 0.95
}

IMPORTANTE:
- Se un campo non è presente, metti null
- Per vat_number estrai SOLO i numeri (rimuovi "IT" e spazi)
- Confidence score: 0.95 = ottimo, 0.7 = buono, 0.5 = scarso
- Estrai SOLO l'impresa con etichetta "IMPRESA ESECUTRICE", NON il committente

Rispondi SOLO con il JSON, senza markdown o altre spiegazioni.`;

      const response = await axios.post(
        `${this.geminiUrl}?key=${this.googleApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192
          }
        }
      );

      // Debug: Log risposta completa
      console.log('🔍 Gemini Response:', JSON.stringify(response.data, null, 2));

      // Validazione struttura risposta
      if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        console.error('❌ Risposta Gemini non valida (no candidates):', response.data);
        throw new Error('Gemini API ha restituito una risposta vuota o malformata');
      }

      const candidate = response.data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('❌ Risposta Gemini non valida (no content.parts):', candidate);
        throw new Error('Gemini API: struttura risposta non valida (manca content.parts)');
      }

      const responseText = candidate.content.parts[0].text;

      // Traccia costo Gemini
      if (this.siteId && response.data.usageMetadata) {
        const usage = response.data.usageMetadata;
        this.costTracker.trackGemini(
          this.siteId,
          usage.promptTokenCount || 0,
          usage.candidatesTokenCount || 0,
          {
            model: response.data.modelVersion,
            response_id: response.data.responseId,
            finish_reason: candidate.finishReason
          }
        );
      }

      // Parse JSON dalla risposta
      let extractedData;
      try {
        // Rimuovi eventuali markdown code blocks
        const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Nessun JSON trovato nella risposta Gemini');
        }
      } catch (parseError) {
        console.error('Errore parsing JSON Gemini:', responseText);
        throw new Error('Impossibile parsare risposta Gemini: ' + parseError.message);
      }

      // Validazione e pulizia dati
      extractedData = this.validateAndCleanData(extractedData);

      return extractedData;

    } catch (error) {
      if (error.response) {
        console.error('Errore API Gemini:', error.response.data);
        throw new Error(`Gemini API Error: ${error.response.data.error?.message || 'Unknown'}`);
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

module.exports = GoogleVisionService;
