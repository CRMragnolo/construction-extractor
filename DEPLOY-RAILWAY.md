# Railway Deployment Guide

## Deploy Backend su Railway

1. Vai su: **https://railway.app**
2. Clicca **"Start a New Project"**
3. Scegli **"Deploy from GitHub repo"** o **"Empty Project"**

### Se usi GitHub:
- Pusha il codice su GitHub
- Connetti Railway al repo
- Seleziona la cartella `backend/`

### Se usi Empty Project:
- Crea nuovo progetto
- Aggiungi **"Add Service"** → **"Empty Service"**
- Nelle Settings:
  - **Start Command**: `node server.js`
  - **Root Directory**: (lascia vuoto se carichi solo backend)

### Variabili d'Ambiente Railway:

Aggiungi queste in **Variables**:

```
NODE_ENV=production
PORT=5002
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
PERPLEXITY_API_KEY=YOUR_PERPLEXITY_API_KEY_HERE
MAX_FILE_SIZE=10485760
```

### Deploy:
- Railway genererà un URL tipo: `https://xxx.railway.app`
- Copia questo URL, ti servirà per il frontend!

---

## Alternative: Render.com

Se Railway non funziona, usa **Render**:

1. Vai su: **https://render.com**
2. **New** → **Web Service**
3. Connetti GitHub o carica codice
4. **Settings**:
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment: aggiungi le stesse variabili sopra

---

## Dopo Deploy Backend:

**Copia l'URL del backend** (es: `https://construction-backend.railway.app`)

Usalo nel prossimo step per configurare il frontend!
