/**
 * Skrypt do tworzenia kopii zapasowych danych użytkownika
 */

const fs = require('fs');
const path = require('path');

function createBackup() {
  console.log('💾 Tworzenie kopii zapasowej danych...\n');

  const backupDir = 'backups';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  // Stwórz folder backups
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Przykładowe dane do backup (w rzeczywistości byłyby pobierane z localStorage)
  const backupData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    data: {
      progress: {},
      settings: {},
      quizResults: {},
      images: {}
    }
  };

  try {
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`✅ Kopia zapasowa utworzona: ${backupFile}`);
  } catch (error) {
    console.error(`❌ Błąd tworzenia kopii: ${error.message}`);
  }
}

if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };