require('dotenv').config();
const bcrypt = require('bcryptjs');

async function fixLoginIssue() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        console.log('⚠️  Этот скрипт только для PostgreSQL');
        process.exit(0);
    }
    
    const { pool } = require('./database/db-postgres');
    
    try {
        console.log('🔧 Исправление проблем с входом...\n');
        
        // Стандартный пароль
        const defaultPassword = 'tcyp2025';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Обновляем ВСЕХ пользователей @gip.su
        console.log('🔄 Обновляем пароли для всех пользователей GIP...');
        
        const updateResult = await pool.query(`
            UPDATE users 
            SET password_hash = $1, is_active = true 
            WHERE email LIKE '%@gip.su'
            RETURNING email, full_name
        `, [hashedPassword]);
        
        console.log(`✅ Обновлено ${updateResult.rowCount} пользователей`);
        
        if (updateResult.rowCount > 0) {
            console.log('\n📋 Обновленные пользователи:');
            updateResult.rows.forEach(user => {
                console.log(`  - ${user.full_name} (${user.email})`);
            });
        }
        
        // Проверяем конкретных пользователей
        console.log('\n🔍 Проверка ключевых пользователей:');
        
        const checkEmails = [
            'Gujovaod@gip.su',
            'savinkinave@gip.su',
            'manckovama@gip.su'
        ];
        
        for (const email of checkEmails) {
            const result = await pool.query(
                'SELECT id, email, full_name, is_active FROM users WHERE LOWER(email) = LOWER($1)',
                [email]
            );
            
            if (result.rows.length > 0) {
                const user = result.rows[0];
                console.log(`\n✅ ${user.full_name}:`);
                console.log(`  - Email в БД: ${user.email}`);
                console.log(`  - Активен: ${user.is_active}`);
                console.log(`  - Может войти с паролем: ${defaultPassword}`);
            } else {
                console.log(`\n❌ ${email} - НЕ НАЙДЕН`);
            }
        }
        
        console.log('\n✅ Все пользователи GIP теперь могут входить с паролем: tcyp2025');
        console.log('📝 Используйте email без учета регистра');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await pool.end();
    }
}

// Запускаем
fixLoginIssue();