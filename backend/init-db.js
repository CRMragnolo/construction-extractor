require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('🚀 Inizializzazione database...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    // Crea database se non esiste
    const dbName = process.env.DB_NAME || 'construction_extractor';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' creato o già esistente`);

    // Seleziona database
    await connection.query(`USE ${dbName}`);

    // Leggi e esegui schema SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schema);
    console.log('✅ Schema database applicato con successo');

    console.log('\n🎉 Database inizializzato correttamente!');
  } catch (error) {
    console.error('❌ Errore durante inizializzazione:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDatabase();
