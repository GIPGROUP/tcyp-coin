require('dotenv').config();

async function clearDepartments() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        console.log('⚠️  Этот скрипт только для PostgreSQL');
        process.exit(0);
    }
    
    const { dbRun } = require('./database/db-postgres');
    
    try {
        console.log('🧹 Очистка отделов...\n');
        
        // Очищаем отделы у всех пользователей
        const result = await dbRun(`
            UPDATE users 
            SET department = ''
            WHERE department IS NOT NULL AND department != ''
        `);
        
        console.log(`✅ Очищено отделов: ${result.changes}`);
        console.log('✅ Все отделы очищены!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

// Запускаем только если вызван напрямую
if (require.main === module) {
    clearDepartments();
}

module.exports = clearDepartments;