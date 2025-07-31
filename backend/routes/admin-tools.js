const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Выбираем правильную БД в зависимости от окружения
const isProduction = process.env.NODE_ENV === 'production';
const { dbRun, dbGet } = isProduction 
  ? require('../database/db-postgres')
  : require('../database/db');

const router = express.Router();

// Все роуты требуют авторизации и прав администратора
router.use(authenticateToken, requireAdmin);

// Очистить базу данных (мягкая очистка)
router.post('/clean-database', async (req, res) => {
    try {
        console.log('🧹 Запрос на очистку базы данных от администратора...');
        
        // Начинаем транзакцию
        await dbRun(isProduction ? 'BEGIN' : 'BEGIN TRANSACTION');
        
        try {
            const results = {};
            
            // 1. Удаляем все транзакции
            const transResult = await dbRun('DELETE FROM transactions');
            results.transactions = transResult.changes || 0;
            
            // 2. Удаляем все заявки
            const reqResult = await dbRun('DELETE FROM requests');
            results.requests = reqResult.changes || 0;
            
            // 3. Удаляем все действия администраторов
            const actResult = await dbRun('DELETE FROM admin_actions');
            results.adminActions = actResult.changes || 0;
            
            // 4. Обнуляем балансы всех пользователей
            const balResult = await dbRun('UPDATE users SET balance = 0');
            results.balancesReset = balResult.changes || 0;
            
            // 5. Очищаем историю рулетки (если таблица существует)
            try {
                const roulResult = await dbRun('DELETE FROM roulette_history');
                results.rouletteHistory = roulResult.changes || 0;
            } catch (e) {
                results.rouletteHistory = 0;
            }
            
            // Коммитим транзакцию
            await dbRun('COMMIT');
            
            // Получаем количество оставшихся пользователей
            const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
            results.remainingUsers = userCount.count;
            
            console.log('✅ База данных успешно очищена');
            
            res.json({
                success: true,
                message: 'База данных успешно очищена',
                results: {
                    deletedTransactions: results.transactions,
                    deletedRequests: results.requests,
                    deletedAdminActions: results.adminActions,
                    resetBalances: results.balancesReset,
                    deletedRouletteHistory: results.rouletteHistory,
                    remainingUsers: results.remainingUsers
                }
            });
            
        } catch (error) {
            await dbRun('ROLLBACK');
            throw error;
        }
        
    } catch (error) {
        console.error('❌ Ошибка при очистке базы данных:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ошибка при очистке базы данных',
            error: error.message 
        });
    }
});

module.exports = router;