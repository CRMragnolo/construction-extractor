# 📱 DEPLOY RAPIDO PER IPHONE - 15 MINUTI

## 🎯 Obiettivo
Far funzionare l'app da iPhone in 15 minuti!

---

## STEP 1: Carica Codice su GitHub (5 min)

### Opzione A: Hai Git/GitHub?

```bash
cd /home/user/construction-site-extractor

# Inizializza git
git init
git add .
git commit -m "Initial commit - Construction Site Extractor"

# Crea repo su GitHub.com (fallo manualmente online)
# Poi:
git remote add origin https://github.com/TUO-USERNAME/construction-extractor.git
git push -u origin main
```

### Opzione B: NON hai Git?

1. Vai su https://github.com/new
2. Crea repo pubblico "construction-extractor"
3. Carica manualmente i file:
   - Trascina cartella `backend/` → upload
   - Trascina cartella `frontend/` → upload

---

## STEP 2: Deploy Backend su Render (5 min)

1. **Vai su: https://render.com**
2. **Sign Up** con Google/GitHub
3. Click **"New +"** → **"Web Service"**
4. **Connect GitHub repository**
   - Autorizza Render ad accedere a GitHub
   - Seleziona repo `construction-extractor`
5. **Configurazione:**
   ```
   Name: construction-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: node server.js
   Instance Type: Free
   ```

6. **Environment Variables** (click "Advanced"):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `ANTHROPIC_API_KEY` | `YOUR_ANTHROPIC_API_KEY_HERE` |
   | `PERPLEXITY_API_KEY` | `YOUR_PERPLEXITY_API_KEY_HERE` |
   | `MAX_FILE_SIZE` | `10485760` |

7. Click **"Create Web Service"**

8. **ASPETTA 3-5 MINUTI** mentre builda

9. **COPIA L'URL** (es: `https://construction-backend.onrender.com`)
   - Salvalo, ti serve dopo!

---

## STEP 3: Deploy Frontend su Vercel (5 min)

1. **Vai su: https://vercel.com**
2. **Sign Up** con GitHub
3. Click **"Add New..."** → **"Project"**
4. **Import repository:**
   - Seleziona `construction-extractor`
5. **Configurazione:**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

6. **Environment Variables:**

   Click "Environment Variables" → Add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://IL-TUO-BACKEND-URL.onrender.com` |

   ⚠️ **SOSTITUISCI** con l'URL che hai copiato allo Step 2.9!

7. Click **"Deploy"**

8. **ASPETTA 2-3 MINUTI**

9. **COPIA L'URL FINALE** (es: `https://construction-extractor.vercel.app`)

---

## STEP 4: Configura CORS nel Backend

**Importante!** Devi aggiungere l'URL Vercel al CORS del backend.

1. Vai su Render dashboard → Tuo servizio backend
2. **Environment** → Aggiungi variabile:
   ```
   FRONTEND_URL = https://IL-TUO-URL.vercel.app
   ```

3. Oppure modifica `server.js` su GitHub:
   - Trova riga 34: `origin: ['http://localhost:5173', ...]`
   - Aggiungi: `'https://IL-TUO-URL.vercel.app'`
   - Commit e push
   - Render rifarà il deploy automaticamente

---

## STEP 5: TESTA DA IPHONE! 📱

1. Apri **Safari** sull'iPhone
2. Vai su: **`https://IL-TUO-URL.vercel.app`**
3. Dovresti vedere l'app!
4. **Scatta una foto** di un cartello
5. **Caricala** e aspetta 15-30 secondi
6. **BOOM!** Dati estratti! 🎉

---

## 🆘 Problemi?

### Backend dice "Application failed to respond"
- Vai su Render → Logs
- Controlla errori
- Assicurati che tutte le ENV variables siano corrette

### Frontend carica ma non funziona?
- Apri console browser (Safari → Sviluppo → Console)
- Cerca errori CORS o Network
- Verifica che `VITE_API_URL` sia corretto

### "CORS policy error"
- Torna allo Step 4
- Aggiungi l'URL Vercel al CORS del backend

---

## ✅ Checklist Finale

- [ ] Codice su GitHub
- [ ] Backend deployato su Render (URL copiato)
- [ ] Frontend deployato su Vercel (URL copiato)
- [ ] CORS configurato
- [ ] App funziona da iPhone!

---

## 💡 Tip

**Prima volta Render Free**: Il backend si "addormenta" dopo 15 min di inattività.
Quando carichi una foto, potrebbe impiegare 30-60 secondi la prima volta (per svegliarsi).
Dopo è veloce!

Se vuoi evitarlo: upgrade a Render Hobby ($7/mese) o usa Railway/Fly.io.

---

**Fatto?** Dimmi l'URL finale e provo da qui! 😊
