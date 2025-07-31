const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

// Путь к JSON файлу
const JSON_FILE_PATH = 'C:\\Users\\mankovama\\Downloads\\t.txt';

// Общий пароль для всех пользователей
const DEFAULT_PASSWORD = 'tcyp2025';

// Подключаемся к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'database', 'tcyp_coins.db'));

async function importEmployees() {
    try {
        // Читаем JSON файл
        console.log('🔍 Чтение файла с данными сотрудников...');
        const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf8');
        const employees = JSON.parse(fileContent);
        
        console.log(`📋 Найдено ${employees.length} сотрудников для импорта`);
        
        // Хешируем пароль один раз
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        
        // Сначала создадим резервную копию текущих пользователей
        console.log('\n💾 Создаем резервную копию текущих пользователей...');
        
        db.all('SELECT * FROM users', (err, backupUsers) => {
            if (err) {
                console.error('❌ Ошибка при создании резервной копии:', err);
                return;
            }
            
            fs.writeFileSync('backup_users.json', JSON.stringify(backupUsers, null, 2));
            console.log(`✅ Резервная копия сохранена в backup_users.json (${backupUsers.length} пользователей)`);
            
            let importedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            let adminFound = false;
            let processedCount = 0;
            
            console.log('\n🚀 Начинаем импорт сотрудников...\n');
            
            // Обрабатываем каждого сотрудника
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
                        console.log(`🔑 Найден администратор: ${fullName}`);
                    }
                    
                    // Проверяем, существует ли уже такой пользователь
                    db.get('SELECT id FROM users WHERE email = ?', [email], (err, existingUser) => {
                        if (err) {
                            console.error(`❌ Ошибка при проверке ${email}:`, err.message);
                            errorCount++;
                            checkCompletion();
                            return;
                        }
                        
                        if (existingUser) {
                            if (skippedCount < 5) { // Показываем только первые 5
                                console.log(`⚠️  Пропускаем ${fullName} - email уже существует: ${email}`);
                            }
                            skippedCount++;
                            checkCompletion();
                            return;
                        }
                        
                        // Вставляем пользователя
                        db.run(`
                            INSERT INTO users (email, password_hash, full_name, position, department, balance, is_admin, is_active)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            email,
                            hashedPassword,
                            fullName,
                            position,
                            'ТЦУП', // Департамент по умолчанию
                            0, // Начальный баланс
                            isAdmin ? 1 : 0,
                            1 // is_active
                        ], (err) => {
                            if (err) {
                                console.error(`❌ Ошибка при добавлении ${fullName}:`, err.message);
                                errorCount++;
                            } else {
                                importedCount++;
                                if (importedCount % 10 === 0) {
                                    console.log(`✅ Импортировано ${importedCount} пользователей...`);
                                }
                            }
                            checkCompletion();
                        });
                    });
                    
                } catch (error) {
                    console.error(`❌ Ошибка при обработке записи ${index + 1}:`, error.message);
                    errorCount++;
                    checkCompletion();
                }
            });
            
            // Функция проверки завершения
            function checkCompletion() {
                processedCount++;
                if (processedCount === employees.length) {
                    // Все записи обработаны
                    console.log('\n' + '='.repeat(50));
                    console.log('📊 ИМПОРТ ЗАВЕРШЕН');
                    console.log('='.repeat(50));
                    console.log(`✅ Успешно импортировано: ${importedCount} новых сотрудников`);
                    console.log(`⚠️  Пропущено (уже существуют): ${skippedCount}`);
                    console.log(`❌ Ошибок: ${errorCount}`);
                    console.log(`🔑 Администратор найден: ${adminFound ? 'Да' : 'Нет'}`);
                    console.log(`\n📧 Все новые пользователи могут войти с паролем: ${DEFAULT_PASSWORD}`);
                    
                    // Показываем финальную статистику
                    db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
                        if (!err) {
                            console.log(`\n📊 Всего пользователей в БД: ${result.count}`);
                        }
                        
                        db.get('SELECT COUNT(*) as count FROM users WHERE is_admin = 1', (err, result) => {
                            if (!err) {
                                console.log(`👑 Администраторов: ${result.count}`);
                            }
                            
                            // Показываем несколько примеров добавленных пользователей
                            db.all('SELECT email, full_name FROM users ORDER BY id DESC LIMIT 5', (err, newUsers) => {
                                if (!err && newUsers.length > 0) {
                                    console.log('\n🆕 Последние добавленные пользователи:');
                                    newUsers.forEach(user => {
                                        console.log(`  - ${user.full_name} (${user.email})`);
                                    });
                                }
                                
                                console.log('\n✅ Импорт завершен успешно!');
                                console.log('⚠️  Если что-то пошло не так, восстановите данные из backup_users.json');
                                
                                // Закрываем соединение с БД
                                db.close();
                            });
                        });
                    });
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Критическая ошибка при импорте:', error);
        db.close();
    }
}

// Запускаем импорт
if (require.main === module) {
    console.log('🚀 Запуск безопасного импорта сотрудников...');
    console.log('⚠️  Этот скрипт НЕ удаляет существующих пользователей, только добавляет новых\n');
    importEmployees();
}

module.exports = { importEmployees };