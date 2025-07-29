const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('./database/db');

// Пример CSV файла:
// email,full_name,department,position
// ivanov@tcyp.ru,Иванов Иван Иванович,IT,Разработчик
// petrov@tcyp.ru,Петров Петр Петрович,Маркетинг,Менеджер

async function importEmployeesFromCSV(csvFilePath) {
    try {
        // Читаем CSV файл
        const csvData = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = csvData.split('\n');
        
        // Пропускаем заголовок
        const employees = lines.slice(1).filter(line => line.trim());
        
        console.log(`Найдено ${employees.length} сотрудников для импорта`);
        
        // Генерируем временный пароль
        const tempPassword = 'tcyp2024'; // Временный пароль для всех
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const line of employees) {
            const [email, full_name, department, position] = line.split(',').map(field => field.trim());
            
            if (!email || !full_name) {
                console.log(`Пропускаем строку: недостаточно данных`);
                errorCount++;
                continue;
            }
            
            try {
                db.prepare(`
                    INSERT INTO users (email, password, full_name, department, position, balance, is_admin)
                    VALUES (?, ?, ?, ?, ?, 0, 0)
                `).run(email, hashedPassword, full_name, department || 'Не указан', position || 'Сотрудник');
                
                console.log(`✅ Добавлен: ${full_name} (${email})`);
                successCount++;
            } catch (error) {
                if (error.message.includes('UNIQUE')) {
                    console.log(`⚠️  Пользователь ${email} уже существует`);
                } else {
                    console.error(`❌ Ошибка при добавлении ${email}:`, error.message);
                }
                errorCount++;
            }
        }
        
        console.log(`\n📊 Результаты импорта:`);
        console.log(`✅ Успешно добавлено: ${successCount}`);
        console.log(`❌ Ошибок: ${errorCount}`);
        console.log(`\n🔑 Временный пароль для всех: ${tempPassword}`);
        console.log(`⚠️  Попросите сотрудников сменить пароль при первом входе!`);
        
    } catch (error) {
        console.error('Ошибка при чтении файла:', error);
    }
}

// Пример использования:
// node import-employees.js employees.csv
const csvFile = process.argv[2];
if (!csvFile) {
    console.log('Использование: node import-employees.js <путь_к_csv_файлу>');
    console.log('\nФормат CSV файла:');
    console.log('email,full_name,department,position');
    console.log('ivanov@tcyp.ru,Иванов Иван Иванович,IT,Разработчик');
    process.exit(1);
}

importEmployeesFromCSV(csvFile);