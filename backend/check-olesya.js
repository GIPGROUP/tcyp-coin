require('dotenv').config();
const bcrypt = require('bcryptjs');

async function checkOlesya() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    console.log('🔍 Проверка пользователя Олеси Гужовой...\n');
    console.log(`📋 Окружение: ${isPostgreSQL ? 'PostgreSQL (Production)' : 'SQLite (Local)'}`);
    
    if (isPostgreSQL) {
        const { pool } = require('./database/db-postgres');
        
        try {
            // Ищем по разным вариантам email
            const emails = [
                'Gujovaod@gip.su',
                'gujovaod@gip.su',
                'GUJOVAOD@GIP.SU'
            ];
            
            console.log('🔍 Поиск по вариантам email:');
            for (const email of emails) {
                const result = await pool.query(
                    'SELECT id, email, full_name, is_active, password_hash FROM users WHERE email = $1',
                    [email]
                );
                
                if (result.rows.length > 0) {
                    const user = result.rows[0];
                    console.log(`\n✅ НАЙДЕН с email: ${email}`);
                    console.log(`  - ID: ${user.id}`);
                    console.log(`  - Email в БД: ${user.email}`);
                    console.log(`  - ФИО: ${user.full_name}`);
                    console.log(`  - Активен: ${user.is_active}`);
                    console.log(`  - Есть хеш пароля: ${user.password_hash ? 'ДА' : 'НЕТ'}`);
                    
                    if (user.password_hash) {
                        // Проверяем пароль
                        const isValid = await bcrypt.compare('tcyp2025', user.password_hash);
                        console.log(`  - Пароль tcyp2025 валиден: ${isValid ? 'ДА' : 'НЕТ'}`);
                        
                        if (!isValid) {
                            // Пробуем другие варианты
                            const otherPasswords = ['password123', 'admin123', 'tcyp2024'];
                            for (const pwd of otherPasswords) {
                                const valid = await bcrypt.compare(pwd, user.password_hash);
                                if (valid) {
                                    console.log(`  - ⚠️  Работает пароль: ${pwd}`);
                                }
                            }
                        }
                    }
                    
                    return;
                }
            }
            
            console.log('\n❌ Пользователь НЕ НАЙДЕН ни по одному варианту email!');
            
            // Ищем похожих
            console.log('\n🔍 Поиск похожих пользователей:');
            const similar = await pool.query(
                `SELECT email, full_name, is_active 
                 FROM users 
                 WHERE email ILIKE '%gujova%' OR email ILIKE '%gip.su%'
                 ORDER BY email
                 LIMIT 10`
            );
            
            if (similar.rows.length > 0) {
                console.log('Найдены похожие:');
                similar.rows.forEach(u => {
                    console.log(`  - ${u.email} (${u.full_name}) - активен: ${u.is_active}`);
                });
            }
            
            // Проверяем регистр email
            console.log('\n🔍 Проверка чувствительности к регистру:');
            const caseCheck = await pool.query(
                `SELECT email, full_name 
                 FROM users 
                 WHERE LOWER(email) = LOWER($1)`,
                ['Gujovaod@gip.su']
            );
            
            if (caseCheck.rows.length > 0) {
                console.log('✅ Найден с учетом регистра:');
                caseCheck.rows.forEach(u => {
                    console.log(`  - Email в БД: "${u.email}" (обратите внимание на регистр!)`);
                });
            }
            
            await pool.end();
            
        } catch (error) {
            console.error('❌ Ошибка:', error);
        }
    } else {
        // Для локальной SQLite
        const { dbGet, dbAll } = require('./database/db');
        
        try {
            const user = await dbGet(
                'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
                ['Gujovaod@gip.su']
            );
            
            if (user) {
                console.log('✅ Пользователь найден в SQLite');
                console.log(`  - Email: ${user.email}`);
                console.log(`  - ФИО: ${user.full_name}`);
                console.log(`  - Активен: ${user.is_active}`);
            } else {
                console.log('❌ Пользователь не найден');
            }
        } catch (error) {
            console.error('❌ Ошибка:', error);
        }
    }
    
    process.exit(0);
}

// Запускаем
checkOlesya();