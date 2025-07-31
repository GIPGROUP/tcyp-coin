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
        
        console.log('✅ Схема таблицы roulette_winners исправлена');
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
}

module.exports = { fixRouletteSchema };