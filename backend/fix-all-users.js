require('dotenv').config();
const { dbAll, dbRun, dbGet } = require('./database/db');
const bcrypt = require('bcryptjs');

async function fixAllUsers() {
    console.log('🔧 Исправление всех пользователей...\n');
    
    try {
        // Стандартный пароль
        const defaultPassword = 'tcyp2025';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Получаем всех пользователей из домена gip.su
        const users = await dbAll(`
            SELECT id, email, full_name, is_active, password_hash
            FROM users
            WHERE email LIKE '%@gip.su'
            ORDER BY full_name
        `);
        
        console.log(`📊 Найдено ${users.length} пользователей GIP\n`);
        
        let fixed = 0;
        let activated = 0;
        
        for (const user of users) {
            let needsUpdate = false;
            const updates = [];
            
            // Проверяем пароль
            if (!user.password_hash) {
                console.log(`❌ ${user.full_name} - нет пароля`);
                needsUpdate = true;
            } else {
                // Проверяем, работает ли пароль tcyp2025
                const isValidPassword = await bcrypt.compare(defaultPassword, user.password_hash);
                if (!isValidPassword) {
                    console.log(`⚠️  ${user.full_name} - пароль не tcyp2025`);
                    needsUpdate = true;
                }
            }
            
            // Проверяем активность
            if (!user.is_active) {
                console.log(`🔒 ${user.full_name} - неактивен`);
                activated++;
            }
            
            // Обновляем пользователя если нужно
            if (needsUpdate || !user.is_active) {
                await dbRun(`
                    UPDATE users 
                    SET password_hash = ?, is_active = true 
                    WHERE id = ?
                `, [hashedPassword, user.id]);
                
                console.log(`  ✅ Исправлен: ${user.full_name}`);
                fixed++;
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 РЕЗУЛЬТАТЫ:');
        console.log('='.repeat(50));
        console.log(`✅ Исправлено паролей: ${fixed}`);
        console.log(`✅ Активировано пользователей: ${activated}`);
        console.log(`\n📧 Все пользователи GIP теперь могут войти с паролем: ${defaultPassword}`);
        
        // Проверяем конкретных пользователей
        console.log('\n🔍 Проверка ключевых пользователей:');
        console.log('='.repeat(50));
        
        const checkEmails = [
            'Gujovaod@gip.su',
            'k.e.ishchenko@gip.su',
            'savinkinave@gip.su',
            'manckovama@gip.su'
        ];
        
        for (const email of checkEmails) {
            const user = await dbGet(`
                SELECT email, full_name, is_active, is_admin 
                FROM users 
                WHERE LOWER(email) = LOWER(?)
            `, [email]);
            
            if (user) {
                console.log(`✅ ${user.full_name}:`);
                console.log(`   - Email: ${user.email}`);
                console.log(`   - Активен: ${user.is_active ? 'ДА' : 'НЕТ'}`);
                console.log(`   - Админ: ${user.is_admin ? 'ДА' : 'НЕТ'}`);
            } else {
                console.log(`❌ ${email} - НЕ НАЙДЕН`);
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
    
    process.exit(0);
}

// Запускаем
fixAllUsers();