require('dotenv').config();
const { dbGet, dbRun } = require('./database/db');
const bcrypt = require('bcryptjs');

async function resetUserPassword() {
    const email = process.argv[2];
    const newPassword = process.argv[3] || 'tcyp2025';
    
    if (!email) {
        console.log('❌ Использование: node reset-user-password.js <email> [новый_пароль]');
        console.log('   Пример: node reset-user-password.js Gujovaod@gip.su');
        console.log('   Пример: node reset-user-password.js Gujovaod@gip.su myNewPassword123');
        process.exit(1);
    }
    
    try {
        console.log(`🔍 Ищем пользователя с email: ${email}`);
        
        // Находим пользователя
        const user = await dbGet('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
        
        if (!user) {
            console.log('❌ Пользователь не найден!');
            
            // Показываем похожие email
            const similar = await dbGet(`
                SELECT email, full_name 
                FROM users 
                WHERE LOWER(email) LIKE LOWER(?)
                LIMIT 5
            `, [`%${email.split('@')[0]}%`]);
            
            if (similar) {
                console.log('\n📋 Возможно, вы имели в виду:');
                console.log(`  - ${similar.email} (${similar.full_name})`);
            }
            
            process.exit(1);
        }
        
        console.log(`✅ Найден: ${user.full_name} (${user.email})`);
        console.log(`  - ID: ${user.id}`);
        console.log(`  - Активен: ${user.is_active}`);
        console.log(`  - Админ: ${user.is_admin}`);
        
        // Хешируем новый пароль
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Обновляем пароль
        await dbRun(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, user.id]
        );
        
        // Если пользователь неактивен, активируем его
        if (!user.is_active) {
            await dbRun(
                'UPDATE users SET is_active = true WHERE id = ?',
                [user.id]
            );
            console.log('✅ Пользователь активирован');
        }
        
        console.log(`\n✅ Пароль успешно обновлен!`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔑 Новый пароль: ${newPassword}`);
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
    
    process.exit(0);
}

// Запускаем
resetUserPassword();