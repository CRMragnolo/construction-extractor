# Construction Site Extractor - Backend

Backend API per estrazione automatica informazioni da cartelli di cantiere.

## Deploy su Render/Railway

### Variabili d'Ambiente Richieste:

```env
NODE_ENV=production
PORT=10000
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
PERPLEXITY_API_KEY=YOUR_PERPLEXITY_API_KEY_HERE
MAX_FILE_SIZE=10485760
```

### Comandi Deploy:

- **Build**: `npm install`
- **Start**: `node server.js`

### Database:

Usa SQLite (embedded, nessuna configurazione necessaria).
Il file `construction_extractor.db` viene creato automaticamente all'avvio.

### Endpoints Principali:

- `POST /api/upload` - Carica e analizza immagine
- `GET /api/sites` - Lista cantieri estratti
- `GET /api/stats` - Statistiche
- `GET /health` - Health check

### Porta:

Il server ascolta su `process.env.PORT` (default 5002 in dev, configurato dal provider in prod).
