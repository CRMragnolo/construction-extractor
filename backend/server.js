require('dotenv').config();

// Esegui migrazioni database prima di tutto
try {
  require('./run-migrations');
} catch (error) {
  console.warn('⚠️ Migrazioni non eseguite (probabilmente già applicate):', error.message);
}

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
const ExifService = require('./services/ExifService');

// Import servizi
const VisionService = require('./services/VisionService');
const PerplexityService = require('./services/PerplexityService');

const app = express();
const PORT = process.env.PORT || 5002;

// ========= LOGGING =========
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// ========= MIDDLEWARE =========
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://21.0.0.188:5173', 'https://construction-extractor.vercel.app'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// ========= DATABASE CONNECTION (SQLite) =========
const dbPath = path.join(__dirname, 'construction_extractor.db');
const db = new Database(dbPath);

// Abilita foreign keys
db.pragma('foreign_keys = ON');

logger.info(`✅ Database SQLite connesso: ${dbPath}`);

// Helper per query
const query = (sql, params = []) => {
  try {
    return db.prepare(sql).all(params);
  } catch (error) {
    logger.error('Query error:', error, { sql, params });
    throw error;
  }
};

const run = (sql, params = []) => {
  try {
    return db.prepare(sql).run(params);
  } catch (error) {
    logger.error('Run error:', error, { sql, params });
    throw error;
  }
};

// ========= MULTER UPLOAD CONFIGURATION =========
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/construction-sites';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo file non supportato. Usa JPG, PNG, WEBP o HEIC'));
    }
  }
});

