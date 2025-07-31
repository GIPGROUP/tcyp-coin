require('dotenv').config();

// Проверяем наличие параметра --force
const forceUpdate = process.argv.includes('--force');

if (!forceUpdate) {
    console.log('⚠️  Для запуска обновления используйте: node backend/manual-update.js --force');
    process.exit(0);
}

console.log('🚀 Запуск принудительного обновления сотрудников...\n');

// Запускаем обновление
require('./force-update-employees');