const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Все роуты требуют авторизации и прав администратора
router.use(authenticateToken, requireAdmin);

// Получить список всех сотрудников
router.get('/employees', async (req, res) => {
    try {
        const employees = await dbAll(`
            SELECT 
                id, 
                email, 
                full_name,
                position,
                department,
                balance as coins,
                hire_date,
                CAST((julianday('now') - julianday(hire_date)) / 365.25 AS INTEGER) as years,
                CAST(((julianday('now') - julianday(hire_date)) % 365.25) / 30.44 AS INTEGER) as months
            FROM users
            WHERE is_admin = 0
            ORDER BY balance DESC
        `);

        // Форматируем период работы
        const formattedEmployees = employees.map(emp => ({
            ...emp,
            startDate: new Date(emp.hire_date).toLocaleDateString('ru-RU'),
            workPeriod: `${emp.years} ${emp.years === 1 ? 'год' : emp.years < 5 ? 'года' : 'лет'} ${emp.months} ${emp.months === 1 ? 'месяц' : emp.months < 5 ? 'месяца' : 'месяцев'}`
        }));

        res.json(formattedEmployees);
    } catch (error) {
        console.error('Error getting employees:', error);
        res.status(500).json({ message: 'Ошибка получения списка сотрудников' });
    }
});

// Получить ожидающие заявки
router.get('/requests/pending', async (req, res) => {
    try {
        const requests = await dbAll(`
            SELECT 
                cr.*,
                u.full_name as employee
            FROM coin_requests cr
            JOIN users u ON cr.user_id = u.id
            WHERE cr.status = 'pending'
            ORDER BY cr.created_at DESC
        `);

        const formattedRequests = requests.map(req => ({
            ...req,
            employeeId: req.user_id,
            submittedDate: new Date(req.created_at).toLocaleString('ru-RU'),
            activityType: req.activity_type,
            expectedCoins: req.expected_coins
        }));

        res.json(formattedRequests);
    } catch (error) {
        console.error('Error getting pending requests:', error);
        res.status(500).json({ message: 'Ошибка получения заявок' });
    }
});

