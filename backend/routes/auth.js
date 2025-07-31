const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { dbGet } = require('../database/db');

const router = express.Router();

// Валидация для входа
const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
];

// Вход в систему
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Проверка валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Поиск пользователя
        const user = await dbGet('SELECT * FROM users WHERE email = ? AND is_active = true', [email]);

        if (!user) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        // Проверка пароля
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        // Создание JWT токена
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                is_admin: user.is_admin 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Убираем пароль из ответа
        delete user.password_hash;

        res.json({
            token,
            user
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Проверка токена и получение информации о пользователе
router.get('/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await dbGet('SELECT * FROM users WHERE id = ? AND is_active = 1', [decoded.id]);

        if (!user) {
            return res.status(401).json({ message: 'Пользователь не найден' });
        }

        // Убираем пароль из ответа
        delete user.password_hash;

        res.json(user);
    } catch (err) {
        res.status(403).json({ message: 'Недействительный токен' });
    }
});

module.exports = router;