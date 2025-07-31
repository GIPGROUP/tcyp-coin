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
            console.log('Удаляем транзакции...');
            const transResult = await dbRun('DELETE FROM transactions');
            results.transactions = transResult.changes || 0;
            console.log(`Удалено транзакций: ${results.transactions}`);
            
            // 2. Удаляем все заявки
            console.log('Удаляем заявки...');
            const reqResult = await dbRun('DELETE FROM requests');
            results.requests = reqResult.changes || 0;
            console.log(`Удалено заявок: ${results.requests}`);
            
            // 3. Удаляем все действия администраторов
            console.log('Удаляем действия администраторов...');
            const actResult = await dbRun('DELETE FROM admin_actions');
            results.adminActions = actResult.changes || 0;
            console.log(`Удалено действий: ${results.adminActions}`);
            
            // 4. Удаляем все запросы на награды
            console.log('Удаляем запросы на награды...');
            const rewResult = await dbRun('DELETE FROM reward_requests');
            results.rewardRequests = rewResult.changes || 0;
            console.log(`Удалено запросов на награды: ${results.rewardRequests}`);
            
            // 5. Обнуляем балансы всех пользователей
            console.log('Обнуляем балансы пользователей...');
            const balResult = await dbRun('UPDATE users SET balance = 0');
            results.balancesReset = balResult.changes || 0;
            console.log(`Обнулено балансов: ${results.balancesReset}`);
            
            // 6. Очищаем историю рулетки (если таблица существует)
            try {
                const roulResult = await dbRun('DELETE FROM roulette_winners');
                results.rouletteWinners = roulResult.changes || 0;
            } catch (e) {
                results.rouletteWinners = 0;
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
                    deletedRewardRequests: results.rewardRequests,
                    resetBalances: results.balancesReset,
                    deletedRouletteWinners: results.rouletteWinners,
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