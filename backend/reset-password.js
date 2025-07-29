const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const db = new sqlite3.Database(path.join(__dirname, 'database', 'tcyp_coins.db'));

async function resetPassword() {
    const email = process.argv[2] || 'admin@tcyp.ru';
    const newPassword = 'password123';
    const hash = await bcrypt.hash(newPassword, 10);
    
    console.log(`Сбрасываем пароль для ${email}...`);
    
    db.run("UPDATE users SET password_hash = ? WHERE email = ?", [hash, email], function(err) {
        if (err) {
            console.error('Ошибка:', err);
            return;
        }
        
        if (this.changes > 0) {
            console.log('✅ Пароль успешно сброшен!');
            console.log('Новые данные для входа:');
            console.log(`Email: ${email}`);
            console.log('Пароль: password123');
        } else {
            console.log(`❌ Пользователь ${email} не найден!`);
        }
        
        db.close();
    });
}

resetPassword();