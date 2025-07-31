const { dbGet, dbRun, dbAll } = require('./database/db');
const bcrypt = require('bcryptjs');

// Данные сотрудников (обновлены согласно корректному списку)
const EMPLOYEES_DATA = [
    { email: "Gujovaod@gip.su", lastName: "Гужова", firstName: "Олеся", middleName: "Денисовна", position: "Инженер-конструктор" },
    { email: "saukouma@gip.su", lastName: "Савков", firstName: "Никита", middleName: "Александрович", position: "" },
    { email: "firsovas@gip.su", lastName: "Фирсов", firstName: "Александр", middleName: "", position: "" },
    { email: "sadrtdinovayuyu@gip.su", lastName: "Садртдинова", firstName: "Юлия", middleName: "Игоревна", position: "Инженер-конструктор" },
    { email: "manckovama@gip.su", lastName: "Манькова", firstName: "Марина", middleName: "Александровна", position: "Руководитель цифровых изменений" },
    { email: "alexeevaar@gip.su", lastName: "Алексеева", firstName: "Арина", middleName: "", position: "" },
    { email: "maa@gip.su", lastName: "Аликадиев", firstName: "Мурад", middleName: "", position: "" },
    { email: "kuprikovvn@gip.su", lastName: "Куприков", firstName: "Владимир", middleName: "", position: "" },
    { email: "mingazovakr@gip.su", lastName: "Мингазова", firstName: "Камила", middleName: "Рамилевна", position: "Инженер-конструктор" },
    { email: "smirnovamu@gip.su", lastName: "Смирнова", firstName: "Мария", middleName: "", position: "" },
    { email: "maizengerae@gip.su", lastName: "Майзенгер", firstName: "Александр", middleName: "", position: "" },
    { email: "m.a.antonova@gip.su", lastName: "Антонова", firstName: "Александра", middleName: "", position: "" },
    { email: "duseevgr@gip.su", lastName: "Дусеев", firstName: "Глеб", middleName: "Львович", position: "Разработчик ПО" },
    { email: "rizhonkovaaa@gip.su", lastName: "Рыжонкова", firstName: "Алина", middleName: "Евгеньевна", position: "Инженер-конструктор" },
    { email: "sfs@gip.su", lastName: "Шангин", firstName: "Сергей", middleName: "Феликсович", position: "" },
    { email: "erushevkv@gip.su", lastName: "Ерушев", firstName: "Кирилл", middleName: "", position: "" },
    { email: "latfullinaa@gip.su", lastName: "Латфуллин", firstName: "Алихан", middleName: "Айратович", position: "" },
    { email: "zemlikakovadd@gip.su", lastName: "Землякова", firstName: "Дарья", middleName: "", position: "" },
    { email: "feduloves@gip.su", lastName: "Федулов", firstName: "Евгений", middleName: "Сергеевич", position: "Директор департамента научных разработок и внедрения, сооучредитель GIP GROUP" },
    { email: "malyshevamj@gip.su", lastName: "Малышева", firstName: "Марина", middleName: "Романовна", position: "Инженер-конструктор" },
    { email: "veselovama@gip.su", lastName: "Веселова", firstName: "Марина", middleName: "Александровна", position: "ГИП,руководитель проектов КР, обследование GIP GROUP" },
    { email: "ritikovka@gip.su", lastName: "Рытиков", firstName: "Кирилл", middleName: "Александрович", position: "Инженер-конструктор" },
    { email: "shvedchikovatv@gip.su", lastName: "Шведчикова", firstName: "Татьяна", middleName: "Владимировна", position: "Администратор проектов" },
    { email: "prozorovakd@gip.su", lastName: "Прозорова", firstName: "Ксения", middleName: "Олеговна", position: "Инженер-конструктор" },
    { email: "pa.smirnova@gip.su", lastName: "Смирнова", firstName: "Полина", middleName: "Алексеевна", position: "Руководитель группы проектирования строительных конструкций" },
    { email: "m.a.latyshev@gip.su", lastName: "Латышев", firstName: "Максим", middleName: "Андреевич", position: "Инженер-конструктор" },
    { email: "ai.velikanova@gip.su", lastName: "Великанова", firstName: "Анна", middleName: "Игоревна", position: "помощник главного инженера проекта" },
    { email: "yu.m.udalov@gip.su", lastName: "Удалов", firstName: "Юрий", middleName: "Михайлович", position: "Начальник отдела изысканий" },
    { email: "i.a.ovchinnikov@gip.su", lastName: "Овчинников", firstName: "Игорь", middleName: "Алексеевич", position: "Инженер-конструктор" },
    { email: "d.m.udalov@gip.su", lastName: "Удалов", firstName: "Дмитрий", middleName: "Михайлович", position: "Технический директор" },
    { email: "a.s.shekhovtsov@gip.su", lastName: "Шеховцов", firstName: "Алексей", middleName: "Сергеевич", position: "руководитель и учредитель GIP GROUP" },
    { email: "f.i.kochankin@gip.su", lastName: "Кочанкин", firstName: "Фома", middleName: "Иванович", position: "" },
    { email: "korepanovda@gip.su", lastName: "Корепанов", firstName: "Данил", middleName: "Александрович", position: "инженер-конструктор" },
    { email: "k.e.ishchenko@gip.su", lastName: "Ищенко", firstName: "Кристина", middleName: "Эдуардовна", position: "Инженер-конструктор" },
    { email: "savinkinave@gip.su", lastName: "Савинкина", firstName: "Валерия", middleName: "", position: "Менеджер", isAdmin: true }
];

async function autoImportEmployees() {
    try {
        console.log('🚀 Автоматический импорт сотрудников...\n');
        
        // Сначала исправляем существующих пользователей
        console.log('🔧 Проверяем и исправляем существующих пользователей...');
        const defaultPassword = 'tcyp2025';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Обновляем ВСЕХ пользователей GIP - устанавливаем пароль и активируем
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
        const hashedPasswordNew = await bcrypt.hash(password, 10);
        
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
                    hashedPasswordNew,
                    fullName,
                    '', // Всегда пустая должность
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