// ========= HELPER FUNCTIONS =========
function logExtractionStep(siteId, step, status, message = null, data = null, duration = null) {
  try {
    run(
      `INSERT INTO extraction_logs (construction_site_id, step, status, message, data, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [siteId, step, status, message, data ? JSON.stringify(data) : null, duration]
    );
  } catch (error) {
    logger.error('Errore logging step:', error);
  }
}

function updateSiteStatus(siteId, status, error = null) {
  run(
    `UPDATE construction_sites SET extraction_status = ?, extraction_error = ?, updated_at = datetime('now') WHERE id = ?`,
    [status, error, siteId]
  );
}

// ========= API ROUTES =========

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'sqlite' });
});

// Upload e elabora immagine cantiere
app.post('/api/upload', upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  let siteId = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessuna immagine caricata' });
    }

    logger.info(`📸 Immagine ricevuta: ${req.file.filename} (${req.file.size} bytes)`);

    // Ottieni dimensioni immagine
    const imageMetadata = await sharp(req.file.path).metadata();

    // Salva record iniziale nel database
    const result = run(
      `INSERT INTO construction_sites
       (image_path, image_filename, image_size, image_mimetype, image_width, image_height, extraction_status)
       VALUES (?, ?, ?, ?, ?, ?, 'processing')`,
      [
        req.file.path,
        req.file.filename,
        req.file.size,
        req.file.mimetype,
        imageMetadata.width,
        imageMetadata.height
      ]
    );

    siteId = result.lastInsertRowid;
    logExtractionStep(siteId, 'upload', 'success', 'Immagine caricata con successo');

    // STEP 0: Estrazione metadati GPS dalla foto
    let gpsMetadata = null;
    try {
      logger.info(`📍 Estrazione metadati GPS dalla foto...`);
      const exifService = new ExifService();
      gpsMetadata = await exifService.extractMetadata(req.file.path);

      if (gpsMetadata.has_metadata) {
        logger.info(`✅ GPS trovato: ${gpsMetadata.gps?.coordinates_string || 'N/A'}`);
        if (gpsMetadata.location) {
          logger.info(`📍 Località: ${gpsMetadata.location.formatted_address}`);
        }
        logExtractionStep(siteId, 'gps_extraction', 'success',
          'Metadati GPS estratti', gpsMetadata);
      } else {
        logger.warn(`⚠️ Nessun GPS nei metadati foto`);
        logExtractionStep(siteId, 'gps_extraction', 'warning',
          'Nessun GPS trovato');
      }
    } catch (gpsError) {
      logger.warn(`⚠️ Errore estrazione GPS: ${gpsError.message}`);
      logExtractionStep(siteId, 'gps_extraction', 'failed', gpsError.message);
    }

    // STEP 1: Analisi immagine con Claude Vision API
    logger.info(`🔍 Inizio analisi AI per site ID ${siteId}...`);
    const visionStart = Date.now();

    const visionService = new VisionService(process.env.ANTHROPIC_API_KEY);
    const extractedData = await visionService.analyzeConstructionSite(req.file.path);

    const visionDuration = Date.now() - visionStart;
    logExtractionStep(siteId, 'vision_analysis', 'success',
      'Dati estratti da AI', extractedData, visionDuration);

    // STEP 2: Validazione e correzione con Perplexity
    let finalData = extractedData; // Default: usa dati estratti
    let validationResult = null;

    if (extractedData.company_name && process.env.PERPLEXITY_API_KEY) {
      try {
        logger.info(`🔍 Validazione e correzione dati con Perplexity per: ${extractedData.company_name}`);
        const perplexityStart = Date.now();

        const perplexityService = new PerplexityService(process.env.PERPLEXITY_API_KEY);
        validationResult = await perplexityService.validateAndCorrectData(extractedData);

        const perplexityDuration = Date.now() - perplexityStart;

        if (validationResult.company_found && validationResult.validated_data) {
          // Usa dati validati invece di quelli raw
          finalData = {
            ...validationResult.validated_data,
            raw_text: extractedData.raw_text, // Mantieni testo originale
            construction_type: extractedData.construction_type,
            construction_description: extractedData.construction_description,
            project_name: extractedData.project_name,
            project_amount: extractedData.project_amount,
            confidence_score: validationResult.confidence_score
          };

          logger.info(`✅ Dati validati e corretti. Confidence: ${validationResult.confidence_score}`);
          if (validationResult.corrections_made && validationResult.corrections_made.length > 0) {
            logger.info(`📝 Correzioni applicate: ${validationResult.corrections_made.join(', ')}`);
          }

          logExtractionStep(siteId, 'perplexity_validation', 'success',
            `Dati validati. Correzioni: ${validationResult.corrections_made?.length || 0}`,
            validationResult, perplexityDuration);
        } else {
          logger.warn(`⚠️ Azienda non trovata online, uso dati estratti dall'immagine`);
          logExtractionStep(siteId, 'perplexity_validation', 'warning',
            'Azienda non trovata online', null, perplexityDuration);
        }

      } catch (validationError) {
        logger.error('⚠️ Errore validazione Perplexity:', {
          message: validationError.message,
          stack: validationError.stack,
          response: validationError.response?.data
        });
        logExtractionStep(siteId, 'perplexity_validation', 'failed', validationError.message);
        // Continua con dati estratti in caso di errore
      }
    }

    // STEP 3: Integra dati GPS se disponibili e mancanti
    if (gpsMetadata?.has_metadata && gpsMetadata.location) {
      const gpsLocation = gpsMetadata.location.address;

      // Auto-completa città se manca
      if (!finalData.city && gpsLocation.city) {
        finalData.city = gpsLocation.city;
        logger.info(`📍 Città auto-compilata da GPS: ${gpsLocation.city}`);
      }

      // Auto-completa provincia se manca
      if (!finalData.province && gpsLocation.province) {
        finalData.province = gpsLocation.province;
        logger.info(`📍 Provincia auto-compilata da GPS: ${gpsLocation.province}`);
      }

      // Auto-completa indirizzo se manca
      if (!finalData.address && gpsMetadata.location.formatted_address) {
        finalData.address = gpsMetadata.location.formatted_address;
        logger.info(`📍 Indirizzo auto-compilato da GPS: ${gpsMetadata.location.formatted_address}`);
      }

      // Auto-completa CAP se manca
      if (!finalData.postal_code && gpsLocation.postcode) {
        finalData.postal_code = gpsLocation.postcode;
        logger.info(`📍 CAP auto-compilato da GPS: ${gpsLocation.postcode}`);
      }
    }

    // Salva dati finali (validati o estratti + GPS)
    run(
      `UPDATE construction_sites SET
        raw_text = ?,
        company_name = ?,
        legal_name = ?,
        vat_number = ?,
        tax_code = ?,
        phone_number = ?,
        mobile_number = ?,
        email = ?,
        website = ?,
        address = ?,
        city = ?,
        province = ?,
        postal_code = ?,
        construction_type = ?,
        construction_description = ?,
        project_name = ?,
        project_amount = ?,
        confidence_score = ?,
        perplexity_enriched = ?,
        company_description = ?,
        company_size = ?,
        company_founded_year = ?,
        company_employees = ?,
        company_sector = ?,
        company_certifications = ?,
        social_media = ?,
        gps_latitude = ?,
        gps_longitude = ?,
        gps_altitude = ?,
        gps_location_address = ?,
        gps_location_city = ?,
        gps_location_province = ?,
        photo_datetime = ?,
        photo_device = ?
      WHERE id = ?`,
      [
        finalData.raw_text || null,
        finalData.company_name || null,
        finalData.legal_name || null,
        finalData.vat_number || null,
        finalData.tax_code || null,
        finalData.phone_number || null,
        finalData.mobile_number || null,
        finalData.email || null,
        finalData.website || null,
        finalData.address || null,
        finalData.city || null,
        finalData.province || null,
        finalData.postal_code || null,
        finalData.construction_type || null,
        finalData.construction_description || null,
        finalData.project_name || null,
        finalData.project_amount || null,
        finalData.confidence_score || null,
        validationResult?.company_found ? 1 : 0,
        validationResult?.enriched_data?.description || null,
        validationResult?.enriched_data?.company_size || null,
        validationResult?.enriched_data?.founded_year || null,
        validationResult?.enriched_data?.employees || null,
        validationResult?.enriched_data?.sector || null,
        JSON.stringify(validationResult?.enriched_data?.certifications || []),
        JSON.stringify(validationResult?.enriched_data?.social_media || {}),
        gpsMetadata?.gps?.latitude || null,
        gpsMetadata?.gps?.longitude || null,
        gpsMetadata?.gps?.altitude || null,
        gpsMetadata?.location?.formatted_address || null,
        gpsMetadata?.location?.address?.city || null,
        gpsMetadata?.location?.address?.province || null,
        gpsMetadata?.datetime?.iso || null,
        gpsMetadata?.device?.full_name || null,
        siteId
      ]
    );

    // Finalizza
    const totalDuration = Date.now() - startTime;
    run(
      `UPDATE construction_sites SET extraction_status = ?, processing_time_ms = ? WHERE id = ?`,
      ['completed', totalDuration, siteId]
    );
    logExtractionStep(siteId, 'completed', 'success',
      `Elaborazione completata in ${totalDuration}ms`);

    logger.info(`✅ Elaborazione completata per site ID ${siteId} in ${totalDuration}ms`);

    // Recupera dati completi per risposta
    const sites = query('SELECT * FROM construction_sites WHERE id = ?', [siteId]);

    res.json({
      success: true,
      site_id: siteId,
      processing_time: totalDuration,
      data: finalData, // Dati validati
      validation: {
        was_validated: validationResult?.company_found || false,
        corrections_made: validationResult?.corrections_made || [],
        confidence_score: finalData.confidence_score
      },
      enriched_data: validationResult?.enriched_data || null,
      database_record: sites[0]
    });

  } catch (error) {
    logger.error('❌ Errore elaborazione:', error);

    if (siteId) {
      updateSiteStatus(siteId, 'failed', error.message);
      logExtractionStep(siteId, 'error', 'failed', error.message);
    }

    res.status(500).json({
      error: 'Errore durante elaborazione immagine',
      message: error.message,
      site_id: siteId
    });
  }
});

