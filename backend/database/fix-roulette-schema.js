const { pool } = require('./db-postgres');

async function fixRouletteSchema() {
    try {
        console.log('🔧 Исправляем схему таблицы roulette_winners...');
        
        // Добавляем недостающие столбцы
        await pool.query(`
            ALTER TABLE roulette_winners 
            ADD COLUMN IF NOT EXISTS prize_amount INTEGER
        `);
        
        await pool.query(`
            ALTER TABLE roulette_winners 
            ADD COLUMN IF NOT EXISTS drawn_by INTEGER REFERENCES users(id) ON DELETE SET NULL
        `);
        
        // Копируем данные из amount в prize_amount если нужно
        await pool.query(`
            UPDATE roulette_winners 
            SET prize_amount = COALESCE(prize_amount, amount, 1000)
            WHERE prize_amount IS NULL
        `);
        
        // Устанавливаем значение по умолчанию для amount
        await pool.query(`
            UPDATE roulette_winners 
            SET amount = COALESCE(amount, prize_amount, 1000)
            WHERE amount IS NULL
        `);
        
        // Делаем поле amount необязательным или устанавливаем значение по умолчанию
        try {
            await pool.query(`
                ALTER TABLE roulette_winners 
                ALTER COLUMN amount DROP NOT NULL
            `);
            console.log('✅ Поле amount теперь может быть NULL');
        } catch (e) {
            // Если не получилось, пробуем установить значение по умолчанию
            try {
                await pool.query(`
                    ALTER TABLE roulette_winners 
                    ALTER COLUMN amount SET DEFAULT 1000
                `);
                console.log('✅ Установлено значение по умолчанию для amount');
            } catch (e2) {
                console.log('⚠️  Не удалось изменить поле amount:', e2.message);
            }
        }
        
        console.log('✅ Схема таблицы roulette_winners исправлена');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

module.exports = { fixRouletteSchema };