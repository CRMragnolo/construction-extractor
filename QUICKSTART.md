# 🚀 Quick Start - Estrattore Info Cantieri

## Setup in 5 Minuti

### 1. Configura API Keys

```bash
cd /home/user/construction-site-extractor/backend
nano .env
```

Aggiungi le tue chiavi API:
```env
ANTHROPIC_API_KEY=sk-ant-api03-TUA_CHIAVE_QUI
PERPLEXITY_API_KEY=pplx-TUA_CHIAVE_PERPLEXITY
```

### 2. Inizializza Database

```bash
# Assicurati che MySQL sia attivo
sudo systemctl start mysql

# Inizializza database
npm run init-db
```

### 3. Installa Dipendenze

```bash
# Backend
cd /home/user/construction-site-extractor/backend
npm install

# Frontend
cd /home/user/construction-site-extractor/frontend
npm install
```

### 4. Avvia Applicazione

**Terminale 1 - Backend:**
```bash
cd /home/user/construction-site-extractor/backend
npm run dev
```

**Terminale 2 - Frontend:**
```bash
cd /home/user/construction-site-extractor/frontend
npm run dev
```

### 5. Apri Browser

Vai su: **http://localhost:5173**

---

## 📸 Come Usare

1. **Carica Foto** - Drag & drop o clicca per selezionare
2. **Analizza** - L'AI estrae automaticamente tutti i dati
3. **Visualizza** - Vedi risultati in 15-30 secondi
4. **Gestisci** - Tutti i cantieri salvati in tab "📋 Cantieri Estratti"

---

## ✅ Checklist Setup

- [ ] MySQL installato e attivo
- [ ] Node.js 18+ installato
- [ ] API key Anthropic Claude configurata
- [ ] API key Perplexity configurata (opzionale)
- [ ] Database inizializzato (`npm run init-db`)
- [ ] Dipendenze installate (backend + frontend)
- [ ] Backend avviato su porta 5002
- [ ] Frontend avviato su porta 5173

---

## 🆘 Problemi Comuni

**Backend non si avvia?**
```bash
# Verifica che porta 5002 sia libera
lsof -i :5002

# Se occupata, cambia PORT in .env
```

**Database connection failed?**
```bash
# Verifica credenziali MySQL in .env
mysql -u root -p
```

**API key non valida?**
- Verifica su https://console.anthropic.com/
- Assicurati di avere credito

---

## 📖 Documentazione Completa

Leggi **README.md** per:
- Architettura dettagliata
- API endpoints completi
- Database schema
- Troubleshooting avanzato
- Deploy in produzione

---

**Buon divertimento! 🎉**
