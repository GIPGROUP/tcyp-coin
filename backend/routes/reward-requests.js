const express = require('express');
const router = express.Router();
const { authenticateToken: requireAuth, requireAdmin } = require('../middleware/auth');

// Выбираем правильную БД в зависимости от окружения
const isProduction = process.env.NODE_ENV === 'production';
const { dbAll, dbGet, dbRun } = isProduction 
  ? require('../database/db-postgres')
  : require('../database/db');

// Получить все запросы наград (для админа)
router.get('/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const requests = await dbAll(`
      SELECT 
        rr.id,
        rr.user_id,
        rr.reward_id,
        rr.reward_type,
        rr.reward_name,
        rr.reward_price,
        rr.status,
        rr.comment,
        rr.created_at,
        rr.processed_at,
        rr.processed_by,
        u.full_name as user_name,
        u.email as user_email,
        admin.full_name as admin_name
      FROM reward_requests rr
      LEFT JOIN users u ON rr.user_id = u.id
      LEFT JOIN users admin ON rr.processed_by = admin.id
      ORDER BY rr.created_at DESC
    `);
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching reward requests:', error);
    res.status(500).json({ message: 'Ошибка получения запросов наград' });
  }
});

// Получить мои запросы наград
router.get('/my', requireAuth, async (req, res) => {
  try {
    const requests = await dbAll(`
      SELECT 
        rr.*,
        admin.full_name as admin_name
      FROM reward_requests rr
      LEFT JOIN users admin ON rr.processed_by = admin.id
      WHERE rr.user_id = ?
      ORDER BY rr.created_at DESC
    `, [req.user.id]);
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching my reward requests:', error);
    res.status(500).json({ message: 'Ошибка получения запросов наград' });
  }
});

// Создать запрос на награду
router.post('/', requireAuth, async (req, res) => {
  const { reward_id, reward_type, reward_name, reward_price, comment } = req.body;
  
  console.log('[REWARD REQUEST] Получен запрос:', { 
    user_id: req.user.id, 
    reward_id, 
    reward_type, 
    reward_name, 
    reward_price 
  });
  
  if (!reward_id || !reward_type || !reward_name || !reward_price) {
    return res.status(400).json({ message: 'Необходимо указать все данные награды' });
  }
  
  try {
    // Проверяем баланс пользователя
    const user = await dbGet('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    
    if (!user || user.balance < reward_price) {
      return res.status(400).json({ message: 'Недостаточно коинов для получения награды' });
    }
    
    // Создаем запрос
    try {
      if (isProduction) {
        await dbRun(`
          INSERT INTO reward_requests (
            user_id, reward_id, reward_type, reward_name, 
            reward_price, status, comment, created_at
          ) VALUES (?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
        `, [req.user.id, reward_id, reward_type, reward_name, reward_price, comment || '']);
      } else {
        await dbRun(`
          INSERT INTO reward_requests (
            user_id, reward_id, reward_type, reward_name, 
            reward_price, status, comment, created_at
          ) VALUES (?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
        `, [req.user.id, reward_id, reward_type, reward_name, reward_price, comment || '']);
      }
      
      console.log('[REWARD REQUEST] Запрос успешно создан');
      res.status(201).json({ 
        message: 'Запрос на награду успешно отправлен',
        success: true
      });
    } catch (insertError) {
      console.error('[REWARD REQUEST] Ошибка INSERT:', insertError);
      throw insertError;
    }
  } catch (error) {
    console.error('[REWARD REQUEST] Полная ошибка:', error);
    res.status(500).json({ message: 'Ошибка создания запроса награды' });
  }
});

// Одобрить запрос награды (для админа)
router.post('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Начинаем транзакцию
    await dbRun(isProduction ? 'BEGIN' : 'BEGIN TRANSACTION');
    
    try {
      // Получаем информацию о запросе
      const request = await dbGet(`
        SELECT rr.*, u.balance 
        FROM reward_requests rr
        JOIN users u ON rr.user_id = u.id
        WHERE rr.id = ? AND rr.status = 'pending'
      `, [id]);
      
      if (!request) {
        await dbRun('ROLLBACK');
        return res.status(404).json({ message: 'Запрос не найден или уже обработан' });
      }
      
      // Проверяем баланс пользователя
      if (request.balance < request.reward_price) {
        await dbRun('ROLLBACK');
        return res.status(400).json({ message: 'У пользователя недостаточно коинов' });
      }
      
      // Списываем коины
      await dbRun(`
        UPDATE users 
        SET balance = balance - ? 
        WHERE id = ?
      `, [request.reward_price, request.user_id]);
      
      // Создаем транзакцию списания
      if (isProduction) {
        await dbRun(`
          INSERT INTO transactions (
            to_user_id, amount, type, description, created_at
          ) VALUES (?, ?, 'spend', ?, CURRENT_TIMESTAMP)
        `, [request.user_id, -request.reward_price, `Награда: ${request.reward_name}`]);
      } else {
        await dbRun(`
          INSERT INTO transactions (
            user_id, amount, type, description, created_at
          ) VALUES (?, ?, 'spend', ?, CURRENT_TIMESTAMP)
        `, [request.user_id, -request.reward_price, `Награда: ${request.reward_name}`]);
      }
      
      // Обновляем статус запроса
      await dbRun(`
        UPDATE reward_requests 
        SET status = 'approved', 
            processed_at = CURRENT_TIMESTAMP,
            processed_by = ?
        WHERE id = ?
      `, [req.user.id, id]);
      
      // Записываем действие админа
      await dbRun(`
        INSERT INTO admin_actions (
          admin_id, action_type, target_user_id, 
          amount, description, created_at
        ) VALUES (?, 'approve_reward', ?, ?, ?, CURRENT_TIMESTAMP)
      `, [req.user.id, request.user_id, request.reward_price, 
          `Одобрен запрос награды: ${request.reward_name}`]);
      
      await dbRun('COMMIT');
      
      res.json({ message: 'Запрос награды одобрен' });
    } catch (error) {
      await dbRun('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error approving reward request:', error);
    res.status(500).json({ message: 'Ошибка одобрения запроса награды' });
  }
});

// Отклонить запрос награды (для админа)
router.post('/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  try {
    const request = await dbGet(
      'SELECT * FROM reward_requests WHERE id = ? AND status = ?',
      [id, 'pending']
    );
    
    if (!request) {
      return res.status(404).json({ message: 'Запрос не найден или уже обработан' });
    }
    
    // Обновляем статус запроса
    await dbRun(`
      UPDATE reward_requests 
      SET status = 'rejected', 
          processed_at = CURRENT_TIMESTAMP,
          processed_by = ?,
          comment = CASE 
            WHEN comment = '' THEN ?
            ELSE comment || ' | Причина отклонения: ' || ?
          END
      WHERE id = ?
    `, [req.user.id, reason || 'Отклонено администратором', 
        reason || 'Отклонено администратором', id]);
    
    // Записываем действие админа
    await dbRun(`
      INSERT INTO admin_actions (
        admin_id, action_type, target_user_id, 
        description, created_at
      ) VALUES (?, 'reject_reward', ?, ?, CURRENT_TIMESTAMP)
    `, [req.user.id, request.user_id, 
        `Отклонен запрос награды: ${request.reward_name}`]);
    
    res.json({ message: 'Запрос награды отклонен' });
  } catch (error) {
    console.error('Error rejecting reward request:', error);
    res.status(500).json({ message: 'Ошибка отклонения запроса награды' });
  }
});

module.exports = router;