require('dotenv').config();

async function fixRouletteManual() {
    const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
    
    if (!isPostgreSQL) {
        console.log('⚠️  Этот скрипт только для PostgreSQL');
        process.exit(0);
    }
    
    const { pool } = require('./database/db-postgres');
    
    try {
        console.log('🔧 Исправляем таблицу roulette_winners...\n');
        
        // Смотрим текущую структуру
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'roulette_winners'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Текущая структура:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default || 'none'})`);
        });
        
        // Пробуем различные способы исправить проблему
        console.log('\n🔧 Применяем исправления...');
        
        // 1. Делаем amount nullable
        try {
            await pool.query('ALTER TABLE roulette_winners ALTER COLUMN amount DROP NOT NULL');
            console.log('✅ Поле amount теперь может быть NULL');
        } catch (e) {
            console.log('⚠️  Не удалось сделать amount nullable:', e.message);
        }
        
        // 2. Устанавливаем значение по умолчанию
        try {
            await pool.query('ALTER TABLE roulette_winners ALTER COLUMN amount SET DEFAULT 1000');
            console.log('✅ Установлено значение по умолчанию 1000 для amount');
        } catch (e) {
            console.log('⚠️  Не удалось установить значение по умолчанию:', e.message);
        }
        
        // 3. Заполняем NULL значения
        const updateResult = await pool.query(`
            UPDATE roulette_winners 
            SET amount = COALESCE(amount, prize_amount, 1000)
            WHERE amount IS NULL
        `);
        console.log(`✅ Обновлено ${updateResult.rowCount} записей с NULL amount`);
        
        // 4. Проверяем существующие записи
        const winners = await pool.query('SELECT * FROM roulette_winners ORDER BY created_at DESC LIMIT 5');
        console.log(`\n📊 Последние победители (всего: ${winners.rowCount}):`);
        winners.rows.forEach(w => {
            console.log(`  - user_id: ${w.user_id}, amount: ${w.amount}, prize_amount: ${w.prize_amount}, year: ${w.year}, week: ${w.week_number}`);
        });
        
        // 5. Финальная проверка структуры
        console.log('\n📋 Финальная структура:');
        const finalColumns = await pool.query(`
            SELECT column_name, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'roulette_winners' 
            AND column_name IN ('amount', 'prize_amount', 'week_number', 'year')
        `);
        
        finalColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name}: nullable=${col.is_nullable}, default=${col.column_default || 'none'}`);
        });
        
        console.log('\n✅ Исправления применены!');
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
    } finally {
        await pool.end();
    }
}

// Запускаем
fixRouletteManual();