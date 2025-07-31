const jwt = require('jsonwebtoken');
const { dbGet } = require('../database/db');

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Получаем пользователя из БД
        const user = await dbGet('SELECT * FROM users WHERE id = ? AND is_active = true', [decoded.id]);
        
        if (!user) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Недействительный токен' });
    }
};

// Middleware для проверки прав администратора
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ message: 'Требуются права администратора' });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin
};