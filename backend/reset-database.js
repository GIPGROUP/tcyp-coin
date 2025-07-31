require('dotenv').config();

async function resetDatabase() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        console.log('⚠️  Этот скрипт только для PostgreSQL');
        process.exit(0);
    }
    
    const { dbRun, dbGet } = require('./database/db-postgres');
    
    try {
        console.log('🔴 ВНИМАНИЕ! Это удалит ВСЕ данные из базы!\n');
        console.log('⏱️  Ждем 5 секунд... Нажмите Ctrl+C для отмены\n');
        
        // Даем время на отмену
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('🧹 Полный сброс базы данных...\n');
        
        // Начинаем транзакцию
        await dbRun('BEGIN TRANSACTION');
        
        try {
            // 1. Удаляем все из всех таблиц
            console.log('📊 Удаление данных из таблиц...');
            
            await dbRun('DELETE FROM transactions');
            console.log('  ✅ Очищена таблица transactions');
            
            await dbRun('DELETE FROM requests');
            console.log('  ✅ Очищена таблица requests');
            
            await dbRun('DELETE FROM admin_actions');
            console.log('  ✅ Очищена таблица admin_actions');
            
            await dbRun('DELETE FROM roulette_history');
            console.log('  ✅ Очищена таблица roulette_history');
            
            await dbRun('DELETE FROM users');
            console.log('  ✅ Очищена таблица users');
            
            // Коммитим транзакцию
            await dbRun('COMMIT');
            
            console.log('\n✅ База данных полностью очищена!');
            console.log('\n📝 Теперь нужно:\n');
            console.log('1. Передеплоить приложение на Render.com');
            console.log('2. При старте автоматически создадутся новые пользователи из auto-import-employees.js');
            console.log('3. Пароль для всех: tcyp2025');
            
        } catch (error) {
            await dbRun('ROLLBACK');
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

// Запускаем только если вызван напрямую
if (require.main === module) {
    resetDatabase();
}

module.exports = resetDatabase;