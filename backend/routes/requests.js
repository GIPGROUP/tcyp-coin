const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { dbRun, dbAll } = require('../database/db');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Валидация для создания заявки
const requestValidation = [
    body('activity_type').notEmpty().trim(),
    body('link').notEmpty().isURL(),
    body('expected_coins').isInt({ min: 1 })
];

// Создать новую заявку
router.post('/', authenticateToken, requestValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { activity_type, description, link, expected_coins, comment } = req.body;

        const result = await dbRun(`
            INSERT INTO coin_requests (user_id, activity_type, description, link, expected_coins, comment)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [req.user.id, activity_type, description, link, expected_coins, comment]);

        res.status(201).json({
            id: result.id,
            message: 'Заявка успешно создана'
        });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ message: 'Ошибка создания заявки' });
    }
});

// Получить заявки текущего пользователя
router.get('/my', authenticateToken, async (req, res) => {
    try {
        const requests = await dbAll(`
            SELECT cr.*, u.full_name as admin_name
            FROM coin_requests cr
            LEFT JOIN users u ON cr.admin_id = u.id
            WHERE cr.user_id = ?
            ORDER BY cr.created_at DESC
        `, [req.user.id]);

        res.json(requests);
    } catch (error) {
        console.error('Error getting requests:', error);
        res.status(500).json({ message: 'Ошибка получения заявок' });
    }
});

// Получить типы активностей с рекомендуемыми суммами
router.get('/activity-types', authenticateToken, async (req, res) => {
    const activityTypes = [
        { text: 'Пост в социальных сетях о компании', value: 'social_post', coins: 450 },
        { text: 'История в социальных сетях (24 часа)', value: 'social_story', coins: 520 },
        { text: 'Выступление на отраслевой конференции', value: 'conference_speaker', coins: 15000 },
        { text: 'Участие в конференции (рядом)', value: 'conference_participant', coins: 7500 },
        { text: 'Участие в профильном мероприятии в брендированной одежде', value: 'event_branded', coins: 3000 },
        { text: 'Размещение фото/видео с мероприятия в соцсетях', value: 'event_media', coins: 1500 },
        { text: 'Видеообзор проекта/услуги компании', value: 'video_review', coins: 350 },
        { text: 'Интервью для СМИ с упоминанием компании', value: 'media_interview', coins: 500 },
        { text: 'Привлечение нового клиента по рекомендации', value: 'new_client', coins: 300 },
        { text: 'Организация положительного отзыва от клиента', value: 'client_review', coins: 200 }
    ];

    res.json(activityTypes);
});

module.exports = router;