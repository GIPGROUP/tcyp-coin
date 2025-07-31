const { db } = require('./database/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Путь к JSON файлу
const JSON_FILE_PATH = 'C:\\Users\\mankovama\\Downloads\\t.txt';

// Общий пароль для всех пользователей
const DEFAULT_PASSWORD = 'tcyp2025';

async function importEmployees() {
    try {
        // Читаем JSON файл
        console.log('Чтение файла с данными сотрудников...');
        const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf8');
        const employees = JSON.parse(fileContent);
        
        console.log(`Найдено ${employees.length} сотрудников для импорта`);
        
        // Хешируем пароль один раз
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        
        // Сначала создадим резервную копию текущих пользователей
        console.log('\nСоздаем резервную копию текущих пользователей...');
        const backupUsers = db.prepare('SELECT * FROM users').all();
        fs.writeFileSync('backup_users.json', JSON.stringify(backupUsers, null, 2));
        console.log(`Резервная копия сохранена в backup_users.json (${backupUsers.length} пользователей)`);
        
        // Подготавливаем запрос для вставки
        const insertUser = db.prepare(`
            INSERT OR IGNORE INTO users (email, password, full_name, position, department, balance, is_admin, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        let importedCount = 0;
        let skippedCount = 0;
        let adminFound = false;
        
        // Начинаем транзакцию
        const insertMany = db.transaction((employees) => {
            for (const emp of employees) {
                try {
                    // Извлекаем данные
                    const employee = emp.employee || {};
                    const email = emp.email || emp.username || '';
                    const lastName = employee.last_name || employee.short_name || '';
                    const firstName = employee.first_name || emp.first_name || '';
                    const middleName = employee.middle_name || '';
                    const position = employee.position || 'Сотрудник';
                    
                    // Формируем ФИО
                    const fullName = `${lastName} ${firstName} ${middleName}`.trim();
                    
                    // Проверяем, является ли это Савинкина Валерия
                    const isAdmin = lastName.toLowerCase().includes('савинкин') && 
                                   firstName.toLowerCase().includes('валери');
                    
                    if (isAdmin) {
                        adminFound = true;
                        console.log(`\n🔑 Найден администратор: ${fullName}`);
                    }
                    
                    // Проверяем, существует ли уже такой пользователь
                    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
                    
                    if (existingUser) {
                        console.log(`⚠️  Пропускаем ${fullName} - email уже существует: ${email}`);
                        skippedCount++;
                        continue;
                    }
                    
                    // Вставляем пользователя
                    insertUser.run(
                        email,
                        hashedPassword,
                        fullName,
                        position,
                        'ТЦУП', // Департамент по умолчанию
                        0, // Начальный баланс
                        isAdmin ? 1 : 0,
                        1 // is_active
                    );
                    
                    importedCount++;
                    
                    if (importedCount % 10 === 0) {
                        console.log(`✅ Импортировано ${importedCount} пользователей...`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Ошибка при импорте пользователя:`, error.message);
                }
            }
        });
        
        // Выполняем транзакцию
        insertMany(employees);
        
        console.log('\n=== ИМПОРТ ЗАВЕРШЕН ===');
        console.log(`✅ Успешно импортировано: ${importedCount} новых сотрудников`);
        console.log(`⚠️  Пропущено (уже существуют): ${skippedCount}`);
        console.log(`🔑 Администратор найден: ${adminFound ? 'Да' : 'Нет'}`);
        console.log(`\n📧 Все новые пользователи могут войти с паролем: ${DEFAULT_PASSWORD}`);
        
        // Показываем финальную статистику
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
        const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get();
        
        console.log(`\n📊 Итоговая статистика:`);
        console.log(`Всего пользователей в БД: ${userCount.count}`);
        console.log(`Администраторов: ${adminCount.count}`);
        
        // Показываем несколько примеров добавленных пользователей
        const newUsers = db.prepare('SELECT email, full_name FROM users ORDER BY id DESC LIMIT 5').all();
        console.log('\n🆕 Последние добавленные пользователи:');
        newUsers.forEach(user => {
            console.log(`  - ${user.full_name} (${user.email})`);
        });
        
    } catch (error) {
        console.error('❌ Критическая ошибка при импорте:', error);
        console.log('\n⚠️  Если что-то пошло не так, восстановите данные из backup_users.json');
    }
}

// Запускаем импорт
if (require.main === module) {
    console.log('🚀 Запуск безопасного импорта сотрудников...');
    console.log('⚠️  Этот скрипт НЕ удаляет существующих пользователей, только добавляет новых\n');
    importEmployees();
}

module.exports = { importEmployees };