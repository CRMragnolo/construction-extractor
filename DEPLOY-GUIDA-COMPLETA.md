# 🚀 Deploy Completo - Guida Passo Passo

## ✅ METODO SEMPLICE (senza Git)

### PARTE 1: Deploy Backend su Render.com

**1. Vai su https://render.com**
   - Registrati/Login (puoi usare Google)

**2. Crea Nuovo Web Service**
   - Click **"New +"** in alto a destra
   - Seleziona **"Web Service"**

**3. Scegli "Deploy an existing image from a registry"**
   - OPPURE: "Build and deploy from a Git repository" se hai caricato su GitHub

**4. Se NON usi Git:**
   - Scarica questa cartella: `/home/user/construction-site-extractor/backend`
   - Comprimi in ZIP
   - Carica su GitHub (crea repo pubblico temporaneo)
   - Connetti Render al repo

**5. Configurazione Render:**
   ```
   Name: construction-backend
   Environment: Node
   Build Command: npm install
   Start Command: node server.js
   Instance Type: Free
   ```

**6. Variabili d'Ambiente (Environment Variables):**

   Click **"Advanced"** → **"Add Environment Variable"**

   Aggiungi queste:
   ```
   NODE_ENV = production
   PORT = 10000
   ANTHROPIC_API_KEY = YOUR_ANTHROPIC_API_KEY_HERE
   PERPLEXITY_API_KEY = YOUR_PERPLEXITY_API_KEY_HERE
   MAX_FILE_SIZE = 10485760
   ```

**7. Deploy!**
   - Click **"Create Web Service"**
   - Attendi 3-5 minuti
   - **COPIA L'URL** che ti da (es: `https://construction-backend.onrender.com`)

---

### PARTE 2: Deploy Frontend su Vercel

**1. Vai su https://vercel.com**
   - Login con GitHub/Google

**2. Crea Nuovo Progetto**
   - Click **"Add New..."** → **"Project"**

**3. Import Repository:**
   - Se hai caricato su GitHub: seleziona il repo
   - Altrimenti: usa Vercel CLI (vedi sotto)

**4. Configurazione Vercel:**
   ```
   Framework Preset: Vite
   Root Directory: frontend (se tutto il progetto, altrimenti /)
   Build Command: npm run build
   Output Directory: dist
   ```

**5. Environment Variables:**

   Aggiungi questa variabile:
   ```
   VITE_API_URL = https://IL-TUO-URL-BACKEND.onrender.com
   ```

   ⚠️ **IMPORTANTE**: Sostituisci con l'URL che hai copiato al Passo 1.7!

**6. Deploy!**
   - Click **"Deploy"**
   - Attendi 2-3 minuti
   - **COPIA L'URL** finale (es: `https://construction-extractor.vercel.app`)

---

## 📱 TESTA DA IPHONE!

Apri Safari sull'iPhone e vai su:

### **https://TUO-URL.vercel.app**

---

## 🎯 Deploy Veloce con CLI (Alternativa)

Se hai accesso al terminale:

### Backend (Render):
```bash
cd /home/user/construction-site-extractor/backend

# Crea account Render, ottieni API key
# Poi:
render deploy
```

### Frontend (Vercel):
```bash
cd /home/user/construction-site-extractor/frontend

# Login Vercel
vercel login

# Deploy
vercel --prod

# Ti chiederà:
# - Link to existing project? No
# - Project name? construction-extractor
# - Directory? ./
# - Override settings? No

# Quando chiede VITE_API_URL inserisci:
# https://IL-TUO-BACKEND.onrender.com
```

---

## 🔧 Troubleshooting

### Backend non parte su Render?
- Verifica che `server.js` esista
- Controlla logs: Dashboard → Service → Logs
- Assicurati che ascolti su `process.env.PORT`

### Frontend non carica API?
- Verifica che VITE_API_URL sia corretto
- Deve iniziare con `https://`
- Controlla console browser (F12)

### CORS errors?
- Verifica che backend accetti l'origin del frontend
- In `server.js` linea 34 aggiungi l'URL Vercel

---

## 💰 Costi

- **Render Free Tier**: Gratis per sempre (dorme dopo 15min inattività)
- **Vercel Free Tier**: Gratis per sempre
- **Total**: €0/mese 🎉

---

## 🎉 Fatto!

Una volta deployato, l'app sarà accessibile da:
- ✅ iPhone
- ✅ Android
- ✅ Computer
- ✅ Qualsiasi dispositivo con internet

URL tipo: `https://construction-extractor.vercel.app`

---

**Serve aiuto?** Dimmi a che punto sei bloccato! 😊
