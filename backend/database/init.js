const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Создаем подключение к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'tcyp_coins.db'));

// Создаем таблицы
db.serialize(() => {
    // Таблица пользователей
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            position TEXT,
            department TEXT,
            hire_date DATE DEFAULT (date('now')),
            is_admin INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            balance INTEGER DEFAULT 0 CHECK (balance >= 0),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Таблица транзакций
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            amount INTEGER NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'admin_add', 'admin_subtract', 'lottery')),
            description TEXT NOT NULL,
            admin_id INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Таблица заявок на получение коинов
    db.run(`
        CREATE TABLE IF NOT EXISTS coin_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            activity_type TEXT NOT NULL,
            description TEXT,
            link TEXT,
            expected_coins INTEGER NOT NULL,
            comment TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            admin_id INTEGER REFERENCES users(id),
            admin_comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_at TIMESTAMP
        )
    `);

    // Таблица действий администратора
    db.run(`
        CREATE TABLE IF NOT EXISTS admin_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER REFERENCES users(id),
            action_type TEXT NOT NULL CHECK (action_type IN ('add', 'subtract', 'undo', 'approve', 'reject')),
            target_user_id INTEGER REFERENCES users(id),
            amount INTEGER,
            description TEXT NOT NULL,
            can_undo INTEGER DEFAULT 1,
            undone INTEGER DEFAULT 0,
            related_request_id INTEGER REFERENCES coin_requests(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Таблица победителей рулетки
    db.run(`
        CREATE TABLE IF NOT EXISTS roulette_winners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            prize_amount INTEGER NOT NULL DEFAULT 1000,
            drawn_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Создаем индексы
    db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_coin_requests_user_id ON coin_requests(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_coin_requests_status ON coin_requests(status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON admin_actions(target_user_id)`);

    // Добавляем тестовые данные
    const saltRounds = 10;
    const defaultPassword = 'password123'; // В реальном приложении использовать разные пароли!

    bcrypt.hash(defaultPassword, saltRounds, (err, hash) => {
        if (err) {
            console.error('Ошибка хеширования пароля:', err);
            return;
        }

        // Администратор
        db.run(`
            INSERT OR IGNORE INTO users (email, password_hash, full_name, position, department, is_admin, balance, hire_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, ['admin@tcyp.ru', hash, 'Администратор Системы', 'Системный администратор', 'IT', 1, 0, '2022-01-01']);

        // Тестовые сотрудники
        const employees = [
            ['alexandrov@tcyp.ru', 'Александров Максим Сергеевич', 'Lead Developer', 'Разработка', 18750, '2023-03-15'],
            ['sokolova@tcyp.ru', 'Соколова Виктория Андреевна', 'Marketing Manager', 'Маркетинг', 16200, '2023-10-10'],
            ['kuznetsov@tcyp.ru', 'Кузнецов Артем Дмитриевич', 'Sales Representative', 'Продажи', 14800, '2022-04-05'],
            ['morozova@tcyp.ru', 'Морозова Екатерина Владимировна', 'UX/UI Designer', 'Дизайн', 13500, '2024-01-20'],
            ['petrov@tcyp.ru', 'Петров Николай Алексеевич', 'HR Specialist', 'HR', 11200, '2022-09-12']
        ];

        employees.forEach(emp => {
            db.run(`
                INSERT OR IGNORE INTO users (email, password_hash, full_name, position, department, balance, hire_date) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [emp[0], hash, emp[1], emp[2], emp[3], emp[4], emp[5]]);
        });

        console.log('База данных успешно создана!');
        console.log('\nТестовые учетные записи:');
        console.log('Администратор: admin@tcyp.ru / password123');
        console.log('Сотрудник: alexandrov@tcyp.ru / password123');
    });
});

// Закрываем соединение после завершения
db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('\nБаза данных закрыта.');
});