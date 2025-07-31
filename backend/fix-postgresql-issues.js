require('dotenv').config();

async function fixPostgreSQLIssues() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        console.log('⚠️  Этот скрипт только для PostgreSQL');
        process.exit(0);
    }
    
    const { pool } = require('./database/db-postgres');
    const bcrypt = require('bcryptjs');
    
    try {
        console.log('🔧 Исправляем проблемы PostgreSQL...\n');
        
        // 1. Проверяем схему roulette_winners
        console.log('📋 Проверяем таблицу roulette_winners...');
        const columns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'roulette_winners'
            ORDER BY ordinal_position
        `);
        
        console.log('Столбцы:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        
        // 2. Добавляем недостающие столбцы если нужно
        try {
            await pool.query('ALTER TABLE roulette_winners ADD COLUMN IF NOT EXISTS prize_amount INTEGER');
            await pool.query('ALTER TABLE roulette_winners ADD COLUMN IF NOT EXISTS drawn_by INTEGER REFERENCES users(id)');
            console.log('✅ Столбцы добавлены/проверены');
        } catch (e) {
            console.log('⚠️  Столбцы уже существуют или ошибка:', e.message);
        }
        
        // 3. Исправляем пароли для пользователей GIP
        console.log('\n🔑 Проверяем пользователей GIP...');
        const defaultPassword = 'tcyp2025';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Обновляем пароли и активируем всех пользователей GIP
        const updateResult = await pool.query(`
            UPDATE users 
            SET password_hash = $1, is_active = true 
            WHERE email LIKE '%@gip.su' 
            RETURNING email, full_name
        `, [hashedPassword]);
        
        console.log(`✅ Обновлено ${updateResult.rowCount} пользователей`);
        
        // 4. Проверяем конкретных пользователей
        console.log('\n🔍 Проверяем ключевых пользователей:');
        const checkEmails = [
            'Gujovaod@gip.su',
            'savinkinave@gip.su',
            'k.e.ishchenko@gip.su'
        ];
        
        for (const email of checkEmails) {
            const result = await pool.query(
                'SELECT id, email, full_name, is_active, is_admin FROM users WHERE LOWER(email) = LOWER($1)',
                [email]
            );
            
            if (result.rows.length > 0) {
                const user = result.rows[0];
                console.log(`✅ ${user.full_name}:`);
                console.log(`   - Email: ${user.email}`);
                console.log(`   - ID: ${user.id}`);
                console.log(`   - Активен: ${user.is_active}`);
                console.log(`   - Админ: ${user.is_admin}`);
                
                // Проверяем пароль
                const passCheck = await bcrypt.compare(defaultPassword, hashedPassword);
                console.log(`   - Пароль tcyp2025: ${passCheck ? 'OK' : 'ОШИБКА'}`);
            } else {
                console.log(`❌ ${email} - НЕ НАЙДЕН`);
                
                // Ищем похожие
                const similar = await pool.query(
                    'SELECT email, full_name FROM users WHERE email ILIKE $1 LIMIT 5',
                    [`%${email.split('@')[0]}%`]
                );
                
                if (similar.rows.length > 0) {
                    console.log('   Возможные варианты:');
                    similar.rows.forEach(u => {
                        console.log(`   - ${u.email} (${u.full_name})`);
                    });
                }
            }
        }
        
        // 5. Проверяем транзакции
        console.log('\n📋 Проверяем структуру transactions...');
        const transColumns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'transactions'
            ORDER BY ordinal_position
        `);
        
        console.log('Столбцы transactions:');
        transColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        
        // 6. Добавляем user_id и admin_id если их нет
        try {
            await pool.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)');
            await pool.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES users(id)');
            console.log('✅ Столбцы user_id и admin_id добавлены/проверены');
        } catch (e) {
            console.log('⚠️  Столбцы уже существуют или ошибка:', e.message);
        }
        
        console.log('\n✅ Все проверки завершены!');
        console.log('\n📧 Все пользователи могут входить с паролем: tcyp2025');
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
    } finally {
        await pool.end();
    }
}

// Запускаем
fixPostgreSQLIssues();