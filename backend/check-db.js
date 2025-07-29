const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Подключаемся к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'database', 'tcyp_coins.db'));

console.log('Проверка базы данных...\n');

// Проверяем таблицы
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Ошибка при проверке таблиц:', err);
        return;
    }
    console.log('Найдены таблицы:', tables.map(t => t.name).join(', '));
});

// Проверяем пользователей
db.all("SELECT id, email, full_name, is_admin FROM users", async (err, users) => {
    if (err) {
        console.error('Ошибка при получении пользователей:', err);
        return;
    }
    
    console.log('\nПользователи в базе:');
    users.forEach(user => {
        console.log(`- ${user.email} (${user.full_name}) ${user.is_admin ? '[ADMIN]' : ''}`);
    });
    
    // Проверяем пароль для админа
    const admin = users.find(u => u.email === 'admin@tcyp.ru');
    if (admin) {
        db.get("SELECT password_hash FROM users WHERE email = 'admin@tcyp.ru'", async (err, row) => {
            if (err) {
                console.error('Ошибка при получении пароля:', err);
                return;
            }
            
            console.log('\nПроверка пароля для admin@tcyp.ru...');
            const isValid = await bcrypt.compare('password123', row.password_hash);
            console.log('Пароль password123 валиден:', isValid);
            
            if (!isValid) {
                console.log('\nСоздаем новый хеш для пароля password123...');
                const newHash = await bcrypt.hash('password123', 10);
                console.log('Новый хеш:', newHash);
                console.log('\nЧтобы исправить, выполните SQL:');
                console.log(`UPDATE users SET password_hash = '${newHash}' WHERE email = 'admin@tcyp.ru';`);
            }
            
            db.close();
        });
    } else {
        console.log('\nАдминистратор не найден в базе!');
        db.close();
    }
});