# 🏗️ Construction Site Info Extractor

**Applicazione AI-powered per estrazione automatica di informazioni da foto di cartelli di cantiere**

Carica una foto di un cartello di cantiere e ottieni automaticamente:
- 🏢 Nome impresa costruttrice/ditta
- 🆔 Partita IVA e Codice Fiscale
- 📱 Numeri di telefono e contatti
- 📍 Indirizzo sede
- 🏗️ Dettagli progetto/lavori
- 🌐 Dati aziendali arricchiti (via Perplexity AI)

---

## 📋 Indice

- [Tecnologie Utilizzate](#-tecnologie-utilizzate)
- [Architettura](#-architettura)
- [Prerequisiti](#-prerequisiti)
- [Installazione](#-installazione)
- [Configurazione](#-configurazione)
- [Avvio Applicazione](#-avvio-applicazione)
- [Utilizzo](#-utilizzo)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Tecnologie Utilizzate

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Web framework
- **MySQL 8+** - Database relazionale
- **Multer** - Upload file/immagini
- **Sharp** - Image processing
- **Anthropic Claude API** - Analisi immagini con Vision AI
- **Perplexity AI API** - Arricchimento dati aziendali
- **Winston** - Logging

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Heroicons** - Icon library

---

## 🏛️ Architettura

```
construction-site-extractor/
├── backend/
│   ├── server.js              # Express server principale
│   ├── init-db.js             # Script inizializzazione DB
│   ├── schema.sql             # Schema database MySQL
│   ├── services/
│   │   ├── VisionService.js   # Claude Vision API integration
│   │   └── PerplexityService.js  # Perplexity API integration
│   ├── .env                   # Variabili ambiente (NON committare)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Componente principale
│   │   ├── components/
│   │   │   ├── ImageUploader.jsx      # Upload drag & drop
│   │   │   ├── SitesList.jsx          # Lista cantieri estratti
│   │   │   ├── SiteDetailsModal.jsx   # Modal dettagli completi
│   │   │   └── StatsCard.jsx          # Card statistiche
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

### Flusso di Elaborazione

```
1. User carica foto → Frontend
         ↓
2. Upload via /api/upload → Backend
         ↓
3. Salva immagine su disco + record DB
         ↓
4. Analisi con Claude Vision API
   - Estrae testo (OCR)
   - Identifica: azienda, P.IVA, telefoni, indirizzo
         ↓
5. Salva dati estratti nel DB
         ↓
6. [OPZIONALE] Arricchimento con Perplexity
   - Cerca info aziendali aggiuntive
   - Certificazioni, dimensione, settore
         ↓
7. Ritorna risultati completi al frontend
         ↓
8. Visualizzazione dati + salvataggio DB
```

---

## 📦 Prerequisiti

### Software Richiesto

1. **Node.js 18+**
   ```bash
   node --version  # Deve essere >= 18.0.0
   ```

2. **MySQL 8+**
   ```bash
   mysql --version  # Deve essere >= 8.0
   ```

3. **npm o yarn**
   ```bash
   npm --version
   ```

### API Keys Richieste

1. **Anthropic Claude API Key**
   - Vai su: https://console.anthropic.com/
   - Crea account e ottieni API key
   - Modello richiesto: `claude-3-5-sonnet-20241022` (con Vision)
   - Costo stimato: ~$3 per 1000 immagini

2. **Perplexity AI API Key** (opzionale ma consigliato)
   - Vai su: https://www.perplexity.ai/
   - Accedi con il tuo account PRO
   - Ottieni API key da dashboard
   - Modello usato: `llama-3.1-sonar-large-128k-online`
   - Costo: Incluso nell'abbonamento PRO

---

## 📥 Installazione

### 1. Clona o scarica il progetto

```bash
cd /home/user
# Il progetto è già in: /home/user/construction-site-extractor/
```

### 2. Installa dipendenze Backend

```bash
cd /home/user/construction-site-extractor/backend
npm install
```

Questo installerà:
- express, cors, dotenv
- mysql2, multer, sharp
- axios, winston

### 3. Installa dipendenze Frontend

```bash
cd /home/user/construction-site-extractor/frontend
npm install
```

Questo installerà:
- react, react-dom, vite
- tailwindcss, @heroicons/react
- axios

---

## ⚙️ Configurazione

### 1. Setup Database MySQL

#### Opzione A: Crea database automaticamente

```bash
cd /home/user/construction-site-extractor/backend

# Crea file .env
cp .env.example .env

# Modifica .env con le tue credenziali MySQL
nano .env
```

Esempio `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tua_password_mysql
DB_NAME=construction_extractor

PORT=5002
NODE_ENV=development

ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxx
```

Poi esegui:
```bash
npm run init-db
```

Questo creerà:
- Database `construction_extractor`
- Tabelle: `construction_sites`, `extraction_logs`, `api_usage`
- Indici e vincoli

#### Opzione B: Crea manualmente via MySQL CLI

```bash
mysql -u root -p

# In MySQL CLI:
CREATE DATABASE construction_extractor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE construction_extractor;
SOURCE /home/user/construction-site-extractor/backend/schema.sql;
EXIT;
```

### 2. Configura API Keys

Modifica `/home/user/construction-site-extractor/backend/.env`:

```env
# OBBLIGATORIA - Per analisi immagini
ANTHROPIC_API_KEY=sk-ant-api03-TUO_TOKEN_QUI

# OPZIONALE - Per arricchimento dati (consigliato)
PERPLEXITY_API_KEY=pplx-TUO_TOKEN_QUI
```

⚠️ **IMPORTANTE**:
- Senza `ANTHROPIC_API_KEY` l'app NON funziona
- Senza `PERPLEXITY_API_KEY` l'arricchimento dati non verrà eseguito (ma l'estrazione base funziona)

### 3. Crea directory uploads

```bash
cd /home/user/construction-site-extractor/backend
mkdir -p uploads/construction-sites
```

---

## 🚀 Avvio Applicazione

### Modalità Development (consigliata per test)

Apri **2 terminali separati**:

#### Terminale 1 - Backend
```bash
cd /home/user/construction-site-extractor/backend
npm run dev
```

Output atteso:
```
🚀 Construction Site Extractor API running on port 5002
📁 Environment: development
🗄️  Database: construction_extractor@localhost
✅ Database connesso con successo
```

#### Terminale 2 - Frontend
```bash
cd /home/user/construction-site-extractor/frontend
npm run dev
```

Output atteso:
```
  VITE v5.2.0  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Apri l'applicazione

Vai su: **http://localhost:5173**

---

## 📖 Utilizzo

### 1. Carica Foto Cartello

1. Clicca su tab **"📸 Carica Foto"**
2. **Drag & drop** la foto o clicca per selezionare
3. Clicca **"🚀 Analizza Cartello"**
4. Attendi 10-30 secondi per elaborazione

### 2. Visualizza Risultati

- I dati estratti compaiono immediatamente
- Vai su tab **"📋 Cantieri Estratti"** per vedere tutti
- Clicca su un cantiere per vedere **dettagli completi**

### 3. Cosa Viene Estratto

#### Dati Base (Claude Vision):
- Nome azienda/ditta
- Ragione sociale
- Partita IVA
- Codice Fiscale
- Telefono fisso
- Numero cellulare
- Email
- Sito web
- Indirizzo completo
- Tipo lavori
- Descrizione cantiere
- Importo lavori (se presente)

#### Dati Arricchiti (Perplexity):
- Descrizione attività aziendale
- Dimensione azienda
- Anno fondazione
- Numero dipendenti
- Settore specifico
- Certificazioni (SOA, ISO, etc)
- Contatti aggiuntivi (PEC)
- Social media

---

## 📡 API Endpoints

### POST `/api/upload`
Carica e analizza immagine cartello cantiere

**Request:**
```http
POST /api/upload
Content-Type: multipart/form-data

{
  "image": <file>
}
```

**Response:**
```json
{
  "success": true,
  "site_id": 123,
  "processing_time": 15234,
  "data": {
    "raw_text": "testo estratto...",
    "company_name": "Edilizia ABC Srl",
    "vat_number": "12345678901",
    "phone_number": "+39 02 1234567",
    "address": "Via Roma 123, Milano",
    "city": "Milano",
    "province": "MI",
    "construction_type": "Costruzione edificio residenziale",
    "confidence_score": 0.95,
    "enriched": {
      "found": true,
      "description": "Azienda specializzata in...",
      "company_size": "small",
      "sector": "Costruzioni residenziali"
    }
  }
}
```

### GET `/api/sites`
Recupera lista cantieri estratti

**Query params:**
- `status` (optional): `completed|processing|failed`
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "success": true,
  "sites": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

### GET `/api/sites/:id`
Recupera dettagli singolo cantiere + logs

**Response:**
```json
{
  "success": true,
  "site": { ...cantiere completo... },
  "logs": [
    {
      "step": "vision_analysis",
      "status": "success",
      "duration_ms": 8234
    }
  ]
}
```

### DELETE `/api/sites/:id`
Elimina cantiere (anche immagine da disco)

### GET `/api/stats`
Statistiche globali

**Response:**
```json
{
  "success": true,
  "overall": {
    "total": 245,
    "completed": 238,
    "failed": 7,
    "enriched": 201,
    "avg_processing_time": 18234
  },
  "daily_stats": [...]
}
```

### GET `/api/search?q=query`
Ricerca full-text nei cantieri

---

## 🗄️ Database Schema

### Tabella `construction_sites`

Campi principali:
- `id` - Primary key
- `image_path` - Path immagine su disco
- `raw_text` - Testo estratto (OCR)
- `company_name`, `legal_name`
- `vat_number`, `tax_code`
- `phone_number`, `mobile_number`, `email`, `website`
- `address`, `city`, `province`, `postal_code`
- `construction_type`, `construction_description`
- `project_name`, `project_amount`
- `perplexity_enriched` - Boolean
- `company_description`, `company_size`, `company_sector`
- `extraction_status` - `pending|processing|completed|failed`
- `confidence_score` - 0.00 to 1.00
- `processing_time_ms`
- `created_at`, `updated_at`

### Tabella `extraction_logs`

Log dettagliato di ogni step elaborazione:
- `construction_site_id`
- `step` - `upload|vision_analysis|perplexity_enrichment|completed|error`
- `status` - `started|success|failed`
- `message`, `data` (JSON)
- `duration_ms`

---

## 🐛 Troubleshooting

### Errore: "Database connection failed"

```bash
# Verifica che MySQL sia attivo
sudo systemctl status mysql

# Verifica credenziali in .env
mysql -u root -p
```

### Errore: "Claude API Error: Invalid API Key"

- Verifica che `ANTHROPIC_API_KEY` in `.env` sia corretto
- Controlla su https://console.anthropic.com/ che la key sia attiva
- Assicurati di avere credito disponibile

### Errore: "Cannot find module..."

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### Immagini non si vedono

- Verifica che backend sia su porta 5002
- Controlla che la directory `uploads/construction-sites/` esista
- Verifica permessi: `chmod -R 755 uploads/`

### Frontend non si connette al backend

Verifica proxy in `frontend/vite.config.js`:
```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5002',
      changeOrigin: true
    }
  }
}
```

### Perplexity non arricchisce i dati

- È normale se `PERPLEXITY_API_KEY` non è configurata
- Verifica che la key sia valida
- Perplexity può fallire se non trova info sull'azienda (è normale)

---

## 📊 Performance e Costi

### Tempi di Elaborazione

- **Upload immagine**: ~1-2s
- **Analisi Claude Vision**: ~8-15s
- **Arricchimento Perplexity**: ~5-10s
- **TOTALE**: ~15-30s per foto

### Costi API Stimati

**Claude API (Anthropic)**:
- Modello: `claude-3-5-sonnet-20241022`
- Input: ~$3 per milione di token
- Output: ~$15 per milione di token
- Costo per immagine: **~$0.003** (0.3 centesimi)
- 1000 immagini = ~$3

**Perplexity API**:
- Incluso nell'abbonamento PRO ($20/mese)
- Rate limit: ~50 richieste/minuto
- No costi aggiuntivi

---

## 🔒 Sicurezza

### Best Practices

1. **Non committare file `.env`** - Contiene API keys
2. **Limita dimensione upload** - Default 10MB in `server.js:50`
3. **Valida tipi file** - Solo immagini accettate
4. **Backup database** - Configura backup automatici MySQL
5. **Usa HTTPS in produzione** - Tramite reverse proxy (nginx)

### Per Deploy in Produzione

1. Cambia `NODE_ENV=production` in `.env`
2. Usa PM2 per gestire processo Node.js:
   ```bash
   npm install -g pm2
   pm2 start server.js --name construction-extractor
   pm2 save
   pm2 startup
   ```
3. Configura nginx come reverse proxy
4. Abilita rate limiting API
5. Configura SSL/TLS con Let's Encrypt

---

## 📝 TODO / Roadmap Futuri

- [ ] Elaborazione batch multipla (upload più foto insieme)
- [ ] Export dati in Excel/CSV
- [ ] API per integrazione con CRM esistente
- [ ] OCR offline con Tesseract.js (fallback se Claude non disponibile)
- [ ] Ricerca avanzata con filtri
- [ ] Dashboard analytics con grafici
- [ ] Notifiche email quando elaborazione completa
- [ ] App mobile nativa (React Native)

---

## 📄 Licenza

MIT License - Usa liberamente per progetti personali e commerciali

---

## 💡 Supporto

Per domande o problemi:
- Apri issue su repository
- Contatta: [tuo-email@example.com]

---

**Creato con ❤️ usando Claude AI e Perplexity**