// Recupera tutti i cantieri estratti
app.get('/api/sites', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM construction_sites';
    const params = [];

    if (status) {
      sql += ' WHERE extraction_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const sites = query(sql, params);

    // Count totale
    let countSql = 'SELECT COUNT(*) as total FROM construction_sites';
    const countParams = [];
    if (status) {
      countSql += ' WHERE extraction_status = ?';
      countParams.push(status);
    }
    const countResult = query(countSql, countParams);

    res.json({
      success: true,
      sites,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Errore recupero sites:', error);
    res.status(500).json({ error: error.message });
  }
});

// Recupera singolo cantiere con logs
app.get('/api/sites/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sites = query('SELECT * FROM construction_sites WHERE id = ?', [id]);

    if (sites.length === 0) {
      return res.status(404).json({ error: 'Cantiere non trovato' });
    }

    const logs = query(
      'SELECT * FROM extraction_logs WHERE construction_site_id = ? ORDER BY created_at ASC',
      [id]
    );

    res.json({
      success: true,
      site: sites[0],
      logs
    });
  } catch (error) {
    logger.error('Errore recupero site:', error);
    res.status(500).json({ error: error.message });
  }
});

// Elimina cantiere
app.delete('/api/sites/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Recupera path immagine per eliminarla
    const sites = query('SELECT image_path FROM construction_sites WHERE id = ?', [id]);

    if (sites.length > 0) {
      try {
        await fs.unlink(sites[0].image_path);
      } catch (unlinkError) {
        logger.warn('Impossibile eliminare immagine:', unlinkError);
      }
    }

    run('DELETE FROM construction_sites WHERE id = ?', [id]);

    res.json({ success: true, message: 'Cantiere eliminato' });
  } catch (error) {
    logger.error('Errore eliminazione site:', error);
    res.status(500).json({ error: error.message });
  }
});

// Statistiche
app.get('/api/stats', async (req, res) => {
  try {
    const totals = query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN extraction_status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN extraction_status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN perplexity_enriched = 1 THEN 1 ELSE 0 END) as enriched,
        AVG(processing_time_ms) as avg_processing_time
      FROM construction_sites
    `);

    res.json({
      success: true,
      overall: totals[0]
    });
  } catch (error) {
    logger.error('Errore statistiche:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ricerca
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Query di ricerca mancante' });
    }

    const results = query(
      `SELECT * FROM construction_sites
       WHERE company_name LIKE ? OR legal_name LIKE ? OR address LIKE ? OR raw_text LIKE ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
    );

    res.json({
      success: true,
      results,
      count: results.length
    });
  } catch (error) {
    logger.error('Errore ricerca:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========= ERROR HANDLING =========
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Errore interno del server', message: err.message });
});

// ========= START SERVER =========
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Construction Site Extractor API running on port ${PORT}`);
  logger.info(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🗄️  Database: SQLite (${dbPath})`);
  logger.info(`🌐 CORS enabled for: http://localhost:5173`);
  logger.info(`📱 Network access: http://21.0.0.188:${PORT}`);
});

process.on('SIGINT', async () => {
  logger.info('🛑 Shutting down gracefully...');
  db.close();
  process.exit(0);
});
