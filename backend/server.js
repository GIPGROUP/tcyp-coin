require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// Асинхронная инициализация БД и импорт данных
async function initializeApp() {
    console.log('🚀 Запуск приложения...');
    
    // Проверяем, используем ли PostgreSQL
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (isPostgreSQL) {
        console.log('🐘 Обнаружен PostgreSQL, проверяем инициализацию...');
        
        // Проверяем наличие DATABASE_URL
        if (!process.env.DATABASE_URL) {
            console.error('❌ ОШИБКА: DATABASE_URL не установлен!');
            console.error('📝 Проверьте настройки Environment Variables в Render');
            console.log('⚠️  Продолжаем работу без инициализации БД...');
            return;
        }
        
        try {
            // Инициализируем PostgreSQL если нужно
            const { pool } = require('./database/db-postgres');
            
            // Проверяем, существуют ли таблицы
            const tableCheck = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'users'
                );
            `);
            
            if (!tableCheck.rows[0].exists) {
                console.log('📝 Таблицы не найдены, создаем структуру БД...');
                const { initDatabase } = require('./database/init-postgres');
                await initDatabase();
                
                // После создания таблиц импортируем сотрудников
                console.log('👥 Импортируем сотрудников...');
                const { autoImportEmployees } = require('./auto-import-employees');
                await autoImportEmployees();
            } else {
                console.log('✅ БД уже инициализирована');
                
                // Проверяем количество пользователей
                const userCount = await pool.query('SELECT COUNT(*) FROM users');
                console.log(`👥 Пользователей в БД: ${userCount.rows[0].count}`);
                
                // Если пользователей мало, запускаем импорт
                if (parseInt(userCount.rows[0].count) < 5) {
                    console.log('👥 Мало пользователей, запускаем импорт сотрудников...');
                    const { autoImportEmployees } = require('./auto-import-employees');
                    await autoImportEmployees();
                }
            }
            
            // Применяем фиксы структуры
            const { applyFixes } = require('./init-on-start-postgres');
            await applyFixes();
            
        } catch (error) {
            console.error('❌ Ошибка при инициализации PostgreSQL:', error);
        }
    } else {
        console.log('🗃️  Используем SQLite (локальная разработка)');
        // Запускаем фиксы для SQLite
        require('./init-on-start');
    }
    
    console.log('✅ Инициализация завершена\n');
}

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

// Запуск сервера с инициализацией
initializeApp().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Сервер запущен на порту ${PORT}`);
        console.log(`🌐 http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('❌ Критическая ошибка при запуске:', error);
    process.exit(1);
});