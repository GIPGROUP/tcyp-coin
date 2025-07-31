require('dotenv').config();
const bcrypt = require('bcryptjs');

// Сотрудники, которые должны остаться (из txt файла с корректными данными)
const CORRECT_EMPLOYEES = [
    { email: "Gujovaod@gip.su", lastName: "Гужова", firstName: "Олеся", middleName: "Денисовна", position: "Инженер-конструктор" },
    { email: "saukouma@gip.su", lastName: "Савков", firstName: "Никита", middleName: "Александрович", position: "Инженер" },
    { email: "firsovas@gip.su", lastName: "Фирсов", firstName: "Александр", middleName: "", position: "Инженер" },
    { email: "morozovada@gip.su", lastName: "Морозова", firstName: "Даша", middleName: "Андреевна", position: "Архитектор" },
    { email: "sadrtdinovayuyu@gip.su", lastName: "Садртдинова", firstName: "Юлия", middleName: "", position: "Менеджер" },
    { email: "manckovama@gip.su", lastName: "Манькова", firstName: "Марина", middleName: "Александровна", position: "Инженер" },
    { email: "alexeevaar@gip.su", lastName: "Алексеева", firstName: "Арина", middleName: "", position: "Архитектор" },
    { email: "maa@gip.su", lastName: "Аликадиев", firstName: "Мурад", middleName: "", position: "Генеральный директор" },
    { email: "kuprikovvn@gip.su", lastName: "Куприков", firstName: "Владимир", middleName: "", position: "Инженер" },
    { email: "mingazovakr@gip.su", lastName: "Мингазова", firstName: "Камила", middleName: "Рамилевна", position: "Инженер" },
    { email: "smirnovamu@gip.su", lastName: "Смирнова", firstName: "Мария", middleName: "", position: "Архитектор" },
    { email: "maizengerae@gip.su", lastName: "Майзенгер", firstName: "Александр", middleName: "", position: "Архитектор" },
    { email: "m.a.antonova@gip.su", lastName: "Антонова", firstName: "Александра", middleName: "", position: "Архитектор" },
    { email: "duseevgr@gip.su", lastName: "Дусеев", firstName: "Глеб", middleName: "", position: "Главный инженер проекта" },
    { email: "rizhonkovaaa@gip.su", lastName: "Рыжонкова", firstName: "Алина", middleName: "", position: "Архитектор" },
    { email: "sfs@gip.su", lastName: "Шангин", firstName: "Сергей", middleName: "Феликсович", position: "Главный специалист" },
    { email: "erushevkv@gip.su", lastName: "Ерушев", firstName: "Кирилл", middleName: "", position: "Архитектор" },
    { email: "latfullinaa@gip.su", lastName: "Латфуллин", firstName: "Алихан", middleName: "Айратович", position: "Архитектор" },
    { email: "zemlikakovadd@gip.su", lastName: "Землякова", firstName: "Дарья", middleName: "", position: "Архитектор" },
    { email: "feduloves@gip.su", lastName: "Федулов", firstName: "Евгений", middleName: "Сергеевич", position: "Инженер" },
    { email: "malyshevamj@gip.su", lastName: "Малышева", firstName: "Марина", middleName: "", position: "Архитектор" },
    { email: "trublinskayaka@gip.su", lastName: "Трублинская", firstName: "Ксения", middleName: "", position: "Архитектор" },
    { email: "veselovama@gip.su", lastName: "Веселова", firstName: "Марина", middleName: "Александровна", position: "Архитектор" },
    { email: "ritikovka@gip.su", lastName: "Рытиков", firstName: "Кирилл", middleName: "", position: "Архитектор" },
    { email: "shvedchikovatv@gip.su", lastName: "Шведчикова", firstName: "Татьяна", middleName: "Владимировна", position: "Архитектор" },
    { email: "prozorovakd@gip.su", lastName: "Прозорова", firstName: "Ксения", middleName: "", position: "Архитектор" },
    { email: "pa.smirnova@gip.su", lastName: "Смирнова", firstName: "Полина", middleName: "Алексеевна", position: "Инженер" },
    { email: "m.a.latyshev@gip.su", lastName: "Латышев", firstName: "Максим", middleName: "Андреевич", position: "Архитектор" },
    { email: "ai.velikanova@gip.su", lastName: "Великанова", firstName: "Анна", middleName: "Игоревна", position: "Архитектор" },
    { email: "yu.m.udalov@gip.su", lastName: "Удалов", firstName: "Юрий", middleName: "Михайлович", position: "Инженер" },
    { email: "i.a.ovchinnikov@gip.su", lastName: "Овчинников", firstName: "Игорь", middleName: "", position: "Главный архитектор проекта" },
    { email: "d.m.udalov@gip.su", lastName: "Удалов", firstName: "Дмитрий", middleName: "Михайлович", position: "Инженер" },
    { email: "a.s.shekhovtsov@gip.su", lastName: "Шеховцов", firstName: "Алексей", middleName: "Сергеевич", position: "Архитектор" },
    { email: "f.i.kochankin@gip.su", lastName: "Кочанкин", firstName: "Фома", middleName: "Иванович", position: "Архитектор" },
    { email: "korepanovda@gip.su", lastName: "Корепанов", firstName: "Данил", middleName: "Александрович", position: "Инженер" },
    { email: "k.e.ishchenko@gip.su", lastName: "Ищенко", firstName: "Кристина", middleName: "Эдуардовна", position: "Архитектор" },
    // Добавляем Савинкину Валерию как администратора
    { email: "savinkinave@gip.su", lastName: "Савинкина", firstName: "Валерия", middleName: "", position: "Менеджер", isAdmin: true }
];

