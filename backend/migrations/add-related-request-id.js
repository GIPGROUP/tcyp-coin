const { pool } = require('../database/db-postgres');

async function addRelatedRequestId() {
    try {
        // Проверяем, существует ли колонка
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'admin_actions' 
            AND column_name = 'related_request_id'
        `);
        
        if (checkColumn.rows.length === 0) {
            console.log('Добавляем колонку related_request_id в таблицу admin_actions...');
            
            await pool.query(`
                ALTER TABLE admin_actions 
                ADD COLUMN related_request_id INTEGER REFERENCES requests(id) ON DELETE SET NULL
            `);
            
            console.log('✅ Колонка related_request_id добавлена');
        } else {
            console.log('✅ Колонка related_request_id уже существует');
        }
    } catch (error) {
        console.error('Ошибка при добавлении колонки:', error);
        throw error;
    }
}

// Если запущен напрямую
if (require.main === module) {
    addRelatedRequestId()
        .then(() => {
            console.log('Миграция завершена');
            pool.end();
            process.exit(0);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            pool.end();
            process.exit(1);
        });
}

module.exports = { addRelatedRequestId };