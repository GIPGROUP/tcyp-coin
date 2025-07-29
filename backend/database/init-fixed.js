const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

function initDatabase() {
    const db = new Database(path.join(__dirname, 'tcyp_coins.db'));

    try {
        // Создаем таблицы
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                position TEXT,
                department TEXT,
                balance INTEGER DEFAULT 0,
                is_admin INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_user_id INTEGER,
                to_user_id INTEGER,
                amount INTEGER NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (from_user_id) REFERENCES users(id),
                FOREIGN KEY (to_user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                activity_type TEXT NOT NULL,
                description TEXT,
                link TEXT,
                expected_coins INTEGER NOT NULL,
                comment TEXT,
                status TEXT DEFAULT 'pending',
                admin_comment TEXT,
                processed_by INTEGER,
                processed_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (processed_by) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS admin_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_id INTEGER NOT NULL,
                action_type TEXT NOT NULL,
                target_user_id INTEGER,
                amount INTEGER,
                description TEXT,
                can_undo INTEGER DEFAULT 1,
                undone INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users(id),
                FOREIGN KEY (target_user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS roulette_winners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                week_number INTEGER NOT NULL,
                year INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        `);

        // Создаем тестовых пользователей
        const hashedPassword = bcrypt.hashSync('password123', 10);
        
        const insertUser = db.prepare(`
            INSERT OR IGNORE INTO users (email, password, full_name, position, department, balance, is_admin)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        // Администратор
        insertUser.run(
            'admin@tcyp.ru',
            hashedPassword,
            'Администратор Системы',
            'Администратор',
            'IT',
            0,
            1
        );

        // Тестовый сотрудник
        insertUser.run(
            'alexandrov@tcyp.ru',
            hashedPassword,
            'Александров Александр Александрович',
            'Инженер',
            'ЦУП',
            100,
            0
        );

        console.log('База данных успешно создана!');
        console.log('\nТестовые учетные записи:');
        console.log('Администратор: admin@tcyp.ru / password123');
        console.log('Сотрудник: alexandrov@tcyp.ru / password123');
        
    } catch (error) {
        console.error('Ошибка при инициализации базы данных:', error);
        throw error;
    }
}

// Если скрипт запущен напрямую
if (require.main === module) {
    initDatabase();
}

module.exports = { initDatabase };