async function updateEmployeesData() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        console.log('⚠️  Этот скрипт только для PostgreSQL');
        process.exit(0);
    }
    
    const { pool } = require('./database/db-postgres');
    
    try {
        console.log('🔧 Обновление данных сотрудников...\n');
        
        const defaultPassword = 'tcyp2025';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Сначала получаем всех текущих пользователей
        const currentUsers = await pool.query('SELECT email FROM users WHERE email LIKE $1', ['%@gip.su']);
        const currentEmails = currentUsers.rows.map(u => u.email.toLowerCase());
        
        // Список email, которые должны остаться
        const keepEmails = CORRECT_EMPLOYEES.map(e => e.email.toLowerCase());
        
        // Удаляем пользователей, которых нет в новом списке
        const emailsToDelete = currentEmails.filter(email => !keepEmails.includes(email));
        
        if (emailsToDelete.length > 0) {
            console.log(`🗑️  Удаляем ${emailsToDelete.length} пользователей, которых нет в списке...`);
            for (const email of emailsToDelete) {
                await pool.query('DELETE FROM users WHERE LOWER(email) = LOWER($1)', [email]);
                console.log(`  - Удален: ${email}`);
            }
        }
        
        // Обновляем или добавляем пользователей из списка
        console.log('\n📝 Обновляем/добавляем пользователей...\n');
        
        for (const emp of CORRECT_EMPLOYEES) {
            const fullName = `${emp.lastName} ${emp.firstName} ${emp.middleName}`.trim();
            
            // Проверяем, существует ли пользователь
            const existing = await pool.query(
                'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
                [emp.email]
            );
            
            if (existing.rows.length > 0) {
                // Обновляем существующего
                await pool.query(`
                    UPDATE users 
                    SET full_name = $1, 
                        position = $2, 
                        password_hash = $3,
                        is_admin = $4,
                        is_active = true
                    WHERE LOWER(email) = LOWER($5)
                `, [fullName, emp.position, hashedPassword, emp.isAdmin || false, emp.email]);
                
                console.log(`✅ Обновлен: ${fullName} (${emp.email})`);
            } else {
                // Добавляем нового
                await pool.query(`
                    INSERT INTO users (email, password_hash, full_name, position, department, is_admin, balance, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
                
                console.log(`✅ Добавлен: ${fullName} (${emp.email})`);
            }
        }
        
        // Финальная статистика
        console.log('\n📊 Финальная статистика:');
        const finalCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE email LIKE $1', ['%@gip.su']);
        console.log(`  - Всего сотрудников GIP: ${finalCount.rows[0].count}`);
        
        const adminCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_admin = true');
        console.log(`  - Администраторов: ${adminCount.rows[0].count}`);
        
        // Показываем администраторов
        const admins = await pool.query('SELECT email, full_name FROM users WHERE is_admin = true');
        if (admins.rows.length > 0) {
            console.log('\n👑 Администраторы:');
            admins.rows.forEach(admin => {
                console.log(`  - ${admin.full_name} (${admin.email})`);
            });
        }
        
        console.log('\n✅ Все данные обновлены!');
        console.log(`🔑 Пароль для всех: ${defaultPassword}`);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await pool.end();
    }
}

// Запускаем
updateEmployeesData();