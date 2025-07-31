const { pool, dbRun } = require('./db-postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDatabase() {
    console.log('🚀 Инициализация PostgreSQL базы данных...\n');
    
    try {
        // Создаем таблицы
        await pool.query(`
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

            -- Создаем индексы для оптимизации
            CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON transactions(from_user_id);
            CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON transactions(to_user_id);
            CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
            CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
            CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);
            CREATE INDEX IF NOT EXISTS idx_roulette_winners_user ON roulette_winners(user_id);
            CREATE INDEX IF NOT EXISTS idx_roulette_winners_week_year ON roulette_winners(week_number, year);
        `);
        
        console.log('✅ Таблицы успешно созданы');
        
        // Проверяем, есть ли уже пользователи
        const result = await pool.query('SELECT COUNT(*) as count FROM users');
        const userCount = parseInt(result.rows[0].count);
        
        if (userCount === 0) {
            console.log('\n📝 Создаем администратора по умолчанию...');
            
            // Создаем хеш пароля
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            // Создаем администратора
            await dbRun(`
                INSERT INTO users (email, password_hash, full_name, position, department, is_admin, balance)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                'admin@tcyp.ru',
                hashedPassword,
                'Администратор Системы',
                'Системный администратор',
                'IT',
                true,
                0
            ]);
            
            console.log('\n✅ Администратор создан:');
            console.log('   Email: admin@tcyp.ru');
            console.log('   Пароль: admin123');
            console.log('\n⚠️  ВАЖНО: Смените пароль администратора после первого входа!');
        } else {
            console.log(`\n✅ В базе данных уже есть ${userCount} пользователей`);
        }
        
        console.log('\n✅ База данных PostgreSQL успешно инициализирована!');
        
    } catch (error) {
        console.error('❌ Ошибка при инициализации базы данных:', error);
        throw error;
    } finally {
        // Не закрываем pool здесь, так как он может использоваться другими модулями
        // await pool.end();
    }
}

// Если скрипт запущен напрямую
if (require.main === module) {
    initDatabase()
        .then(() => {
            pool.end();
            process.exit(0);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            pool.end();
            process.exit(1);
        });
}

module.exports = { initDatabase };