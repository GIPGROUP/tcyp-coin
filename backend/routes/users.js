const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { dbGet, dbAll } = require('../database/db');

const router = express.Router();

// Получить информацию о текущем пользователе
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await dbGet(`
            SELECT id, email, full_name, position, department, balance, hire_date, is_admin
            FROM users 
            WHERE id = ?
        `, [req.user.id]);

        res.json(user);
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ message: 'Ошибка получения данных пользователя' });
    }
});

// Получить статистику текущего пользователя
router.get('/me/stats', authenticateToken, async (req, res) => {
    try {
        // Заработано за текущий месяц
        const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
        const monthlyEarned = await dbGet(`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE ${isPostgreSQL ? 'to_user_id' : 'user_id'} = ? 
            AND amount > 0
            AND ${isPostgreSQL ? `DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_TIMESTAMP)` : `strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`}
        `, [req.user.id]);

        // Всего активностей
        const totalActivities = await dbGet(`
            SELECT COUNT(*) as count
            FROM requests
            WHERE user_id = ? AND status = 'approved'
        `, [req.user.id]);

        // Место в рейтинге
        const ranking = await dbAll(`
            SELECT id, balance
            FROM users
            WHERE is_active = true
            ORDER BY balance DESC
        `);

        const userRankIndex = ranking.findIndex(r => r.id === req.user.id);
        const userRank = userRankIndex >= 0 ? userRankIndex + 1 : 0;

        res.json({
            monthlyEarned: monthlyEarned.total,
            totalActivities: totalActivities.count,
            rank: userRank
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ message: 'Ошибка получения статистики' });
    }
});

// Получить историю транзакций текущего пользователя
router.get('/me/transactions', authenticateToken, async (req, res) => {
    try {
        const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
        const transactions = await dbAll(`
            SELECT t.*, ${isPostgreSQL ? `'' as admin_name` : `u.full_name as admin_name`}
            FROM transactions t
            ${isPostgreSQL ? '' : 'LEFT JOIN users u ON t.admin_id = u.id'}
            WHERE ${isPostgreSQL ? 't.to_user_id' : 't.user_id'} = ?
            ORDER BY t.created_at DESC
            LIMIT 50
        `, [req.user.id]);

        res.json(transactions);
    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({ message: 'Ошибка получения транзакций' });
    }
});

// Получить топ пользователей (для общего рейтинга)
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        const leaderboard = await dbAll(`
            SELECT id, full_name as name, balance as coins
            FROM users
            WHERE is_active = true
            ORDER BY balance DESC
            LIMIT 10
        `);

        res.json(leaderboard);
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ message: 'Ошибка получения рейтинга' });
    }
});

module.exports = router;