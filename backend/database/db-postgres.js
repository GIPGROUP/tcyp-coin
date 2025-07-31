const { Pool } = require('pg');
require('dotenv').config();

// Логируем для отладки
console.log('🔍 DATABASE_URL доступен:', !!process.env.DATABASE_URL);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

// Создаем пул соединений для PostgreSQL
const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
    // Добавляем таймауты и настройки для Render
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10
};

const pool = new Pool(poolConfig);

// Обработка ошибок пула
pool.on('error', (err) => {
    console.error('💥 Неожиданная ошибка в пуле PostgreSQL:', err);
});

// Проверяем подключение при запуске (не блокируем запуск)
pool.connect()
    .then(client => {
        console.log('✅ Успешно подключились к PostgreSQL');
        client.release();
    })
    .catch(err => {
        console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
        console.error('📝 Проверьте DATABASE_URL в настройках Render');
    });

// Обертки для совместимости с существующим кодом
const dbAll = async (sql, params = []) => {
    try {
        // Заменяем ? на $1, $2 и т.д. для PostgreSQL
        let pgSql = sql;
        let paramIndex = 1;
        while (pgSql.includes('?')) {
            pgSql = pgSql.replace('?', `$${paramIndex}`);
            paramIndex++;
        }
        
        const result = await pool.query(pgSql, params);
        return result.rows;
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        throw error;
    }
};

const dbGet = async (sql, params = []) => {
    try {
        // Заменяем ? на $1, $2 и т.д. для PostgreSQL
        let pgSql = sql;
        let paramIndex = 1;
        while (pgSql.includes('?')) {
            pgSql = pgSql.replace('?', `$${paramIndex}`);
            paramIndex++;
        }
        
        const result = await pool.query(pgSql, params);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        throw error;
    }
};

const dbRun = async (sql, params = []) => {
    try {
        // Заменяем ? на $1, $2 и т.д. для PostgreSQL
        let pgSql = sql;
        let paramIndex = 1;
        while (pgSql.includes('?')) {
            pgSql = pgSql.replace('?', `$${paramIndex}`);
            paramIndex++;
        }
        
        // Добавляем RETURNING для INSERT операций
        if (pgSql.toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
            pgSql += ' RETURNING id';
        }
        
        const result = await pool.query(pgSql, params);
        
        // Возвращаем объект, совместимый с SQLite
        return {
            id: result.rows[0]?.id || null,
            changes: result.rowCount
        };
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error);
        throw error;
    }
};

// Дополнительные методы для работы с транзакциями
const beginTransaction = async () => {
    const client = await pool.connect();
    await client.query('BEGIN');
    return client;
};

const commitTransaction = async (client) => {
    await client.query('COMMIT');
    client.release();
};

const rollbackTransaction = async (client) => {
    await client.query('ROLLBACK');
    client.release();
};

// Для совместимости со старым кодом, который использует синхронные методы
const db = {
    prepare: (sql) => ({
        all: (...params) => {
            // Конвертируем в промис для обратной совместимости
            return dbAll(sql, params);
        },
        get: (...params) => {
            return dbGet(sql, params);
        },
        run: (...params) => {
            return dbRun(sql, params);
        }
    }),
    exec: async (sql) => {
        // Для выполнения множественных SQL команд (например, CREATE TABLE)
        try {
            await pool.query(sql);
            return true;
        } catch (error) {
            console.error('Ошибка выполнения SQL:', error);
            throw error;
        }
    }
};

module.exports = {
    pool,
    db,
    dbAll,
    dbGet,
    dbRun,
    beginTransaction,
    commitTransaction,
    rollbackTransaction
};