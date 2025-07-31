const { pool, dbRun } = require('./database/db-postgres');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Путь к JSON файлу - используем относительный путь
const JSON_FILE_PATH = path.join(__dirname, 'data', 'employees.json');

// Общий пароль для всех пользователей
const DEFAULT_PASSWORD = 'tcyp2025';

// Данные сотрудников (встроенные в код для автоматического импорта)
const EMPLOYEES_DATA = [
    { email: "Gujovaod@gip.su", lastName: "Гужова", firstName: "Олеся", middleName: "Денисовна", position: "Инженер-конструктор" },
    { email: "saukouma@gip.su", lastName: "Савков", firstName: "Никита", middleName: "Александрович", position: "Инженер" },
    { email: "top_solution@gip.su", lastName: "Бухгалтер", firstName: "Ирина", middleName: "", position: "Бухгалтер" },
    { email: "milurmih@gip.su", lastName: "Михайлова", firstName: "Валентина", middleName: "Юрьевна", position: "Архитектор" },
    { email: "firsovas@gip.su", lastName: "Фирсов", firstName: "Александр", middleName: "", position: "Инженер" },
    { email: "morozovada@gip.su", lastName: "Морозова", firstName: "Даша", middleName: "Андреевна", position: "Архитектор" },
    { email: "savinkinave@gip.su", lastName: "Савинкина", firstName: "Валерия", middleName: "", position: "Менеджер", isAdmin: true },
    { email: "sadrtdinovayuyu@gip.su", lastName: "Садртдинова", firstName: "Юлия", middleName: "", position: "Менеджер" },
    { email: "manckovama@gip.su", lastName: "Манькова", firstName: "Марина", middleName: "Александровна", position: "Инженер" },
    { email: "alexeevaar@gip.su", lastName: "Алексеева", firstName: "Арина", middleName: "", position: "Архитектор" },
    { email: "maa@gip.su", lastName: "Аликадиев", firstName: "Мурад", middleName: "", position: "Генеральный директор" },
    { email: "fes1@gip.su", lastName: "Федулов", firstName: "Евгения", middleName: "", position: "Инженер" },
    { email: "kuprikovvn@gip.su", lastName: "Куприков", firstName: "Владимир", middleName: "", position: "Инженер" },
    { email: "mingazovakr@gip.su", lastName: "Мингазова", firstName: "Камила", middleName: "Рамилевна", position: "Инженер" },
    { email: "smirnovamu@gip.su", lastName: "Смирнова", firstName: "Мария", middleName: "", position: "Архитектор" },
    { email: "vav@gip.su", lastName: "Верняева", firstName: "Алёна", middleName: "", position: "Архитектор" },
    { email: "maizengerae@gip.su", lastName: "Майзенгер", firstName: "Александр", middleName: "", position: "Архитектор" },
    { email: "m.a.antonova@gip.su", lastName: "Антонова", firstName: "Александра", middleName: "", position: "Архитектор" },
    { email: "duseevgr@gip.su", lastName: "Дусеев", firstName: "Глеб", middleName: "", position: "Главный инженер проекта" },
    { email: "rizhonkovaaa@gip.su", lastName: "Рыжонкова", firstName: "Алина", middleName: "", position: "Архитектор" },
    { email: "sfs@gip.su", lastName: "Шангин", firstName: "Сергей", middleName: "Феликсович", position: "Главный специалист" },
    { email: "erushevkv@gip.su", lastName: "Ерушев", firstName: "Кирилл", middleName: "", position: "Архитектор" },
    { email: "latfullinaa@gip.su", lastName: "Латфуллин", firstName: "Алихан", middleName: "Айратович", position: "Архитектор" },
    { email: "zemlikakovadd@gip.su", lastName: "Землякова", firstName: "Дарья", middleName: "", position: "Архитектор" },
    { email: "frolenkovavv@gip.su", lastName: "Фроленкова", firstName: "Виктория", middleName: "", position: "Архитектор" },
    { email: "semchenkoyuv@gip.su", lastName: "Семченко", firstName: "Юлия", middleName: "", position: "Архитектор" },
    { email: "feduloves@gip.su", lastName: "Федулов", firstName: "Евгений", middleName: "", position: "Инженер" },
    { email: "malyshevamj@gip.su", lastName: "Малышева", firstName: "Марина", middleName: "", position: "Архитектор" },
    { email: "info@gip.su", lastName: "GIP GROUP", firstName: "Офис-менеджер", middleName: "", position: "Офис-менеджер" },
    { email: "trublinskayaka@gip.su", lastName: "Трублинская", firstName: "Ксения", middleName: "", position: "Архитектор" },
    { email: "veselovama@gip.su", lastName: "Веселова", firstName: "Марина", middleName: "Александровна", position: "Архитектор" },
    { email: "mnv@gip.su", lastName: "Мельник", firstName: "Наталья", middleName: "", position: "Заместитель генерального директора" },
    { email: "ritikovka@gip.su", lastName: "Рытиков", firstName: "Кирилл", middleName: "", position: "Архитектор" },
    { email: "shvedchikovatv@gip.su", lastName: "Шведчикова", firstName: "Татьяна", middleName: "Владимировна", position: "Архитектор" },
    { email: "prozorovakd@gip.su", lastName: "Прозорова", firstName: "Ксения", middleName: "", position: "Архитектор" },
    { email: "pa.smirnova@gip.su", lastName: "Смирнова", firstName: "Полина", middleName: "Алексеевна", position: "Инженер" },
    { email: "m.a.latyshev@gip.su", lastName: "Латышев", firstName: "Максим", middleName: "Андреевич", position: "Архитектор" },
    { email: "ai.velikanova@gip.su", lastName: "Великанова", firstName: "Анна", middleName: "Игоревна", position: "Архитектор" },
    { email: "yu.m.udalov@gip.su", lastName: "Удалов", firstName: "Юрий", middleName: "Михайлович", position: "Инженер" },
    { email: "postanen.s.v@gip.su", lastName: "Постанен", firstName: "Сергей", middleName: "", position: "Архитектор" },
    { email: "av.serishev@gip.su", lastName: "Серышев", firstName: "Алексей", middleName: "Виктрович", position: "Архитектор" },
    { email: "i.a.ovchinnikov@gip.su", lastName: "Овчинников", firstName: "Игорь", middleName: "", position: "Главный архитектор проекта" },
    { email: "d.m.udalov@gip.su", lastName: "Удалов", firstName: "Дмитрий", middleName: "Михайлович", position: "Инженер" },
    { email: "a.s.shekhovtsov@gip.su", lastName: "Шеховцов", firstName: "Алексей", middleName: "Сергеевич", position: "Архитектор" },
    { email: "feduloves@gip.su", lastName: "Федулов", firstName: "Евгений", middleName: "Сергеевич", position: "Инженер" },
    { email: "f.i.kochankin@gip.su", lastName: "Кочанкин", firstName: "Фома", middleName: "Иванович", position: "Архитектор" },
    { email: "korepanovda@gip.su", lastName: "Корепанов", firstName: "Данил", middleName: "Александрович", position: "Инженер" },
    { email: "k.e.ishchenko@gip.su", lastName: "Ищенко", firstName: "Кристина", middleName: "Эдуардовна", position: "Архитектор" }
];

