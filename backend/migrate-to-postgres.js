const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

console.log('🚀 Начинаем миграцию из SQLite в PostgreSQL...\n');

// Проверяем наличие DATABASE_URL
if (!process.env.DATABASE_URL) {
    console.error('❌ Ошибка: DATABASE_URL не установлен в переменных окружения');
    console.log('💡 Добавьте DATABASE_URL в файл .env или установите переменную окружения');
    process.exit(1);
}

// Подключение к SQLite
const sqliteDb = new sqlite3.Database(path.join(__dirname, 'database', 'tcyp_coins.db'));

// Подключение к PostgreSQL
const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateData() {
    try {
        // Сначала создаем таблицы в PostgreSQL
        console.log('📝 Создаем таблицы в PostgreSQL...');
        await pgPool.query(`
            -- Таблица пользователей
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                position VARCHAR(255),
                department VARCHAR(255),
                hire_date DATE DEFAULT CURRENT_DATE,
                is_admin BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                balance INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Таблица транзакций
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                amount INTEGER NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Таблица заявок
            CREATE TABLE IF NOT EXISTS requests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                activity_type VARCHAR(100) NOT NULL,
                description TEXT,
                link TEXT,
                expected_coins INTEGER NOT NULL,
                comment TEXT,
                status VARCHAR(50) DEFAULT 'pending',
                admin_comment TEXT,
                processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                processed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Таблица действий администраторов
            CREATE TABLE IF NOT EXISTS admin_actions (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                action_type VARCHAR(100) NOT NULL,
                target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                amount INTEGER,
                description TEXT,
                can_undo BOOLEAN DEFAULT true,
                undone BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Таблица победителей рулетки
            CREATE TABLE IF NOT EXISTS roulette_winners (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                amount INTEGER NOT NULL,
                week_number INTEGER NOT NULL,
                year INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Таблицы созданы\n');

        // Очищаем существующие данные в PostgreSQL
        console.log('🗑️  Очищаем существующие данные в PostgreSQL...');
        await pgPool.query('TRUNCATE TABLE roulette_winners, admin_actions, requests, transactions, users RESTART IDENTITY CASCADE');
        console.log('✅ Данные очищены\n');

        // Миграция пользователей
        console.log('👥 Мигрируем пользователей...');
        await new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM users', async (err, users) => {
                if (err) return reject(err);
                
                for (const user of users) {
                    try {
                        await pgPool.query(`
                            INSERT INTO users (id, email, password_hash, full_name, position, department, 
                                             hire_date, is_admin, is_active, balance, created_at, updated_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        `, [
                            user.id,
                            user.email,
                            user.password_hash,
                            user.full_name,
                            user.position,
                            user.department,
                            user.hire_date,
                            user.is_admin === 1,
                            user.is_active === 1,
                            user.balance || 0,
                            user.created_at,
                            user.updated_at
                        ]);
                    } catch (error) {
                        console.error(`Ошибка при миграции пользователя ${user.email}:`, error.message);
                    }
                }
                
                // Обновляем sequence для правильной работы автоинкремента
                await pgPool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);
                
                console.log(`✅ Мигрировано ${users.length} пользователей\n`);
                resolve();
            });
        });

        // Миграция транзакций
        console.log('💸 Мигрируем транзакции...');
        await new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM transactions', async (err, transactions) => {
                if (err) return reject(err);
                
                for (const trans of transactions) {
                    try {
                        await pgPool.query(`
                            INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description, created_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                        `, [
                            trans.id,
                            trans.from_user_id,
                            trans.to_user_id,
                            trans.amount,
                            trans.type,
                            trans.description,
                            trans.created_at
                        ]);
                    } catch (error) {
                        console.error(`Ошибка при миграции транзакции ${trans.id}:`, error.message);
                    }
                }
                
                if (transactions.length > 0) {
                    await pgPool.query(`SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions))`);
                }
                
                console.log(`✅ Мигрировано ${transactions.length} транзакций\n`);
                resolve();
            });
        });

        // Миграция заявок
        console.log('📋 Мигрируем заявки...');
        await new Promise((resolve, reject) => {
            sqliteDb.all('SELECT * FROM requests', async (err, requests) => {
                if (err) return reject(err);
                
                for (const req of requests) {
                    try {
                        await pgPool.query(`
                            INSERT INTO requests (id, user_id, activity_type, description, link, expected_coins,
                                                comment, status, admin_comment, processed_by, processed_at, created_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        `, [
                            req.id,
                            req.user_id,
                            req.activity_type,
                            req.description,
                            req.link,
                            req.expected_coins,
                            req.comment,
                            req.status,
                            req.admin_comment,
                            req.processed_by,
                            req.processed_at,
                            req.created_at
                        ]);
                    } catch (error) {
                        console.error(`Ошибка при миграции заявки ${req.id}:`, error.message);
                    }
                }
                
                if (requests.length > 0) {
                    await pgPool.query(`SELECT setval('requests_id_seq', (SELECT MAX(id) FROM requests))`);
                }
                
                console.log(`✅ Мигрировано ${requests.length} заявок\n`);
                resolve();
            });
        });

        // Проверяем результаты
        console.log('📊 Проверяем результаты миграции...');
        const userCount = await pgPool.query('SELECT COUNT(*) FROM users');
        const transCount = await pgPool.query('SELECT COUNT(*) FROM transactions');
        const reqCount = await pgPool.query('SELECT COUNT(*) FROM requests');
        
        console.log(`\n✅ МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО!`);
        console.log(`   Пользователей: ${userCount.rows[0].count}`);
        console.log(`   Транзакций: ${transCount.rows[0].count}`);
        console.log(`   Заявок: ${reqCount.rows[0].count}`);
        
        console.log('\n🎉 Теперь ваше приложение использует PostgreSQL!');
        console.log('📝 Не забудьте обновить переменные окружения на сервере Render.');
        
    } catch (error) {
        console.error('❌ Ошибка при миграции:', error);
    } finally {
        sqliteDb.close();
        await pgPool.end();
    }
}

// Запускаем миграцию
migrateData();