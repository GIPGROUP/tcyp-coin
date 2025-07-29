const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'tcyp_coins.db');

// Удаляем старую базу данных
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Старая база данных удалена.');
}

// Создаем новую
const { initDatabase } = require('./init-fixed');
initDatabase();
console.log('Новая база данных создана.');