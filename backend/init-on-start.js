const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('Running startup fixes...');

try {
    const db = new Database(path.join(__dirname, 'database/tcyp_coins.db'));
    
    // Добавляем недостающие колонки
    const fixes = [
        "ALTER TABLE users ADD COLUMN hire_date DATE DEFAULT CURRENT_DATE",
        "ALTER TABLE admin_actions ADD COLUMN related_request_id INTEGER", 
        "ALTER TABLE requests ADD COLUMN admin_id INTEGER"
    ];
    
    for (const fix of fixes) {
        try {
            db.exec(fix);
            console.log('Applied:', fix);
        } catch (e) {
            // Игнорируем если колонка уже существует
            if (!e.message.includes('duplicate column name')) {
                console.log('Fix failed:', e.message);
            }
        }
    }
    
    // Фиксим структуру transactions если нужно
    try {
        const result = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'").get();
        if (result && result.sql.includes('from_user_id')) {
            console.log('Fixing transactions table structure...');
            
            db.exec('BEGIN TRANSACTION');
            db.exec('ALTER TABLE transactions RENAME TO transactions_old');
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
            
            try {
                db.exec(`
                    INSERT INTO transactions (id, user_id, amount, type, description, created_at)
                    SELECT id, COALESCE(to_user_id, from_user_id), amount, type, description, created_at
                    FROM transactions_old
                `);
                db.exec('DROP TABLE transactions_old');
                db.exec('COMMIT');
                console.log('Transactions table fixed');
            } catch (e) {
                db.exec('ROLLBACK');
                console.log('Failed to migrate transactions:', e.message);
            }
        }
    } catch (e) {
        console.log('Could not check transactions table:', e.message);
    }
    
    db.close();
    
    // Автоматически исправляем admin.js если нужно
    const adminPath = path.join(__dirname, 'routes/admin.js');
    try {
        let adminContent = fs.readFileSync(adminPath, 'utf8');
        if (adminContent.includes('coin_requests')) {
            console.log('Fixing admin.js...');
            adminContent = adminContent.replace(/coin_requests/g, 'requests');
            fs.writeFileSync(adminPath, adminContent);
            console.log('admin.js fixed');
        }
    } catch (e) {
        console.log('Could not fix admin.js:', e.message);
    }
    
    console.log('Startup fixes completed');
} catch (error) {
    console.error('Startup fixes failed:', error);
}