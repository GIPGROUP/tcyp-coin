const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { dbAll } = require('../database/db');

const router = express.Router();

// Получить общую историю транзакций (для общей страницы)
router.get('/general', authenticateToken, async (req, res) => {
    try {
        const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
        const transactions = await dbAll(`
            SELECT 
                t.*,
                u.full_name as user_name,
                ${isPostgreSQL 
                    ? `SPLIT_PART(u.full_name, ' ', 1) || ' ' || LEFT(SPLIT_PART(u.full_name, ' ', 2), 1) || '.' as short_name`
                    : `SUBSTR(u.full_name, 1, INSTR(u.full_name || ' ', ' ') - 1) || ' ' || SUBSTR(u.full_name, INSTR(u.full_name, ' ') + 1, 1) || '.' as short_name`
                }
            FROM transactions t
            JOIN users u ON ${isPostgreSQL ? 't.to_user_id' : 't.user_id'} = u.id
            ORDER BY t.created_at DESC
            LIMIT 20
        `);

        // Форматируем транзакции для отображения
        const formattedTransactions = transactions.map(t => ({
            id: t.id,
            user: t.short_name,
            description: t.description,
            amount: t.amount,
            date: new Date(t.created_at).toLocaleString('ru-RU'),
            type: t.amount > 0 ? (t.type === 'lottery' ? 'lottery' : 'earn') : 'spend'
        }));

        res.json(formattedTransactions);
    } catch (error) {
        console.error('Error getting general transactions:', error);
        res.status(500).json({ message: 'Ошибка получения истории транзакций' });
    }
});

// Получить общую статистику
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await dbAll(`
            SELECT
                (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE amount > 0) as totalEarned,
                (SELECT COALESCE(ABS(SUM(amount)), 0) FROM transactions WHERE amount < 0) as totalSpent,
                (SELECT COUNT(*) FROM users WHERE is_admin = false AND is_active = true) as totalEmployees,
                (SELECT COUNT(*) FROM transactions) as totalTransactions
        `);

        res.json(stats[0]);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ message: 'Ошибка получения статистики' });
    }
});

// Получить каталог наград
router.get('/rewards', authenticateToken, async (req, res) => {
    const rewards = {
        merchandise: [
            { id: 1, name: 'Футболка с логотипом', price: 7500, emoji: '👕' },
            { id: 2, name: 'Худи с логотипом', price: 11000, emoji: '👘' },
            { id: 3, name: 'Ручка с гравировкой', price: 5000, emoji: '✒️' },
            { id: 4, name: 'Брендированный брелок', price: 3000, emoji: '🔑' },
            { id: 5, name: 'Значок с логотипом', price: 2000, emoji: '🏅' }
        ],
        privileges: [
            { id: 6, name: 'Заказ пиццы в офис', price: 4500, emoji: '🍕' },
            { id: 7, name: 'Выбор песни для общего чата (пн)', price: 1000, emoji: '🎵' },
            { id: 8, name: 'Выбор картинки для чата (пн/пт)', price: 1000, emoji: '🖼️' },
            { id: 9, name: 'Особенное поздравление в ДР', price: 2000, emoji: '🎂' },
            { id: 10, name: 'Заказ определенного печенья', price: 1500, emoji: '🍪' },
            { id: 11, name: 'Канцелярия, не связанная с работой', price: 3000, emoji: '📝' },
            { id: 12, name: 'Такси до дома (стандарт)', price: 2500, emoji: '🚕' },
            { id: 13, name: 'Уход на час раньше', price: 5000, emoji: '🏃‍♂️' },
            { id: 14, name: 'Сертификат на кофе', price: 1500, emoji: '☕' },
            { id: 15, name: 'Сертификат в аптеку', price: 6500, emoji: '💊' },
            { id: 16, name: 'Громко похихикать с коллегами', price: 1000, emoji: '😄' },
            { id: 17, name: 'Заказ коробки фруктов', price: 8000, emoji: '🍎' },
            { id: 18, name: 'Заказ орехов в офис', price: 2000, emoji: '🥜' },
            { id: 19, name: 'Живое растение для рабочего места', price: 2000, emoji: '🌱' },
            { id: 20, name: 'Настольная игра в офисе', price: 2000, emoji: '🎲' },
            { id: 21, name: 'Звезда месяца', price: 5500, emoji: '⭐' },
            { id: 22, name: 'Личная благодарность в чате', price: 3000, emoji: '🙏' },
            { id: 23, name: 'Уборка рабочего места', price: 1700, emoji: '🧹' },
            { id: 24, name: 'Парковочное место (1 день)', price: 3000, emoji: '🚗' },
            { id: 25, name: 'Поздний приход на 1 час', price: 5000, emoji: '😴' }
        ]
    };

    res.json(rewards);
});

module.exports = router;