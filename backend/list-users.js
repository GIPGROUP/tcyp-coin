const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database', 'tcyp_coins.db'));

console.log('Список пользователей в базе данных:\n');

db.all("SELECT id, email, full_name, is_admin, balance FROM users ORDER BY id", (err, users) => {
    if (err) {
        console.error('Ошибка:', err);
        return;
    }
    
    users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`ФИО: ${user.full_name}`);
        console.log(`Админ: ${user.is_admin ? 'Да' : 'Нет'}`);
        console.log(`Баланс: ${user.balance} ЦУП`);
        console.log('---');
    });
    
    db.close();
});