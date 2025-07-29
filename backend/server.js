require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы (для загруженных файлов)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Импорт роутов
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const rouletteRoutes = require('./routes/roulette');

// Использование роутов
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/roulette', rouletteRoutes);

// В production режиме раздаем статические файлы
if (process.env.NODE_ENV === 'production') {
    // Раздача статических файлов frontend
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    // Для всех остальных роутов возвращаем index.html
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
}

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Что-то пошло не так!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});