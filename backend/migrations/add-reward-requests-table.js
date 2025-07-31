const { pool } = require('../database/db-postgres');

async function createRewardRequestsTable() {
  console.log('🔄 Создание таблицы reward_requests...');
  
  try {
    // Создаем таблицу reward_requests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reward_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        reward_id INTEGER NOT NULL,
        reward_type VARCHAR(50) NOT NULL,
        reward_name VARCHAR(255) NOT NULL,
        reward_price INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        processed_by INTEGER REFERENCES users(id)
      )
    `);
    
    console.log('✅ Таблица reward_requests создана');
    
    // Создаем индексы
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reward_requests_user_id ON reward_requests(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reward_requests_status ON reward_requests(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reward_requests_created_at ON reward_requests(created_at)');
    
    console.log('✅ Индексы для reward_requests созданы');
    
  } catch (error) {
    console.error('❌ Ошибка создания таблицы reward_requests:', error);
    throw error;
  }
}

module.exports = { createRewardRequestsTable };