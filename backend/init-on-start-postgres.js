const { pool } = require('./database/db-postgres');
const { createRewardRequestsTable } = require('./migrations/add-reward-requests-table');

console.log('🔧 Проверяем и обновляем структуру PostgreSQL БД...');

async function applyFixes() {
    try {
        // Сначала создаем таблицу reward_requests если её нет
        try {
            await createRewardRequestsTable();
        } catch (error) {
            console.log('⚠️  Таблица reward_requests уже существует или ошибка:', error.message);
        }
        // Список изменений для применения
        const alterations = [
            {
                name: 'Добавить hire_date в users',
                query: `ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE`
            },
            {
                name: 'Добавить related_request_id в admin_actions',
                query: `ALTER TABLE admin_actions ADD COLUMN IF NOT EXISTS related_request_id INTEGER REFERENCES requests(id) ON DELETE SET NULL`
            },
            {
                name: 'Добавить admin_id в requests',
                query: `ALTER TABLE requests ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL`
            }
        ];
        
        // Применяем изменения
        for (const alteration of alterations) {
            try {
                await pool.query(alteration.query);
                console.log(`✅ ${alteration.name}`);
            } catch (error) {
                if (!error.message.includes('already exists')) {
                    console.error(`❌ ${alteration.name}: ${error.message}`);
                }
            }
        }
        
        console.log('\n✅ Проверка структуры БД завершена');
        
    } catch (error) {
        console.error('❌ Ошибка при проверке БД:', error);
    }
}

// Если скрипт запущен напрямую
if (require.main === module) {
    applyFixes().then(() => {
        pool.end();
    });
}

module.exports = { applyFixes };