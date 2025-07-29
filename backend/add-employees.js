const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const db = new sqlite3.Database(path.join(__dirname, 'database', 'tcyp_coins.db'));

async function addEmployees() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    
    const employees = [
        ['alexandrov@tcyp.ru', 'Александров Максим Сергеевич', 'Lead Developer', 'Разработка', 18750, '2023-03-15'],
        ['sokolova@tcyp.ru', 'Соколова Виктория Андреевна', 'Marketing Manager', 'Маркетинг', 16200, '2023-10-10'],
        ['kuznetsov@tcyp.ru', 'Кузнецов Артем Дмитриевич', 'Sales Representative', 'Продажи', 14800, '2022-04-05'],
        ['morozova@tcyp.ru', 'Морозова Екатерина Владимировна', 'UX/UI Designer', 'Дизайн', 13500, '2024-01-20'],
        ['petrov@tcyp.ru', 'Петров Николай Алексеевич', 'HR Specialist', 'HR', 11200, '2022-09-12']
    ];
    
    console.log('Добавляем сотрудников...\n');
    
    let added = 0;
    
    for (const emp of employees) {
        db.run(`
            INSERT OR IGNORE INTO users (email, password_hash, full_name, position, department, balance, hire_date, is_admin) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        `, [emp[0], hash, emp[1], emp[2], emp[3], emp[4], emp[5]], function(err) {
            if (err) {
                console.error(`Ошибка при добавлении ${emp[0]}:`, err);
            } else if (this.changes > 0) {
                console.log(`✅ Добавлен: ${emp[0]}`);
                added++;
            } else {
                console.log(`⚠️  Уже существует: ${emp[0]}`);
            }
            
            // Закрываем соединение после последнего сотрудника
            if (emp === employees[employees.length - 1]) {
                console.log(`\nВсего добавлено: ${added} сотрудников`);
                console.log('\nТестовые данные для входа:');
                console.log('Email: любой из списка выше');
                console.log('Пароль: password123');
                db.close();
            }
        });
    }
}

addEmployees();