const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Подключаемся к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'database', 'tcyp_coins.db'));

const exportData = () => {
    console.log('📊 Начинаем экспорт данных из БД...\n');
    
    const exportData = {
        timestamp: new Date().toISOString(),
        tables: {}
    };
    
    // Список таблиц для экспорта (важен порядок из-за foreign keys)
    const tables = [
        'users',
        'transactions', 
        'requests',
        'admin_actions',
        'roulette_winners'
    ];
    
    let completedTables = 0;
    
    tables.forEach(tableName => {
        db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
            if (err) {
                console.error(`❌ Ошибка при экспорте таблицы ${tableName}:`, err);
            } else {
                exportData.tables[tableName] = rows;
                console.log(`✅ Экспортировано из ${tableName}: ${rows.length} записей`);
            }
            
            completedTables++;
            
            // Когда все таблицы экспортированы
            if (completedTables === tables.length) {
                const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                const filePath = path.join(__dirname, 'backups', fileName);
                
                // Создаем папку backups если её нет
                if (!fs.existsSync(path.join(__dirname, 'backups'))) {
                    fs.mkdirSync(path.join(__dirname, 'backups'));
                }
                
                // Сохраняем данные
                fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
                
                console.log('\n' + '='.repeat(50));
                console.log('✅ ЭКСПОРТ ЗАВЕРШЕН УСПЕШНО!');
                console.log('='.repeat(50));
                console.log(`📁 Файл сохранен: ${fileName}`);
                console.log(`📍 Путь: ${filePath}`);
                
                // Показываем статистику
                console.log('\n📊 Статистика экспорта:');
                Object.entries(exportData.tables).forEach(([table, data]) => {
                    console.log(`  - ${table}: ${data.length} записей`);
                });
                
                // Также создаем упрощенную версию только с важными данными
                const minimalExport = {
                    timestamp: exportData.timestamp,
                    users: exportData.tables.users.map(u => ({
                        email: u.email,
                        full_name: u.full_name,
                        balance: u.balance,
                        is_admin: u.is_admin,
                        position: u.position,
                        department: u.department
                    })),
                    transactions: exportData.tables.transactions,
                    requests: exportData.tables.requests
                };
                
                const minimalFileName = `backup_minimal_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                fs.writeFileSync(path.join(__dirname, 'backups', minimalFileName), JSON.stringify(minimalExport, null, 2));
                console.log(`\n📄 Также создан минимальный бэкап: ${minimalFileName}`);
                
                db.close();
            }
        });
    });
};

// Запускаем экспорт
if (require.main === module) {
    exportData();
}

module.exports = { exportData };