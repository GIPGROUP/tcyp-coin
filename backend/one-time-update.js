const fs = require('fs');
const path = require('path');

// Файл-флаг для отслеживания выполнения обновления
const UPDATE_FLAG_FILE = path.join(__dirname, '.employee-update-2025-01-31-v3-clear-positions.done');

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
        console.log('🔄 Запускаем одноразовое обновление...');
        
        // Запускаем обновление сотрудников
        const updateScript = require('./update-employees-correct-data');
        await updateScript();
        
        // Очищаем должности
        console.log('\n🧹 Очищаем все должности...');
        const clearPositions = require('./clear-positions');
        
        // Создаем файл-флаг
        fs.writeFileSync(UPDATE_FLAG_FILE, new Date().toISOString());
        console.log('✅ Обновление завершено');
        
    } catch (error) {
        console.error('❌ Ошибка при обновлении:', error);
    }
}

module.exports = { runOneTimeUpdate };