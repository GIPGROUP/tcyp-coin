const Database = require('better-sqlite3');
const path = require('path');

// Создаем подключение к базе данных
const db = new Database(path.join(__dirname, 'tcyp_coins.db'));

// Включаем поддержку внешних ключей
db.pragma('foreign_keys = ON');

// Обертки для совместимости с существующим кодом
const dbAll = (sql, params = []) => {
    try {
        const stmt = db.prepare(sql);
        return Promise.resolve(stmt.all(...params));
    } catch (error) {
        return Promise.reject(error);
    }
};

const dbGet = (sql, params = []) => {
    try {
        const stmt = db.prepare(sql);
        return Promise.resolve(stmt.get(...params));
    } catch (error) {
        return Promise.reject(error);
    }
};

const dbRun = (sql, params = []) => {
    try {
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        return Promise.resolve({ 
            id: result.lastInsertRowid, 
            changes: result.changes 
        });
    } catch (error) {
        return Promise.reject(error);
    }
};

module.exports = {
    db,
    dbAll,
    dbGet,
    dbRun
};