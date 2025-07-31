const fs = require('fs');
const path = require('path');

// Файл-флаг для отслеживания выполнения обновления
const UPDATE_FLAG_FILE = path.join(__dirname, '.employee-update-2025-01-31-v2.done');

async function runOneTimeUpdate() {
    // Проверяем, было ли уже выполнено обновление
    if (fs.existsSync(UPDATE_FLAG_FILE)) {
        console.log('✅ Обновление данных сотрудников уже было выполнено');
        return;
    }
    
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    if (!isPostgreSQL) {
        return; // Только для production
    }
    
    try {
        console.log('🔄 Запускаем одноразовое обновление данных сотрудников...');
        
        // Запускаем обновление
        const updateScript = require('./update-employees-correct-data');
        
        // Создаем файл-флаг
        fs.writeFileSync(UPDATE_FLAG_FILE, new Date().toISOString());
        console.log('✅ Обновление данных завершено');
        
    } catch (error) {
        console.error('❌ Ошибка при обновлении данных:', error);
    }
}

module.exports = { runOneTimeUpdate };