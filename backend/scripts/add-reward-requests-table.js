const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/sqlite.db');

async function addRewardRequestsTable() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Создаем таблицу для запросов наград
      db.run(`
        CREATE TABLE IF NOT EXISTS reward_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          reward_id INTEGER NOT NULL,
          reward_type TEXT NOT NULL,
          reward_name TEXT NOT NULL,
          reward_price INTEGER NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          processed_at DATETIME,
          processed_by INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (processed_by) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Ошибка создания таблицы:', err);
          reject(err);
          return;
        }
        console.log('✅ Таблица reward_requests успешно создана');
        
        // Создаем индексы для производительности
        db.run('CREATE INDEX IF NOT EXISTS idx_reward_requests_user_id ON reward_requests(user_id)', (err) => {
          if (err) console.error('Ошибка создания индекса user_id:', err);
        });
        
        db.run('CREATE INDEX IF NOT EXISTS idx_reward_requests_status ON reward_requests(status)', (err) => {
          if (err) console.error('Ошибка создания индекса status:', err);
        });
        
        db.run('CREATE INDEX IF NOT EXISTS idx_reward_requests_created_at ON reward_requests(created_at)', (err) => {
          if (err) console.error('Ошибка создания индекса created_at:', err);
          else console.log('✅ Индексы успешно созданы');
          
          db.close();
          resolve();
        });
      });
    });
  });
}

addRewardRequestsTable().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});