// Автоматическая очистка должностей при старте
async function autoClearPositions() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        return; // Только для production
    }
    
    const { pool } = require('./database/db-postgres');
    
    try {
        // Очищаем должности у всех пользователей
        const result = await pool.query(`
            UPDATE users 
            SET position = ''
            WHERE position IS NOT NULL AND position != ''
        `);
        
        if (result.rowCount > 0) {
            console.log(`✅ Очищено должностей: ${result.rowCount}`);
        }
        
    } catch (error) {
        console.error('⚠️  Не удалось очистить должности:', error.message);
    }
}

module.exports = { autoClearPositions };