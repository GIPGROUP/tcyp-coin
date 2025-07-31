const Database = require('better-sqlite3');
const path = require('path');

function quickFix() {
    const db = new Database(path.join(__dirname, 'tcyp_coins.db'));

    try {
        console.log('Starting quick fix for database...');

        // 1. Добавляем недостающие колонки к таблице users
        try {
            db.exec('ALTER TABLE users ADD COLUMN hire_date DATE DEFAULT CURRENT_DATE');
            console.log('✓ Added hire_date column to users table');
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log('- hire_date column already exists');
            } else throw e;
        }

        // 2. Создаем новую структуру таблицы transactions
        db.exec('DROP TABLE IF EXISTS transactions_backup');
        
        // Проверяем существует ли таблица transactions
        const hasTransactions = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'").get();
        
        if (hasTransactions) {
            // Сохраняем старые данные
            db.exec('ALTER TABLE transactions RENAME TO transactions_backup');
            console.log('✓ Backed up old transactions table');
        }

        // Создаем новую таблицу transactions
        db.exec(`
            CREATE TABLE transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount INTEGER NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                admin_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (admin_id) REFERENCES users(id)
            )
        `);
        console.log('✓ Created new transactions table structure');

        // Восстанавливаем данные если были
        if (hasTransactions) {
            try {
                db.exec(`
                    INSERT INTO transactions (id, user_id, amount, type, description, created_at)
                    SELECT id, COALESCE(to_user_id, from_user_id), amount, type, description, created_at
                    FROM transactions_backup
                `);
                console.log('✓ Migrated old transactions data');
            } catch (e) {
                console.log('! Could not migrate old transactions:', e.message);
            }
        }

        // 3. Добавляем недостающие колонки к admin_actions
        try {
            db.exec('ALTER TABLE admin_actions ADD COLUMN related_request_id INTEGER');
            console.log('✓ Added related_request_id to admin_actions');
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log('- related_request_id column already exists');
            } else throw e;
        }

        // 4. Добавляем admin_id к requests
        try {
            db.exec('ALTER TABLE requests ADD COLUMN admin_id INTEGER');
            console.log('✓ Added admin_id to requests table');
        } catch (e) {
            if (e.message.includes('duplicate column name')) {
                console.log('- admin_id column already exists');
            } else throw e;
        }

        console.log('\n✅ Database quick fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error during quick fix:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Запускаем если вызван напрямую
if (require.main === module) {
    quickFix();
}

module.exports = { quickFix };