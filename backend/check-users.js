require('dotenv').config();
const { dbAll, dbGet } = require('./database/db');
const bcrypt = require('bcryptjs');

async function checkUsers() {
    console.log('🔍 Проверка пользователей в БД...\n');
    
    try {
        // Получаем всех пользователей
        const users = await dbAll(`
            SELECT id, email, full_name, is_active, is_admin, password_hash
            FROM users
            ORDER BY full_name
        `);
        
        console.log(`📊 Всего пользователей: ${users.length}\n`);
        
        // Проверяем конкретных пользователей
        console.log('🔍 Проверяем проблемных пользователей:');
        console.log('=' .repeat(80));
        
        // Гужова Олеся
        const olesya = users.find(u => u.email === 'Gujovaod@gip.su');
        if (olesya) {
            console.log('\n👤 Гужова Олеся:');
            console.log(`  - ID: ${olesya.id}`);
            console.log(`  - Email: ${olesya.email}`);
            console.log(`  - ФИО: ${olesya.full_name}`);
            console.log(`  - Активен: ${olesya.is_active}`);
            console.log(`  - Есть пароль: ${olesya.password_hash ? 'ДА' : 'НЕТ'}`);
            
            // Проверяем пароль
            const testPassword = 'tcyp2025';
            const isValidPassword = await bcrypt.compare(testPassword, olesya.password_hash);
            console.log(`  - Пароль tcyp2025 работает: ${isValidPassword ? 'ДА' : 'НЕТ'}`);
        } else {
            console.log('\n❌ Гужова Олеся НЕ НАЙДЕНА!');
        }
        
        // Ищенко Кристина
        const kristina = users.find(u => u.email === 'k.e.ishchenko@gip.su');
        if (kristina) {
            console.log('\n👤 Ищенко Кристина:');
            console.log(`  - ID: ${kristina.id}`);
            console.log(`  - Email: ${kristina.email}`);
            console.log(`  - ФИО: ${kristina.full_name}`);
            console.log(`  - Активен: ${kristina.is_active}`);
            console.log(`  - Есть пароль: ${kristina.password_hash ? 'ДА' : 'НЕТ'}`);
            
            // Проверяем пароль
            const isValidPassword = await bcrypt.compare(testPassword, kristina.password_hash);
            console.log(`  - Пароль tcyp2025 работает: ${isValidPassword ? 'ДА' : 'НЕТ'}`);
        }
        
        // Проверяем дубликаты email
        console.log('\n\n🔍 Проверка дубликатов email:');
        console.log('=' .repeat(80));
        
        const emailCounts = {};
        users.forEach(user => {
            const email = user.email.toLowerCase();
            emailCounts[email] = (emailCounts[email] || 0) + 1;
        });
        
        const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1);
        if (duplicates.length > 0) {
            console.log('❌ Найдены дубликаты:');
            duplicates.forEach(([email, count]) => {
                console.log(`  - ${email}: ${count} записей`);
            });
        } else {
            console.log('✅ Дубликатов не найдено');
        }
        
        // Проверяем пользователей без паролей
        console.log('\n\n🔍 Проверка паролей:');
        console.log('=' .repeat(80));
        
        const noPassword = users.filter(u => !u.password_hash);
        if (noPassword.length > 0) {
            console.log(`❌ Пользователи без паролей (${noPassword.length}):`);
            noPassword.forEach(u => {
                console.log(`  - ${u.full_name} (${u.email})`);
            });
        } else {
            console.log('✅ У всех пользователей есть пароли');
        }
        
        // Проверяем неактивных пользователей
        const inactive = users.filter(u => !u.is_active);
        if (inactive.length > 0) {
            console.log(`\n❌ Неактивные пользователи (${inactive.length}):`);
            inactive.forEach(u => {
                console.log(`  - ${u.full_name} (${u.email})`);
            });
        }
        
        // Список первых 10 пользователей
        console.log('\n\n📋 Первые 10 пользователей:');
        console.log('=' .repeat(80));
        users.slice(0, 10).forEach(u => {
            console.log(`${u.id}. ${u.full_name} (${u.email}) - Активен: ${u.is_active}`);
        });
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
    
    process.exit(0);
}

// Запускаем проверку
checkUsers();