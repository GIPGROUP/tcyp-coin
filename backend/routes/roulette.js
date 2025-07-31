const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { dbAll, dbGet, dbRun } = require('../database/db');

const router = express.Router();

// Получить информацию о рулетке (последний победитель, можно ли крутить)
router.get('/info', authenticateToken, async (req, res) => {
    try {
        // Получаем последнего победителя
        const lastWinner = await dbGet(`
            SELECT rw.*, u.full_name 
            FROM roulette_winners rw
            JOIN users u ON rw.user_id = u.id
            ORDER BY rw.created_at DESC
            LIMIT 1
        `);

        // Проверяем, была ли рулетка сегодня
        const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
        const todayWinner = await dbGet(`
            SELECT * FROM roulette_winners
            WHERE ${isPostgreSQL ? `DATE(created_at) = CURRENT_DATE` : `date(created_at) = date('now')`}
        `);

        // Проверяем день недели (5 = пятница) и время (после 17:00)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hour = now.getHours();
        
        // Для тестирования можно временно убрать ограничения
        const canSpin = req.user.is_admin && !todayWinner; // && dayOfWeek === 5 && hour >= 17;

        res.json({
            canSpin,
            lastWinner: lastWinner ? lastWinner.full_name : null,
            lastWinDate: lastWinner ? lastWinner.created_at : null,
            message: !canSpin && !req.user.is_admin ? 'Только администратор может крутить рулетку' :
                     !canSpin && todayWinner ? 'Рулетка уже была разыграна сегодня' :
                     !canSpin ? 'Рулетка доступна только по пятницам после 17:00' : null
        });
    } catch (error) {
        console.error('Error getting roulette info:', error);
        res.status(500).json({ message: 'Ошибка получения информации о рулетке' });
    }
});

// Крутить рулетку (только для администратора)
router.post('/spin', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Проверяем, была ли рулетка сегодня
        const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
        const todayWinner = await dbGet(`
            SELECT * FROM roulette_winners
            WHERE ${isPostgreSQL ? `DATE(created_at) = CURRENT_DATE` : `date(created_at) = date('now')`}
        `);

        if (todayWinner) {
            return res.status(400).json({ message: 'Рулетка уже была разыграна сегодня' });
        }

        // Получаем всех активных сотрудников (кроме админов)
        const employees = await dbAll(`
            SELECT id, full_name 
            FROM users 
            WHERE is_admin = 0 AND is_active = 1
        `);

        if (employees.length === 0) {
            return res.status(400).json({ message: 'Нет сотрудников для розыгрыша' });
        }

        // Выбираем случайного победителя
        const winner = employees[Math.floor(Math.random() * employees.length)];
        const prizeAmount = 1000;

        await dbRun('BEGIN TRANSACTION');

        try {
            // Добавляем коины победителю
            await dbRun('UPDATE users SET balance = balance + ? WHERE id = ?', [prizeAmount, winner.id]);

            // Создаем транзакцию
            await dbRun(`
                INSERT INTO transactions (user_id, amount, type, description, admin_id)
                VALUES (?, ?, 'lottery', 'Выигрыш в еженедельной рулетке', ?)
            `, [winner.id, prizeAmount, req.user.id]);

            // Записываем победителя
            await dbRun(`
                INSERT INTO roulette_winners (user_id, prize_amount, drawn_by)
                VALUES (?, ?, ?)
            `, [winner.id, prizeAmount, req.user.id]);

            await dbRun('COMMIT');

            res.json({
                winner: winner.full_name,
                prizeAmount,
                message: `Поздравляем ${winner.full_name} с выигрышем ${prizeAmount} ЦУПкоинов!`
            });
        } catch (error) {
            await dbRun('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error spinning roulette:', error);
        res.status(500).json({ message: 'Ошибка при розыгрыше рулетки' });
    }
});

// Получить историю победителей
router.get('/winners', authenticateToken, async (req, res) => {
    try {
        const winners = await dbAll(`
            SELECT 
                rw.*,
                u.full_name,
                admin.full_name as drawn_by_name
            FROM roulette_winners rw
            JOIN users u ON rw.user_id = u.id
            LEFT JOIN users admin ON rw.drawn_by = admin.id
            ORDER BY rw.created_at DESC
            LIMIT 10
        `);

        const formattedWinners = winners.map(w => ({
            id: w.id,
            winner: w.full_name,
            prizeAmount: w.prize_amount,
            date: new Date(w.created_at).toLocaleString('ru-RU'),
            drawnBy: w.drawn_by_name
        }));

        res.json(formattedWinners);
    } catch (error) {
        console.error('Error getting winners:', error);
        res.status(500).json({ message: 'Ошибка получения истории победителей' });
    }
});

module.exports = router;