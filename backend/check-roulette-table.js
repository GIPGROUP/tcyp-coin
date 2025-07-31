require('dotenv').config();
const { dbAll } = require('./database/db');

async function checkRouletteTable() {
    console.log('🔍 Проверка таблицы roulette_winners...\n');
    
    try {
        const isPostgreSQL = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
        
        if (isPostgreSQL) {
            // Для PostgreSQL
            const { pool } = require('./database/db-postgres');
            
            const columns = await pool.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'roulette_winners'
                ORDER BY ordinal_position
            `);
            
            console.log('📋 Структура таблицы roulette_winners в PostgreSQL:');
            console.log('=' .repeat(50));
            columns.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
            
            // Проверяем данные
            const winners = await pool.query('SELECT * FROM roulette_winners ORDER BY created_at DESC LIMIT 5');
            console.log(`\n📊 Записей в таблице: ${winners.rowCount}`);
            
            await pool.end();
        } else {
            // Для SQLite
            const tableInfo = await dbAll("PRAGMA table_info(roulette_winners)");
            
            console.log('📋 Структура таблицы roulette_winners в SQLite:');
            console.log('=' .repeat(50));
            tableInfo.forEach(col => {
                console.log(`  - ${col.name}: ${col.type} (nullable: ${!col.notnull})`);
            });
            
            // Проверяем данные
            const winners = await dbAll('SELECT * FROM roulette_winners ORDER BY created_at DESC LIMIT 5');
            console.log(`\n📊 Записей в таблице: ${winners.length}`);
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
    }
    
    process.exit(0);
}

// Запускаем
checkRouletteTable();