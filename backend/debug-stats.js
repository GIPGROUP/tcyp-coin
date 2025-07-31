require('dotenv').config();

async function debugStats() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        console.log('⚠️  Этот скрипт только для PostgreSQL');
        process.exit(0);
    }
    
    const { dbAll, dbGet } = require('./database/db-postgres');
    
    try {
        console.log('🔍 Проверка данных для статистики...\n');
        
        // Проверяем количество пользователей
        const usersCount = await dbGet('SELECT COUNT(*) as count FROM users');
        console.log(`👥 Всего пользователей: ${usersCount.count}`);
        
        const activeUsersCount = await dbGet('SELECT COUNT(*) as count FROM users WHERE is_active = true');
        console.log(`👥 Активных пользователей: ${activeUsersCount.count}`);
        
        // Проверяем транзакции
        const transactionsCount = await dbGet('SELECT COUNT(*) as count FROM transactions');
        console.log(`💸 Всего транзакций: ${transactionsCount.count}`);
        
        if (transactionsCount.count > 0) {
            // Показываем структуру транзакций
            console.log('\n📊 Структура транзакций:');
            const sampleTransactions = await dbAll('SELECT * FROM transactions LIMIT 5');
            console.log(sampleTransactions);
            
            // Проверяем статистику
            const positiveTransactions = await dbGet('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE amount > 0');
            console.log(`\n💰 Положительные транзакции: ${positiveTransactions.count}, сумма: ${positiveTransactions.total}`);
            
            const negativeTransactions = await dbGet('SELECT COUNT(*) as count, COALESCE(ABS(SUM(amount)), 0) as total FROM transactions WHERE amount < 0');
            console.log(`💸 Отрицательные транзакции: ${negativeTransactions.count}, сумма: ${negativeTransactions.total}`);
        }
        
        // Проверяем балансы пользователей
        const usersWithBalance = await dbGet('SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as total FROM users WHERE balance > 0');
        console.log(`\n💰 Пользователей с балансом: ${usersWithBalance.count}, общий баланс: ${usersWithBalance.total}`);
        
        // Показываем топ пользователей по балансу
        console.log('\n🏆 Топ пользователей по балансу:');
        const topUsers = await dbAll('SELECT full_name, email, balance FROM users WHERE balance > 0 ORDER BY balance DESC LIMIT 5');
        topUsers.forEach(user => {
            console.log(`  - ${user.full_name}: ${user.balance} ЦУП`);
        });
        
        console.log('\n✅ Проверка завершена');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

// Запускаем только если вызван напрямую
if (require.main === module) {
    debugStats();
}

module.exports = debugStats;