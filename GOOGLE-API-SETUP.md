# 🔑 Setup Google API Key - Guida Rapida

## Prerequisiti

Questo progetto usa:
- **Google Cloud Vision API** per OCR (99.5% accuracy)
- **Gemini 1.5 Flash** per interpretazione dati

**Costo stimato:** ~$0.012 per foto (vs $0.12 con Claude) = **risparmio 90%!**

---

## 1️⃣ Crea Account Google Cloud

1. Vai su https://console.cloud.google.com/
2. Accedi con il tuo account Google
3. Accetta i termini di servizio
4. **Credito gratuito:** Google offre $300 di credito gratuito per 90 giorni 🎉

---

## 2️⃣ Crea Nuovo Progetto

1. In alto a sinistra, clicca su "Seleziona progetto"
2. Clicca "NUOVO PROGETTO"
3. Nome progetto: `construction-extractor`
4. Clicca "CREA"

---

## 3️⃣ Abilita le API Necessarie

### A) Abilita Google Cloud Vision API

1. Vai su https://console.cloud.google.com/apis/library/vision.googleapis.com
2. Clicca "ABILITA"
3. Aspetta qualche secondo

### B) Abilita Gemini API (Generative Language API)

1. Vai su https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. Clicca "ABILITA"
3. Aspetta qualche secondo

---

## 4️⃣ Crea API Key

1. Vai su https://console.cloud.google.com/apis/credentials
2. Clicca "CREA CREDENZIALI" → "API key"
3. Copia la chiave generata (es: `AIzaSyD...`)
4. **IMPORTANTE:** Clicca su "LIMITA CHIAVE" per proteggerla:
   - **Restricioni API**: Seleziona:
     - Cloud Vision API
     - Generative Language API
   - **Restrizioni applicazione** (opzionale):
     - Seleziona "Indirizzi IP" e aggiungi IP del server Render
   - Clicca "SALVA"

---

## 5️⃣ Configura l'API Key su Render

1. Vai su https://render.com
2. Apri il tuo servizio `construction-backend`
3. Vai su "Environment"
4. Aggiungi nuova variabile:
   - **Key:** `GOOGLE_API_KEY`
   - **Value:** `AIzaSyD...` (la tua API key)
5. Clicca "Save Changes"
6. Render farà automaticamente il redeploy

---

## 6️⃣ Test

Dopo il deploy, prova a caricare una foto su:
👉 https://construction-extractor.vercel.app/

Dovresti vedere nei log:
```
✅ Google Vision OCR - Estrazione testo...
✅ Gemini Flash - Interpretazione dati...
```

---

## 💰 Costi Stimati

### Con Google Vision + Gemini:
| Azione | Costo Unitario | Note |
|--------|----------------|------|
| Google Vision OCR | $0.0015/foto | 99.5% accuracy |
| Gemini Flash | $0.01/foto | Interpretazione veloce |
| Perplexity sonar-pro | $0.026/foto | Validazione online |
| **TOTALE** | **$0.038/foto** | ~4 centesimi |

**100 foto/mese = $3.80** 🎉

### Confronto con Claude Vision:
| Soluzione | Costo/foto | Costo 100 foto |
|-----------|------------|----------------|
| Claude Vision + Perplexity | $0.12 | $12.00 |
| Google Vision + Gemini + Perplexity | $0.038 | $3.80 |
| **RISPARMIO** | **-68%** | **-68%** 💰 |

---

## 🚀 Funzionalità Input Manuale

Per **risparmiare ancora di più**, puoi inserire manualmente:
- Nome impresa
- Località cantiere

Se compili entrambi i campi, **l'OCR viene saltato** → costo solo Perplexity = **$0.026/foto** (2 centesimi!)

---

## ❓ Troubleshooting

### Errore: "Google Vision API Error: API key not valid"
- Verifica di aver abilitato Cloud Vision API
- Verifica di aver copiato correttamente l'API key
- Aspetta 1-2 minuti dopo aver creato la chiave

### Errore: "Gemini API Error: API not enabled"
- Vai su https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
- Clicca "ABILITA"

### Errore: "Quota exceeded"
- Vai su https://console.cloud.google.com/iam-admin/quotas
- Verifica i limiti del progetto
- Eventualmente richiedi aumento quota (gratuito)

---

## 📚 Link Utili

- Google Cloud Console: https://console.cloud.google.com/
- Cloud Vision Pricing: https://cloud.google.com/vision/pricing
- Gemini Pricing: https://ai.google.dev/pricing
- Render Dashboard: https://dashboard.render.com/

---

Creato: 4 Novembre 2025
Progetto: Construction Site Info Extractor