async function importEmployeesPostgreSQL() {
    try {
        console.log('📥 Начинаем импорт сотрудников в PostgreSQL...');
        
        // Проверяем, есть ли уже пользователи
        const userCountResult = await pool.query('SELECT COUNT(*) FROM users');
        const existingUserCount = parseInt(userCountResult.rows[0].count);
        
        if (existingUserCount > 10) { // Если уже есть много пользователей
            console.log(`✅ В БД уже есть ${existingUserCount} пользователей, пропускаем импорт`);
            return;
        }
        
        // Хешируем пароль один раз
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        
        let importedCount = 0;
        let skippedCount = 0;
        
        console.log(`📋 Обрабатываем ${EMPLOYEES_DATA.length} сотрудников...`);
        
        for (const employee of EMPLOYEES_DATA) {
            try {
                const fullName = `${employee.lastName} ${employee.firstName} ${employee.middleName}`.trim();
                
                // Проверяем, существует ли пользователь
                const existingUser = await pool.query(
                    'SELECT id FROM users WHERE email = $1',
                    [employee.email]
                );
                
                if (existingUser.rows.length > 0) {
                    skippedCount++;
                    continue;
                }
                
                // Вставляем пользователя
                await dbRun(`
                    INSERT INTO users (email, password_hash, full_name, position, department, is_admin, balance)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    employee.email,
                    hashedPassword,
                    fullName,
                    employee.position,
                    'ТЦУП',
                    employee.isAdmin || false,
                    0
                ]);
                
                importedCount++;
                
                if (employee.isAdmin) {
                    console.log(`  🔑 Администратор: ${fullName}`);
                }
                
                if (importedCount % 10 === 0) {
                    console.log(`  ✅ Импортировано ${importedCount} сотрудников...`);
                }
                
            } catch (error) {
                console.error(`  ❌ Ошибка при импорте ${employee.email}:`, error.message);
            }
        }
        
        console.log('\n📊 Результаты импорта:');
        console.log(`  ✅ Успешно импортировано: ${importedCount}`);
        console.log(`  ⚠️  Пропущено (уже существуют): ${skippedCount}`);
        console.log(`  📧 Пароль для всех: ${DEFAULT_PASSWORD}`);
        
        // Финальная статистика
        const finalCount = await pool.query('SELECT COUNT(*) FROM users');
        const adminCount = await pool.query('SELECT COUNT(*) FROM users WHERE is_admin = true');
        
        console.log(`\n📊 Итого в БД:`);
        console.log(`  👥 Пользователей: ${finalCount.rows[0].count}`);
        console.log(`  👑 Администраторов: ${adminCount.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Критическая ошибка при импорте:', error);
        throw error;
    }
}

// Если скрипт запущен напрямую
if (require.main === module) {
    importEmployeesPostgreSQL()
        .then(() => {
            console.log('\n✅ Импорт завершен!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ошибка:', error);
            process.exit(1);
        });
}

module.exports = { importEmployeesPostgreSQL };