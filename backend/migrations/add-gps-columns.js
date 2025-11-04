const Database = require('better-sqlite3');
const path = require('path');

// Script di migrazione per aggiungere colonne GPS
const dbPath = path.join(__dirname, '../construction_extractor.db');
const db = new Database(dbPath);

console.log('📍 Migrazione: Aggiunta colonne GPS e metadati foto...');

try {
  // Aggiungi colonne GPS
  db.exec(`
    ALTER TABLE construction_sites ADD COLUMN gps_latitude REAL;
    ALTER TABLE construction_sites ADD COLUMN gps_longitude REAL;
    ALTER TABLE construction_sites ADD COLUMN gps_altitude REAL;
    ALTER TABLE construction_sites ADD COLUMN gps_location_address TEXT;
    ALTER TABLE construction_sites ADD COLUMN gps_location_city TEXT;
    ALTER TABLE construction_sites ADD COLUMN gps_location_province TEXT;
    ALTER TABLE construction_sites ADD COLUMN photo_datetime TEXT;
    ALTER TABLE construction_sites ADD COLUMN photo_device TEXT;
  `);

  console.log('✅ Colonne GPS aggiunte con successo!');

} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⚠️ Colonne già esistenti, skip migrazione');
  } else {
    console.error('❌ Errore migrazione:', error.message);
    throw error;
  }
} finally {
  db.close();
}