// Одобрить заявку
router.post('/requests/:id/approve', async (req, res) => {
    try {
        const requestId = req.params.id;
        
        // Получаем информацию о заявке
        const request = await dbGet('SELECT * FROM coin_requests WHERE id = ?', [requestId]);
        
        if (!request) {
            return res.status(404).json({ message: 'Заявка не найдена' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Заявка уже обработана' });
        }

        // Начинаем транзакцию
        await dbRun('BEGIN TRANSACTION');

        try {
            // Обновляем статус заявки
            await dbRun(`
                UPDATE coin_requests 
                SET status = 'approved', 
                    admin_id = ?, 
                    processed_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `, [req.user.id, requestId]);

            // Добавляем коины пользователю
            await dbRun(`
                UPDATE users 
                SET balance = balance + ? 
                WHERE id = ?
            `, [request.expected_coins, request.user_id]);

            // Создаем транзакцию
            await dbRun(`
                INSERT INTO transactions (user_id, amount, type, description, admin_id)
                VALUES (?, ?, 'earn', ?, ?)
            `, [request.user_id, request.expected_coins, `Одобрена заявка: ${request.activity_type}`, req.user.id]);

            // Создаем запись в admin_actions
            const actionResult = await dbRun(`
                INSERT INTO admin_actions (admin_id, action_type, target_user_id, amount, description, related_request_id)
                VALUES (?, 'approve', ?, ?, ?, ?)
            `, [req.user.id, request.user_id, request.expected_coins, `Одобрена заявка: ${request.activity_type}`, requestId]);

            await dbRun('COMMIT');

            res.json({ 
                message: 'Заявка успешно одобрена',
                actionId: actionResult.id
            });
        } catch (error) {
            await dbRun('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ message: 'Ошибка одобрения заявки' });
    }
});

// Отклонить заявку
router.post('/requests/:id/reject', [
    body('reason').optional().trim()
], async (req, res) => {
    try {
        const requestId = req.params.id;
        const { reason } = req.body;
        
        const request = await dbGet('SELECT * FROM coin_requests WHERE id = ?', [requestId]);
        
        if (!request) {
            return res.status(404).json({ message: 'Заявка не найдена' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: 'Заявка уже обработана' });
        }

        // Обновляем статус заявки
        await dbRun(`
            UPDATE coin_requests 
            SET status = 'rejected', 
                admin_id = ?, 
                admin_comment = ?,
                processed_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [req.user.id, reason, requestId]);

        // Создаем запись в admin_actions
        await dbRun(`
            INSERT INTO admin_actions (admin_id, action_type, target_user_id, amount, description, related_request_id)
            VALUES (?, 'reject', ?, 0, ?, ?)
        `, [req.user.id, request.user_id, `Отклонена заявка: ${request.activity_type}`, requestId]);

        res.json({ message: 'Заявка отклонена' });
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ message: 'Ошибка отклонения заявки' });
    }
});

// Добавить коины вручную
router.post('/coins/add', [
    body('userId').isInt(),
    body('amount').isInt({ min: 1 }),
    body('reason').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId, amount, reason } = req.body;

        await dbRun('BEGIN TRANSACTION');

        try {
            // Обновляем баланс
            await dbRun('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId]);

            // Создаем транзакцию
            await dbRun(`
                INSERT INTO transactions (user_id, amount, type, description, admin_id)
                VALUES (?, ?, 'admin_add', ?, ?)
            `, [userId, amount, reason, req.user.id]);

            // Создаем запись в admin_actions
            const actionResult = await dbRun(`
                INSERT INTO admin_actions (admin_id, action_type, target_user_id, amount, description)
                VALUES (?, 'add', ?, ?, ?)
            `, [req.user.id, userId, amount, reason]);

            await dbRun('COMMIT');

            res.json({ 
                message: 'Коины успешно добавлены',
                actionId: actionResult.id
            });
        } catch (error) {
            await dbRun('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error adding coins:', error);
        res.status(500).json({ message: 'Ошибка добавления коинов' });
    }
});

// Списать коины вручную
router.post('/coins/subtract', [
    body('userId').isInt(),
    body('amount').isInt({ min: 1 }),
    body('reason').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { userId, amount, reason } = req.body;

        // Проверяем баланс пользователя
        const user = await dbGet('SELECT balance FROM users WHERE id = ?', [userId]);
        if (!user || user.balance < amount) {
            return res.status(400).json({ message: 'Недостаточно коинов на балансе' });
        }

        await dbRun('BEGIN TRANSACTION');

        try {
            // Обновляем баланс
            await dbRun('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, userId]);

            // Создаем транзакцию
            await dbRun(`
                INSERT INTO transactions (user_id, amount, type, description, admin_id)
                VALUES (?, ?, 'admin_subtract', ?, ?)
            `, [userId, -amount, reason, req.user.id]);

            // Создаем запись в admin_actions
            const actionResult = await dbRun(`
                INSERT INTO admin_actions (admin_id, action_type, target_user_id, amount, description)
                VALUES (?, 'subtract', ?, ?, ?)
            `, [req.user.id, userId, -amount, reason]);

            await dbRun('COMMIT');

            res.json({ 
                message: 'Коины успешно списаны',
                actionId: actionResult.id
            });
        } catch (error) {
            await dbRun('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error subtracting coins:', error);
        res.status(500).json({ message: 'Ошибка списания коинов' });
    }
});

// Получить историю действий администратора
router.get('/actions', async (req, res) => {
    try {
        const actions = await dbAll(`
            SELECT 
                aa.*,
                u.full_name as employee,
                admin.full_name as admin_name
            FROM admin_actions aa
            JOIN users u ON aa.target_user_id = u.id
            JOIN users admin ON aa.admin_id = admin.id
            WHERE aa.undone = 0
            ORDER BY aa.created_at DESC
            LIMIT 50
        `);

        const formattedActions = actions.map(action => ({
            ...action,
            date: new Date(action.created_at).toLocaleString('ru-RU'),
            type: action.action_type === 'approve' || action.action_type === 'add' ? 'add' : 
                  action.action_type === 'subtract' ? 'subtract' : 
                  action.action_type === 'undo' ? 'undo' : 'reject',
            admin: action.admin_name
        }));

        res.json(formattedActions);
    } catch (error) {
        console.error('Error getting admin actions:', error);
        res.status(500).json({ message: 'Ошибка получения истории действий' });
    }
});

// Отменить действие
router.post('/actions/:id/undo', async (req, res) => {
    try {
        const actionId = req.params.id;
        
        const action = await dbGet('SELECT * FROM admin_actions WHERE id = ? AND can_undo = 1 AND undone = 0', [actionId]);
        
        if (!action) {
            return res.status(404).json({ message: 'Действие не найдено или не может быть отменено' });
        }

        await dbRun('BEGIN TRANSACTION');

        try {
            // Отменяем изменение баланса
            if (action.amount !== 0) {
                await dbRun('UPDATE users SET balance = balance - ? WHERE id = ?', [action.amount, action.target_user_id]);
                
                // Создаем обратную транзакцию
                await dbRun(`
                    INSERT INTO transactions (user_id, amount, type, description, admin_id)
                    VALUES (?, ?, 'admin_add', ?, ?)
                `, [action.target_user_id, -action.amount, `Отмена операции: ${action.description}`, req.user.id]);
            }

            // Помечаем действие как отмененное
            await dbRun('UPDATE admin_actions SET undone = 1 WHERE id = ?', [actionId]);

            // Создаем запись об отмене
            await dbRun(`
                INSERT INTO admin_actions (admin_id, action_type, target_user_id, amount, description, can_undo)
                VALUES (?, 'undo', ?, ?, ?, 0)
            `, [req.user.id, action.target_user_id, -action.amount, `Отмена операции: ${action.description}`]);

            await dbRun('COMMIT');

            res.json({ message: 'Действие успешно отменено' });
        } catch (error) {
            await dbRun('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error undoing action:', error);
        res.status(500).json({ message: 'Ошибка отмены действия' });
    }
});

// Получить историю транзакций сотрудника
router.get('/employees/:id/history', async (req, res) => {
    try {
        const userId = req.params.id;
        
        const history = await dbAll(`
            SELECT 
                t.*,
                admin.full_name as admin_name
            FROM transactions t
            LEFT JOIN users admin ON t.admin_id = admin.id
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC
            LIMIT 50
        `, [userId]);

        const formattedHistory = history.map(record => ({
            ...record,
            date: new Date(record.created_at).toLocaleString('ru-RU'),
            type: record.amount > 0 ? 'add' : 'subtract',
            admin: record.admin_name || 'Система'
        }));

        res.json(formattedHistory);
    } catch (error) {
        console.error('Error getting employee history:', error);
        res.status(500).json({ message: 'Ошибка получения истории сотрудника' });
    }
});

module.exports = router;