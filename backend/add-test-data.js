require('dotenv').config();

async function addTestData() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        console.log('⚠️  Этот скрипт только для PostgreSQL');
        process.exit(0);
    }
    
    const { dbAll, dbGet, dbRun } = require('./database/db-postgres');
    
    try {
        console.log('🎲 Добавление тестовых данных...\n');
        
        // Находим первых нескольких пользователей
        const users = await dbAll('SELECT id, full_name FROM users WHERE is_active = true LIMIT 5');
        
        if (users.length === 0) {
            console.log('❌ Нет активных пользователей для тестирования');
            return;
        }
        
        console.log(`👥 Найдено пользователей: ${users.length}`);
        
        // Добавляем тестовые транзакции
        for (const user of users) {
            // Добавляем положительную транзакцию (заработок)
            const earnAmount = Math.floor(Math.random() * 1000) + 500; // 500-1500
            await dbRun(`
                INSERT INTO transactions (to_user_id, amount, type, description, created_at)
                VALUES (?, ?, 'earn', ?, NOW())
            `, [user.id, earnAmount, `Тестовое начисление для ${user.full_name}`]);
            
            // Обновляем баланс пользователя
            await dbRun('UPDATE users SET balance = balance + ? WHERE id = ?', [earnAmount, user.id]);
            
            console.log(`✅ ${user.full_name}: +${earnAmount} ЦУП`);
            
            // Иногда добавляем трату
            if (Math.random() > 0.5) {
                const spendAmount = Math.floor(Math.random() * 200) + 50; // 50-250
                await dbRun(`
                    INSERT INTO transactions (to_user_id, amount, type, description, created_at)
                    VALUES (?, ?, 'spend', ?, NOW())
                `, [user.id, -spendAmount, `Тестовая трата для ${user.full_name}`]);
                
                // Обновляем баланс пользователя
                await dbRun('UPDATE users SET balance = balance - ? WHERE id = ?', [spendAmount, user.id]);
                
                console.log(`  💸 ${user.full_name}: -${spendAmount} ЦУП`);
            }
        }
        
        // Показываем финальную статистику
        console.log('\n📊 Финальная статистика:');
        
        const totalEarned = await dbGet('SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE amount > 0');
        console.log(`💰 Всего заработано: ${totalEarned.total}`);
        
        const totalSpent = await dbGet('SELECT COALESCE(ABS(SUM(amount)), 0) as total FROM transactions WHERE amount < 0');
        console.log(`💸 Всего потрачено: ${totalSpent.total}`);
        
        const totalEmployees = await dbGet('SELECT COUNT(*) as count FROM users WHERE is_active = true');
        console.log(`👥 Активных сотрудников: ${totalEmployees.count}`);
        
        const totalTransactions = await dbGet('SELECT COUNT(*) as count FROM transactions');
        console.log(`📊 Всего операций: ${totalTransactions.count}`);
        
        console.log('\n✅ Тестовые данные добавлены!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

// Запускаем только если вызван напрямую
if (require.main === module) {
    addTestData();
}

module.exports = addTestData;