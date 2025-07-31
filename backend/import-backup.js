const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Подключаемся к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'database', 'tcyp_coins.db'));

const importBackup = (backupFile) => {
    console.log('📥 Начинаем импорт данных из резервной копии...\n');
    
    try {
        // Читаем файл бэкапа
        const backupPath = backupFile.includes('/') || backupFile.includes('\\') 
            ? backupFile 
            : path.join(__dirname, 'backups', backupFile);
            
        if (!fs.existsSync(backupPath)) {
            console.error(`❌ Файл не найден: ${backupPath}`);
            console.log('\n💡 Проверьте, что файл существует или укажите полный путь');
            db.close();
            return;
        }
        
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        console.log(`📅 Дата создания бэкапа: ${backupData.timestamp}`);
        
        // Начинаем транзакцию
        db.serialize(() => {
            console.log('\n🔄 Очищаем существующие данные...');
            
            // Очищаем таблицы в обратном порядке (из-за foreign keys)
            const tablesToClear = [
                'roulette_winners',
                'admin_actions',
                'requests',
                'transactions',
                'users'
            ];
            
            tablesToClear.forEach(table => {
                db.run(`DELETE FROM ${table}`, (err) => {
                    if (err) {
                        console.error(`❌ Ошибка при очистке ${table}:`, err);
                    }
                });
            });
            
            console.log('\n📝 Начинаем импорт данных...\n');
            
            // Импортируем пользователей
            if (backupData.tables && backupData.tables.users) {
                const users = backupData.tables.users;
                const insertUser = db.prepare(`
                    INSERT INTO users (id, email, password_hash, full_name, position, department, 
                                     hire_date, is_admin, is_active, balance, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                let importedUsers = 0;
                users.forEach(user => {
                    insertUser.run(
                        user.id,
                        user.email,
                        user.password_hash || user.password, // поддержка обоих вариантов
                        user.full_name,
                        user.position,
                        user.department,
                        user.hire_date,
                        user.is_admin,
                        user.is_active !== undefined ? user.is_active : 1,
                        user.balance || 0,
                        user.created_at,
                        user.updated_at
                    );
                    importedUsers++;
                });
                insertUser.finalize();
                console.log(`✅ Импортировано пользователей: ${importedUsers}`);
            }
            
            // Импортируем транзакции
            if (backupData.tables && backupData.tables.transactions) {
                const transactions = backupData.tables.transactions;
                const insertTransaction = db.prepare(`
                    INSERT INTO transactions (id, from_user_id, to_user_id, amount, type, description, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `);
                
                let importedTransactions = 0;
                transactions.forEach(trans => {
                    insertTransaction.run(
                        trans.id,
                        trans.from_user_id,
                        trans.to_user_id,
                        trans.amount,
                        trans.type,
                        trans.description,
                        trans.created_at
                    );
                    importedTransactions++;
                });
                insertTransaction.finalize();
                console.log(`✅ Импортировано транзакций: ${importedTransactions}`);
            }
            
            // Импортируем заявки
            if (backupData.tables && backupData.tables.requests) {
                const requests = backupData.tables.requests;
                const insertRequest = db.prepare(`
                    INSERT INTO requests (id, user_id, activity_type, description, link, expected_coins,
                                        comment, status, admin_comment, processed_by, processed_at, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                let importedRequests = 0;
                requests.forEach(req => {
                    insertRequest.run(
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
                    );
                    importedRequests++;
                });
                insertRequest.finalize();
                console.log(`✅ Импортировано заявок: ${importedRequests}`);
            }
            
            // Импортируем действия администраторов
            if (backupData.tables && backupData.tables.admin_actions) {
                const actions = backupData.tables.admin_actions;
                const insertAction = db.prepare(`
                    INSERT INTO admin_actions (id, admin_id, action_type, target_user_id, 
                                             amount, description, can_undo, undone, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                let importedActions = 0;
                actions.forEach(action => {
                    insertAction.run(
                        action.id,
                        action.admin_id,
                        action.action_type,
                        action.target_user_id,
                        action.amount,
                        action.description,
                        action.can_undo,
                        action.undone,
                        action.created_at
                    );
                    importedActions++;
                });
                insertAction.finalize();
                console.log(`✅ Импортировано действий администраторов: ${importedActions}`);
            }
            
            // Импортируем победителей рулетки
            if (backupData.tables && backupData.tables.roulette_winners) {
                const winners = backupData.tables.roulette_winners;
                const insertWinner = db.prepare(`
                    INSERT INTO roulette_winners (id, user_id, amount, week_number, year, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                
                let importedWinners = 0;
                winners.forEach(winner => {
                    insertWinner.run(
                        winner.id,
                        winner.user_id,
                        winner.amount,
                        winner.week_number,
                        winner.year,
                        winner.created_at
                    );
                    importedWinners++;
                });
                insertWinner.finalize();
                console.log(`✅ Импортировано победителей рулетки: ${importedWinners}`);
            }
            
            // Финальная статистика
            db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
                if (!err) {
                    console.log(`\n📊 Всего пользователей в БД: ${result.count}`);
                }
                
                db.get('SELECT COUNT(*) as count FROM users WHERE is_admin = 1', (err, result) => {
                    if (!err) {
                        console.log(`👑 Администраторов: ${result.count}`);
                    }
                    
                    db.get('SELECT SUM(balance) as total FROM users', (err, result) => {
                        if (!err) {
                            console.log(`💰 Общий баланс всех пользователей: ${result.total || 0} ЦУПкоинов`);
                        }
                        
                        console.log('\n' + '='.repeat(50));
                        console.log('✅ ИМПОРТ ЗАВЕРШЕН УСПЕШНО!');
                        console.log('='.repeat(50));
                        console.log('\n⚠️  Проверьте работу приложения после импорта');
                        
                        db.close();
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Критическая ошибка при импорте:', error);
        db.close();
    }
};

// Проверяем аргументы командной строки
if (require.main === module) {
    const backupFile = process.argv[2];
    
    if (!backupFile) {
        console.log('Использование: node import-backup.js <имя_файла_бэкапа>');
        console.log('Пример: node import-backup.js backup_2025-07-31T10-30-00-000Z.json');
        console.log('\n📁 Доступные бэкапы:');
        
        const backupsDir = path.join(__dirname, 'backups');
        if (fs.existsSync(backupsDir)) {
            const files = fs.readdirSync(backupsDir)
                .filter(f => f.endsWith('.json'))
                .sort()
                .reverse();
                
            if (files.length > 0) {
                files.forEach(file => {
                    const stats = fs.statSync(path.join(backupsDir, file));
                    console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
                });
            } else {
                console.log('  Нет доступных файлов бэкапов');
            }
        }
        
        db.close();
    } else {
        importBackup(backupFile);
    }
}

module.exports = { importBackup };