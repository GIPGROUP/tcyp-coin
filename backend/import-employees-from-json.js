const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Путь к JSON файлу
const JSON_FILE_PATH = 'C:\\Users\\mankovama\\Downloads\\t.txt';

// Общий пароль для всех пользователей
const DEFAULT_PASSWORD = 'tcyp2025';

function importEmployees() {
    const db = new Database(path.join(__dirname, 'database', 'tcyp_coins.db'));
    
    try {
        // Читаем JSON файл
        const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf8');
        const employees = JSON.parse(fileContent);
        
        console.log(`Найдено ${employees.length} сотрудников для импорта`);
        
        // Хешируем пароль один раз
        const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
        
        // Начинаем транзакцию
        db.prepare('BEGIN').run();
        
        // Очищаем существующие данные (кроме структуры)
        db.prepare('DELETE FROM roulette_winners').run();
        db.prepare('DELETE FROM admin_actions').run();
        db.prepare('DELETE FROM requests').run();
        db.prepare('DELETE FROM transactions').run();
        db.prepare('DELETE FROM users').run();
        
        console.log('Существующие данные очищены');
        
        // Подготавливаем запрос для вставки
        const insertUser = db.prepare(`
            INSERT INTO users (email, password, full_name, position, department, balance, is_admin, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        let importedCount = 0;
        let adminFound = false;
        
        employees.forEach((emp, index) => {
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
                    console.log(`Найден администратор: ${fullName}`);
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
                
                if ((index + 1) % 10 === 0) {
                    console.log(`Обработано ${index + 1} записей...`);
                }
                
            } catch (error) {
                console.error(`Ошибка при импорте пользователя ${index + 1}:`, error.message);
            }
        });
        
        // Завершаем транзакцию
        db.prepare('COMMIT').run();
        
        console.log('\n=== ИМПОРТ ЗАВЕРШЕН ===');
        console.log(`Успешно импортировано: ${importedCount} сотрудников`);
        console.log(`Администратор найден: ${adminFound ? 'Да' : 'Нет'}`);
        console.log(`\nВсе пользователи могут войти с паролем: ${DEFAULT_PASSWORD}`);
        
        // Показываем статистику
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
        const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = true').get();
        
        console.log(`\nВсего пользователей в БД: ${userCount.count}`);
        console.log(`Администраторов: ${adminCount.count}`);
        
    } catch (error) {
        console.error('Ошибка при импорте:', error);
        db.prepare('ROLLBACK').run();
    } finally {
        db.close();
    }
}

// Запускаем импорт
if (require.main === module) {
    importEmployees();
}

module.exports = { importEmployees };