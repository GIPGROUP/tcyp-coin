const Database = require('better-sqlite3');
const path = require('path');

function updateSchema() {
    const db = new Database(path.join(__dirname, 'tcyp_coins.db'));

    try {
        // Добавляем недостающие колонки к таблице users
        const userColumns = db.prepare("PRAGMA table_info(users)").all();
        const userColumnNames = userColumns.map(col => col.name);
        
        if (!userColumnNames.includes('hire_date')) {
            db.exec('ALTER TABLE users ADD COLUMN hire_date DATE DEFAULT CURRENT_DATE');
            console.log('Added hire_date column to users table');
        }

        // Обновляем структуру таблицы transactions
        db.exec(`
            CREATE TABLE IF NOT EXISTS transactions_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                admin_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (admin_id) REFERENCES users(id)
            );
        `);

        // Копируем данные из старой таблицы, если она существует
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'").all();
        if (tables.length > 0) {
            db.exec(`
                INSERT INTO transactions_new (id, user_id, amount, type, description, created_at)
                SELECT id, COALESCE(to_user_id, from_user_id), amount, type, description, created_at
                FROM transactions
            `);
            db.exec('DROP TABLE transactions');
        }
        
        db.exec('ALTER TABLE transactions_new RENAME TO transactions');
        console.log('Updated transactions table structure');

        // Добавляем недостающие колонки к таблице admin_actions
        const adminColumns = db.prepare("PRAGMA table_info(admin_actions)").all();
        const adminColumnNames = adminColumns.map(col => col.name);
        
        if (!adminColumnNames.includes('related_request_id')) {
            db.exec('ALTER TABLE admin_actions ADD COLUMN related_request_id INTEGER');
            console.log('Added related_request_id column to admin_actions table');
        }

        // Добавляем колонку admin_id к таблице requests (если используется старое название)
        const requestColumns = db.prepare("PRAGMA table_info(requests)").all();
        const requestColumnNames = requestColumns.map(col => col.name);
        
        if (!requestColumnNames.includes('admin_id')) {
            db.exec('ALTER TABLE requests ADD COLUMN admin_id INTEGER');
            console.log('Added admin_id column to requests table');
        }

        console.log('Schema update completed successfully!');
        
    } catch (error) {
        console.error('Error updating schema:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Если скрипт запущен напрямую
if (require.main === module) {
    updateSchema();
}

module.exports = { updateSchema };