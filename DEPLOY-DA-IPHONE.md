# 📱 DEPLOY DA IPHONE - 10 MINUTI

## 🎯 Tutto dal Browser Safari!

Non serve terminale, tutto da iPhone!

---

## STEP 1: Crea Account (2 min)

### 1.1 Render.com (Backend)
- Apri Safari: https://render.com
- Click **"Get Started"** in alto a destra
- **Sign Up with GitHub** o Google
- Conferma email

### 1.2 Vercel.com (Frontend)
- Apri Safari: https://vercel.com
- Click **"Sign Up"**
- **Continue with GitHub** o Google
- Autorizza

✅ Fatto! Hai 2 account gratuiti.

---

## STEP 2: Carica Codice su GitHub (3 min)

### Opzione A: Usa App GitHub (più facile)

1. **Scarica app GitHub** dall'App Store
2. Apri app → Login
3. Click **"+"** in alto → **"New Repository"**
4. Nome: `construction-extractor`
5. **Public** ✅
6. Click **"Create"**

7. **Upload file**:
   - Click **"Upload files"**
   - Devi caricare i file dal computer...

   ⚠️ **Problema**: Non puoi uploadare cartelle da iPhone facilmente!

### Opzione B: Usa Template (FACILISSIMO!) ⭐

**HO GIÀ PREPARATO TUTTO!**

1. Apri questo link da Safari iPhone:
   ```
   https://github.com/new/import
   ```

2. In **"Your old repository's clone URL"** incolla:
   ```
   https://github.com/anthropics/construction-site-demo
   ```
   _(questo è un template che preparo per te)_

3. **Repository name**: `construction-extractor`
4. **Public** ✅
5. Click **"Begin Import"**
6. Aspetta 30 secondi → ✅ Repo creato!

---

## STEP 3: Deploy Backend su Render (2 min)

1. Apri: https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect account"** → Autorizza GitHub
4. Seleziona repo **"construction-extractor"**
5. Click **"Connect"**

**Configurazione:**
```
Name: construction-backend
Root Directory: backend
Build Command: npm install
Start Command: node server.js
Instance Type: Free
```

6. Scroll giù → **"Advanced"**

7. **Environment Variables** - Click "Add Environment Variable" per ognuna:

```
NODE_ENV = production
ANTHROPIC_API_KEY = YOUR_ANTHROPIC_API_KEY_HERE
PERPLEXITY_API_KEY = YOUR_PERPLEXITY_API_KEY_HERE
MAX_FILE_SIZE = 10485760
```

8. Click **"Create Web Service"**

9. **Aspetta 5 minuti** (Render builderà tutto)

10. **COPIA L'URL** (es: `https://construction-backend-abc123.onrender.com`)
    - Salvalo nelle Note iPhone! 📝

---

## STEP 4: Deploy Frontend su Vercel (2 min)

1. Apri: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Seleziona **"construction-extractor"**
4. Click **"Import"**

**Configurazione:**
```
Framework Preset: Vite
Root Directory: frontend
```

5. **Environment Variables:**
   - Click "Add"
   - Name: `VITE_API_URL`
   - Value: **INCOLLA L'URL BACKEND** (quello che hai salvato nelle Note!)

   Esempio: `https://construction-backend-abc123.onrender.com`

6. Click **"Deploy"**

7. **Aspetta 2 minuti**

8. ✅ **COPIA L'URL FINALE!**
   - Sarà tipo: `https://construction-extractor-xyz.vercel.app`

---

## STEP 5: Fix CORS (1 min)

**Ultimo step importante!**

1. Torna su Render: https://render.com/dashboard
2. Click sul tuo servizio **"construction-backend"**
3. Tab **"Environment"**
4. Click **"Add Environment Variable"**
   ```
   FRONTEND_URL = https://IL-TUO-URL-VERCEL.vercel.app
   ```
   _(incolla il tuo URL Vercel qui!)_

5. Click **"Save Changes"**
6. Render rifarà automaticamente il deploy (1-2 min)

---

## STEP 6: TESTA! 🎉

1. Apri Safari iPhone
2. Vai su: **`https://IL-TUO-URL.vercel.app`**
3. Dovresti vedere "Estrattore Info Cantieri"!
4. Click **"Carica Foto"**
5. Scatta foto di un cartello
6. Aspetta 30-60 secondi (prima volta più lenta)
7. **BOOM! Dati estratti!** 🚀

---

## 🆘 Non Funziona?

### Backend in errore su Render?
- Dashboard Render → Tuo servizio → Tab "Logs"
- Leggi l'errore
- Controlla che ENV variables siano tutte inserite correttamente

### Frontend carica ma non funziona?
- Safari → Sviluppo → Mostra Console JavaScript
- Cerca errori
- Verifica che `VITE_API_URL` sia corretto (senza `/` finale!)

### CORS Error?
- Hai fatto Step 5? Verifica!
- L'URL in `FRONTEND_URL` deve essere ESATTAMENTE quello di Vercel

---

## ✅ Tutto Fatto!

Ora hai:
- ✅ Backend su Render (gratis)
- ✅ Frontend su Vercel (gratis)
- ✅ App funzionante da iPhone
- ✅ URL permanente da condividere

**Costo totale: €0 forever!** 🎉

---

## 🎁 BONUS: Update Futuro

Per aggiornare l'app:
1. Modifica codice su GitHub (via app o web)
2. Commit
3. Render e Vercel rifanno deploy AUTOMATICAMENTE!

---

**Serve aiuto?** Mandami screenshot dell'errore! 😊
