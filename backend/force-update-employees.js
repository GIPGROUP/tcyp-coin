require('dotenv').config();
const bcrypt = require('bcryptjs');

// ТОЛЬКО эти сотрудники должны быть в базе
const CORRECT_EMPLOYEES = [
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

async function forceUpdateEmployees() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        console.log('⚠️  Этот скрипт только для PostgreSQL');
        process.exit(0);
    }
    
    const { pool } = require('./database/db-postgres');
    
    try {
        console.log('🔥 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ СОТРУДНИКОВ...\n');
        
        const defaultPassword = 'tcyp2025';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // 1. Сначала получаем всех текущих пользователей
        console.log('📋 Получаем текущих пользователей...');
        const currentUsers = await pool.query('SELECT id, email, full_name FROM users WHERE email LIKE $1', ['%@gip.su']);
        console.log(`Найдено ${currentUsers.rows.length} пользователей GIP`);
        
        // 2. УДАЛЯЕМ ВСЕХ, кого нет в списке
        const keepEmails = CORRECT_EMPLOYEES.map(e => e.email.toLowerCase());
        let deleteCount = 0;
        
        for (const user of currentUsers.rows) {
            if (!keepEmails.includes(user.email.toLowerCase())) {
                await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
                console.log(`❌ Удален: ${user.full_name} (${user.email})`);
                deleteCount++;
            }
        }
        
        if (deleteCount > 0) {
            console.log(`\n🗑️  Удалено ${deleteCount} лишних пользователей\n`);
        }
        
        // 3. Обновляем или добавляем правильных пользователей
        console.log('📝 Обновляем/добавляем правильных пользователей...\n');
        
        let updateCount = 0;
        let addCount = 0;
        
        for (const emp of CORRECT_EMPLOYEES) {
            const fullName = `${emp.lastName} ${emp.firstName} ${emp.middleName}`.trim();
            
            // Проверяем, существует ли пользователь
            const existing = await pool.query(
                'SELECT id, position FROM users WHERE LOWER(email) = LOWER($1)',
                [emp.email]
            );
            
            if (existing.rows.length > 0) {
                // Обновляем существующего
                await pool.query(`
                    UPDATE users 
                    SET full_name = $1, 
                        position = '', 
                        password_hash = $2,
                        is_admin = $3,
                        is_active = true
                    WHERE LOWER(email) = LOWER($4)
                `, [fullName, hashedPassword, emp.isAdmin || false, emp.email]);
                
                if (existing.rows[0].position !== emp.position) {
                    console.log(`✅ Обновлен: ${fullName} (${emp.email}) - должность: ${emp.position || 'не указана'}`);
                    updateCount++;
                }
            } else {
                // Добавляем нового
                await pool.query(`
                    INSERT INTO users (email, password_hash, full_name, position, department, is_admin, balance, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    emp.email,
                    hashedPassword,
                    fullName,
                    '', // Всегда пустая должность
                    'ТЦУП',
                    emp.isAdmin || false,
                    0,
                    true
                ]);
                
                console.log(`➕ Добавлен: ${fullName} (${emp.email})`);
                addCount++;
            }
        }
        
        // 4. Финальная статистика
        console.log('\n📊 ФИНАЛЬНАЯ СТАТИСТИКА:');
        console.log(`  - Удалено лишних: ${deleteCount}`);
        console.log(`  - Обновлено: ${updateCount}`);
        console.log(`  - Добавлено новых: ${addCount}`);
        
        const finalCount = await pool.query('SELECT COUNT(*) as count FROM users WHERE email LIKE $1', ['%@gip.su']);
        console.log(`  - Всего сотрудников GIP: ${finalCount.rows[0].count} (должно быть ${CORRECT_EMPLOYEES.length})`);
        
        // Показываем администраторов
        const admins = await pool.query('SELECT email, full_name FROM users WHERE is_admin = true');
        if (admins.rows.length > 0) {
            console.log('\n👑 Администраторы:');
            admins.rows.forEach(admin => {
                console.log(`  - ${admin.full_name} (${admin.email})`);
            });
        }
        
        console.log('\n✅ ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ЗАВЕРШЕНО!');
        console.log(`🔑 Пароль для всех: ${defaultPassword}`);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await pool.end();
    }
}

// Запускаем
forceUpdateEmployees();