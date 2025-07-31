const { dbGet, dbRun, dbAll } = require('./database/db');
const bcrypt = require('bcryptjs');

// Данные сотрудников
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

async function autoImportEmployees() {
    try {
        console.log('🚀 Автоматический импорт сотрудников...\n');
        
        // Сначала исправляем существующих пользователей
        console.log('🔧 Проверяем и исправляем существующих пользователей...');
        const defaultPassword = 'tcyp2025';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Обновляем ВСЕХ пользователей GIP - устанавливаем пароль и активируем
        // Убираем условие про password_hash IS NULL чтобы обновить всех
        const updateResult = await dbRun(`
            UPDATE users 
            SET password_hash = ?, is_active = true 
            WHERE email LIKE ?
        `, [hashedPassword, '%@gip.su']);
        
        console.log(`✅ Обновлены пароли для пользователей GIP`);
        
        // Проверяем, есть ли реальные сотрудники (не тестовые)
        const realEmployees = await dbGet('SELECT COUNT(*) as count FROM users WHERE email LIKE ?', ['%@gip.su']);
        
        if (realEmployees && realEmployees.count > 0) {
            console.log(`✅ В БД уже есть ${realEmployees.count} сотрудников GIP`);
            
            // Проверяем, все ли активны
            const inactiveCount = await dbGet('SELECT COUNT(*) as count FROM users WHERE email LIKE ? AND is_active = false', ['%@gip.su']);
            if (inactiveCount && inactiveCount.count > 0) {
                console.log(`⚠️  Найдено ${inactiveCount.count} неактивных пользователей, активируем...`);
                await dbRun('UPDATE users SET is_active = true WHERE email LIKE ?', ['%@gip.su']);
            }
            
            return;
        }
        
        console.log('📥 Начинаем импорт сотрудников GIP...');
        
        const password = 'tcyp2025';
        const hashedPassword = await bcrypt.hash(password, 10);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const emp of EMPLOYEES_DATA) {
            try {
                const fullName = `${emp.lastName} ${emp.firstName} ${emp.middleName}`.trim();
                
                // Проверяем, существует ли пользователь
                const existing = await dbGet('SELECT id FROM users WHERE email = ?', [emp.email]);
                
                if (existing) {
                    continue;
                }
                
                // Добавляем пользователя
                await dbRun(`
                    INSERT INTO users (email, password_hash, full_name, position, department, is_admin, balance, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    emp.email,
                    hashedPassword,
                    fullName,
                    emp.position,
                    'ТЦУП',
                    emp.isAdmin || false,
                    0,
                    true
                ]);
                
                successCount++;
                
                if (emp.isAdmin) {
                    console.log(`✅ Добавлен администратор: ${fullName}`);
                }
                
            } catch (error) {
                errorCount++;
                console.error(`❌ Ошибка при добавлении ${emp.email}:`, error.message);
            }
        }
        
        if (successCount > 0) {
            console.log(`\n✅ Успешно импортировано: ${successCount} сотрудников`);
            console.log(`📧 Пароль для всех: ${password}`);
            
            // Показываем администраторов
            const admins = await dbAll('SELECT email, full_name FROM users WHERE is_admin = true');
            console.log('\n👑 Администраторы:');
            admins.forEach(admin => {
                console.log(`  - ${admin.full_name} (${admin.email})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка при автоимпорте:', error);
        throw error;
    }
}

module.exports = { autoImportEmployees };