require('dotenv').config();

async function clearPositions() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    console.log('🧹 Очистка должностей...\n');
    
    if (isPostgreSQL) {
        const { pool } = require('./database/db-postgres');
        
        try {
            // Очищаем должности у всех пользователей
            const result = await pool.query(`
                UPDATE users 
                SET position = ''
                WHERE position IS NOT NULL OR position != ''
            `);
            
            console.log(`✅ Очищено должностей: ${result.rowCount}`);
            
        } catch (error) {
            console.error('❌ Ошибка:', error);
        } finally {
            await pool.end();
        }
    } else {
        // Для локальной SQLite
        const { dbRun } = require('./database/db');
        
        try {
            await dbRun(`
                UPDATE users 
                SET position = ''
                WHERE position IS NOT NULL OR position != ''
            `);
            
            console.log('✅ Должности очищены');
            
        } catch (error) {
            console.error('❌ Ошибка:', error);
        }
    }
}

// Экспортируем для использования в других модулях
module.exports = clearPositions;

// Запускаем только если вызван напрямую
if (require.main === module) {
    clearPositions();
}