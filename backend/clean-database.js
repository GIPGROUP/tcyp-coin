require('dotenv').config();

async function cleanDatabase() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        console.log('⚠️  Этот скрипт только для PostgreSQL');
        process.exit(0);
    }
    
    const { dbRun, dbGet } = require('./database/db-postgres');
    
    try {
        console.log('🧹 Очистка базы данных...\n');
        
        // Начинаем транзакцию
        await dbRun('BEGIN TRANSACTION');
        
        try {
            // 1. Удаляем все транзакции
            const transResult = await dbRun('DELETE FROM transactions');
            console.log(`✅ Удалено транзакций: ${transResult.changes}`);
            
            // 2. Удаляем все заявки
            const reqResult = await dbRun('DELETE FROM requests');
            console.log(`✅ Удалено заявок: ${reqResult.changes}`);
            
            // 3. Удаляем все действия администраторов
            const actResult = await dbRun('DELETE FROM admin_actions');
            console.log(`✅ Удалено действий администраторов: ${actResult.changes}`);
            
            // 4. Обнуляем балансы всех пользователей
            const balResult = await dbRun('UPDATE users SET balance = 0');
            console.log(`✅ Обнулено балансов: ${balResult.changes}`);
            
            // 5. Очищаем историю рулетки
            const roulResult = await dbRun('DELETE FROM roulette_history');
            console.log(`✅ Очищена история рулетки: ${roulResult.changes}`);
            
            // Коммитим транзакцию
            await dbRun('COMMIT');
            
            console.log('\n✅ База данных очищена!');
            console.log('📝 Пользователи сохранены, но их балансы обнулены');
            console.log('📝 Все транзакции, заявки и история удалены');
            
            // Показываем количество пользователей
            const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
            console.log(`\n👥 Осталось пользователей: ${userCount.count}`);
            
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
    cleanDatabase();
}

module.exports = cleanDatabase;