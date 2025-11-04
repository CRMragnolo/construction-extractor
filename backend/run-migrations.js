const fs = require('fs');
const path = require('path');

console.log('🔄 Esecuzione migrazioni database...');

const migrationsDir = path.join(__dirname, 'migrations');
const migrations = [
  'add-gps-columns.js',
  'update-extraction-logs-steps.js',
  'add-manual-input-step.js'
];

try {
  for (const migration of migrations) {
    const migrationPath = path.join(migrationsDir, migration);

    if (fs.existsSync(migrationPath)) {
      console.log(`▶️  Esecuzione: ${migration}`);
      require(migrationPath);
    }
  }

  console.log('✅ Tutte le migrazioni eseguite con successo!\n');
} catch (error) {
  console.error('❌ Errore durante le migrazioni:', error.message);
  // Non bloccare l'avvio del server per errori di migrazione
  // (potrebbero essere già state eseguite)
}
