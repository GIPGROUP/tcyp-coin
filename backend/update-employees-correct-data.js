require('dotenv').config();
const bcrypt = require('bcryptjs');

// Сотрудники из txt файла с корректными данными со скриншотов и нового документа
const CORRECT_EMPLOYEES = [
    // Все сотрудники из txt файла с правильными данными
    { email: "Gujovaod@gip.su", lastName: "Гужова", firstName: "Олеся", middleName: "Денисовна", position: "Инженер-конструктор" },
    { email: "saukouma@gip.su", lastName: "Савков", firstName: "Никита", middleName: "Александрович", position: "" }, // Нет в документе
    { email: "firsovas@gip.su", lastName: "Фирсов", firstName: "Александр", middleName: "", position: "" }, // Нет в документе
    { email: "sadrtdinovayuyu@gip.su", lastName: "Садртдинова", firstName: "Юлия", middleName: "Игоревна", position: "Инженер-конструктор" },
    { email: "manckovama@gip.su", lastName: "Манькова", firstName: "Марина", middleName: "Александровна", position: "Руководитель цифровых изменений" },
    { email: "alexeevaar@gip.su", lastName: "Алексеева", firstName: "Арина", middleName: "", position: "" }, // Нет в документе
    { email: "maa@gip.su", lastName: "Аликадиев", firstName: "Мурад", middleName: "", position: "" }, // Нет в документе
    { email: "kuprikovvn@gip.su", lastName: "Куприков", firstName: "Владимир", middleName: "", position: "" }, // Нет в документе
    { email: "mingazovakr@gip.su", lastName: "Мингазова", firstName: "Камила", middleName: "Рамилевна", position: "Инженер-конструктор" },
    { email: "smirnovamu@gip.su", lastName: "Смирнова", firstName: "Мария", middleName: "", position: "" }, // Нет в документе
    { email: "maizengerae@gip.su", lastName: "Майзенгер", firstName: "Александр", middleName: "", position: "" }, // Нет в документе
    { email: "m.a.antonova@gip.su", lastName: "Антонова", firstName: "Александра", middleName: "", position: "" }, // Нет в документе
    { email: "duseevgr@gip.su", lastName: "Дусеев", firstName: "Глеб", middleName: "Львович", position: "Разработчик ПО" },
    { email: "rizhonkovaaa@gip.su", lastName: "Рыжонкова", firstName: "Алина", middleName: "Евгеньевна", position: "Инженер-конструктор" },
    { email: "sfs@gip.su", lastName: "Шангин", firstName: "Сергей", middleName: "Феликсович", position: "" }, // Нет в документе
    { email: "erushevkv@gip.su", lastName: "Ерушев", firstName: "Кирилл", middleName: "", position: "" }, // Нет в документе  
    { email: "latfullinaa@gip.su", lastName: "Латфуллин", firstName: "Алихан", middleName: "Айратович", position: "" }, // Нет в документе
    { email: "zemlikakovadd@gip.su", lastName: "Землякова", firstName: "Дарья", middleName: "", position: "" }, // Нет в документе
    { email: "feduloves@gip.su", lastName: "Федулов", firstName: "Евгений", middleName: "Сергеевич", position: "Директор департамента научных разработок и внедрения, сооучредитель GIP GROUP" },
    { email: "malyshevamj@gip.su", lastName: "Малышева", firstName: "Марина", middleName: "Романовна", position: "Инженер-конструктор" },
    // Трублинская Ксения - удалена по запросу
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
    { email: "f.i.kochankin@gip.su", lastName: "Кочанкин", firstName: "Фома", middleName: "Иванович", position: "" }, // Нет в документе
    { email: "korepanovda@gip.su", lastName: "Корепанов", firstName: "Данил", middleName: "Александрович", position: "инженер-конструктор" },
    { email: "k.e.ishchenko@gip.su", lastName: "Ищенко", firstName: "Кристина", middleName: "Эдуардовна", position: "Инженер-конструктор" },
    // Добавляем Савинкину Валерию как администратора (нет в txt, но нужна)
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
                `, [fullName, emp.position || '', hashedPassword, emp.isAdmin || false, emp.email]);
                
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
                    emp.position || '',
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

// Экспортируем для использования в других модулях
module.exports = updateEmployeesData;

// Запускаем только если вызван напрямую
if (require.main === module) {
    updateEmployeesData();
}