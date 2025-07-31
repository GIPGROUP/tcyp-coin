const { pool } = require('./database/db-postgres');
const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
    try {
        console.log('🔧 Обновляем пароль администратора...');
        
        // Новый пароль
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Обновляем пароль админа
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2',
            [hashedPassword, 'admin@tcyp.ru']
        );
        
        if (result.rowCount > 0) {
            console.log('✅ Пароль администратора обновлен');
            console.log('📧 Email: admin@tcyp.ru');
            console.log('🔑 Пароль: admin123');
        } else {
            console.log('❌ Администратор не найден');
        }
        
        // Проверяем всех пользователей
        const users = await pool.query('SELECT email, full_name, is_admin FROM users LIMIT 5');
        console.log('\n👥 Первые 5 пользователей в БД:');
        users.rows.forEach(user => {
            console.log(`- ${user.email} (${user.full_name}) ${user.is_admin ? '[ADMIN]' : ''}`);
        });
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await pool.end();
    }
}

// Запускаем
fixAdminPassword();