require('dotenv').config();
const bcrypt = require('bcryptjs');

async function forceResetOlesya() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        console.log('⚠️  Этот скрипт только для PostgreSQL');
        process.exit(0);
    }
    
    const { pool } = require('./database/db-postgres');
    
    try {
        console.log('🔧 Принудительный сброс пароля для Олеси Гужовой...\n');
        
        const newPassword = 'tcyp2025';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Пробуем все варианты email
        const emails = [
            'Gujovaod@gip.su',
            'gujovaod@gip.su',
            'GUJOVAOD@GIP.SU'
        ];
        
        let updated = false;
        
        for (const email of emails) {
            const result = await pool.query(
                `UPDATE users 
                 SET password_hash = $1, is_active = true 
                 WHERE email = $2 OR LOWER(email) = LOWER($2)
                 RETURNING id, email, full_name`,
                [hashedPassword, email]
            );
            
            if (result.rowCount > 0) {
                console.log(`✅ Обновлен пользователь:`);
                result.rows.forEach(user => {
                    console.log(`  - ID: ${user.id}`);
                    console.log(`  - Email: ${user.email}`);
                    console.log(`  - ФИО: ${user.full_name}`);
                });
                updated = true;
                break;
            }
        }
        
        if (!updated) {
            console.log('❌ Пользователь не найден!');
            
            // Создаем нового пользователя
            console.log('\n🆕 Создаем нового пользователя...');
            
            const insertResult = await pool.query(
                `INSERT INTO users (email, password_hash, full_name, position, department, is_admin, balance, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (email) DO UPDATE 
                 SET password_hash = $2, is_active = $8
                 RETURNING id, email, full_name`,
                [
                    'Gujovaod@gip.su',
                    hashedPassword,
                    'Гужова Олеся Денисовна',
                    'Инженер-конструктор',
                    'ТЦУП',
                    false,
                    0,
                    true
                ]
            );
            
            if (insertResult.rowCount > 0) {
                console.log('✅ Пользователь создан/обновлен:');
                console.log(`  - ID: ${insertResult.rows[0].id}`);
                console.log(`  - Email: ${insertResult.rows[0].email}`);
                console.log(`  - ФИО: ${insertResult.rows[0].full_name}`);
            }
        }
        
        console.log(`\n✅ Готово!`);
        console.log(`📧 Email: Gujovaod@gip.su`);
        console.log(`🔑 Пароль: ${newPassword}`);
        
        // Проверяем результат
        console.log('\n🔍 Финальная проверка:');
        const checkResult = await pool.query(
            `SELECT id, email, full_name, is_active, position 
             FROM users 
             WHERE LOWER(email) = LOWER($1)`,
            ['Gujovaod@gip.su']
        );
        
        if (checkResult.rows.length > 0) {
            const user = checkResult.rows[0];
            console.log(`✅ Пользователь в БД:`);
            console.log(`  - Email: ${user.email}`);
            console.log(`  - ФИО: ${user.full_name}`);
            console.log(`  - Должность: ${user.position}`);
            console.log(`  - Активен: ${user.is_active}`);
            
            // Проверяем пароль
            const passCheck = await bcrypt.compare(newPassword, hashedPassword);
            console.log(`  - Пароль работает: ${passCheck ? 'ДА' : 'НЕТ'}`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await pool.end();
    }
}

// Запускаем
forceResetOlesya();