const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Выбираем правильную БД в зависимости от окружения
const isProduction = process.env.NODE_ENV === 'production';
const { dbAll, dbGet, dbRun } = isProduction 
  ? require('../database/db-postgres')
  : require('../database/db');

// Тестовый endpoint для проверки работы admin endpoints
router.get('/test', authenticateToken, requireAdmin, async (req, res) => {
    try {
        res.json({
            message: 'Admin test endpoint работает',
            user: req.user,
            isProduction: isProduction,
            dbType: isProduction ? 'PostgreSQL' : 'SQLite'
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Тестовый endpoint для добавления коинов
router.post('/test-add-coins', authenticateToken, requireAdmin, async (req, res) => {
    const { userId, amount } = req.body;
    
    try {
        console.log('Test add coins:', { userId, amount, adminId: req.user.id });
        
        // Проверяем существование пользователя
        const user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        
        // Пробуем обновить баланс
        await dbRun('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId]);
        
        // Получаем обновленный баланс
        const updatedUser = await dbGet('SELECT id, email, balance FROM users WHERE id = ?', [userId]);
        
        res.json({
            message: 'Тестовое добавление прошло успешно',
            user: updatedUser,
            addedAmount: amount
        });
    } catch (error) {
        console.error('Test add coins error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;