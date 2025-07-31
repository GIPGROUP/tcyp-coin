const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Подключаемся к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'database', 'tcyp_coins.db'));

console.log('🗑️  Удаление тестовых пользователей...\n');

// Тестовые пользователи для удаления
const testUsers = [
    'admin@tcyp.ru',
    'alexandrov@tcyp.ru'
];

// Сначала показываем, кого будем удалять
db.all(`SELECT id, email, full_name FROM users WHERE email IN (${testUsers.map(() => '?').join(',')})`, testUsers, (err, users) => {
    if (err) {
        console.error('Ошибка при получении пользователей:', err);
        db.close();
        return;
    }
    
    if (users.length === 0) {
        console.log('Тестовые пользователи не найдены.');
        db.close();
        return;
    }
    
    console.log('Найдены следующие тестовые пользователи для удаления:');
    users.forEach(user => {
        console.log(`- ${user.email} (${user.full_name})`);
    });
    
    console.log('\n🚀 Начинаем удаление...');
    
    // Удаляем пользователей
    db.run(`DELETE FROM users WHERE email IN (${testUsers.map(() => '?').join(',')})`, testUsers, function(err) {
        if (err) {
            console.error('❌ Ошибка при удалении:', err);
        } else {
            console.log(`✅ Успешно удалено ${this.changes} пользователей`);
            
            // Показываем статистику
            db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
                if (!err) {
                    console.log(`\n📊 Всего пользователей в БД осталось: ${result.count}`);
                }
                
                db.get('SELECT COUNT(*) as count FROM users WHERE is_admin = 1', (err, result) => {
                    if (!err) {
                        console.log(`👑 Администраторов: ${result.count}`);
                    }
                    
                    // Показываем администраторов
                    db.all('SELECT email, full_name FROM users WHERE is_admin = 1', (err, admins) => {
                        if (!err && admins.length > 0) {
                            console.log('\n🔑 Текущие администраторы:');
                            admins.forEach(admin => {
                                console.log(`  - ${admin.full_name} (${admin.email})`);
                            });
                        }
                        
                        console.log('\n✅ Очистка завершена!');
                        db.close();
                    });
                });
            });
        }
    });
});