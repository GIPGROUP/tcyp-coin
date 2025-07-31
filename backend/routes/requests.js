const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { dbRun, dbAll } = require('../database/db');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Валидация для создания заявки
const requestValidation = [
    body('activity_type').notEmpty().trim(),
    body('link').optional(),
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
            INSERT INTO requests (user_id, activity_type, description, link, expected_coins, comment)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [req.user.id, activity_type, description || '', link || '', expected_coins, comment || '']);

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
            SELECT r.*, u.full_name as admin_name
            FROM requests r
            LEFT JOIN users u ON r.processed_by = u.id
            WHERE r.user_id = ?
            ORDER BY r.created_at DESC
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
        // Социальные сети
        { text: 'Пост в социальных сетях о компании (базовый)', value: 'social_post_basic', coins: 300, category: 'social' },
        { text: 'Пост в соцсетях с отметкой официального аккаунта', value: 'social_post_tag', coins: 350, category: 'social' },
        { text: 'Пост в соцсетях с хештегами компании', value: 'social_post_hashtag', coins: 350, category: 'social' },
        { text: 'Пост в соцсетях с авторским текстом (300+ знаков)', value: 'social_post_author', coins: 350, category: 'social' },
        { text: 'Пост в соцсетях с высоким охватом (100+ просмотров)', value: 'social_post_viral', coins: 500, category: 'social' },
        
        { text: 'История в социальных сетях (базовая)', value: 'social_story_basic', coins: 300, category: 'social' },
        { text: 'История с отметкой официального аккаунта', value: 'social_story_tag', coins: 400, category: 'social' },
        { text: 'История с хештегами компании', value: 'social_story_hashtag', coins: 400, category: 'social' },
        { text: 'История с креативным оформлением', value: 'social_story_creative', coins: 420, category: 'social' },
        { text: 'История с охватом более 50 просмотров', value: 'social_story_reach', coins: 370, category: 'social' },
        
        // Мероприятия и контент
        { text: 'Выступление на отраслевой конференции с упоминанием компании', value: 'conference_speaker', coins: 15000, category: 'events' },
        { text: 'Участие в конференции (присутствие)', value: 'conference_participant', coins: 7500, category: 'events' },
        { text: 'Участие в профильном мероприятии в брендированной одежде', value: 'event_branded', coins: 3000, category: 'events' },
        { text: 'Размещение фото/видео с мероприятия в соцсетях', value: 'event_media', coins: 1500, category: 'events' },
        
        // Экспертный контент
        { text: 'Видеообзор проекта/услуги компании', value: 'video_review', coins: 350, category: 'content' },
        { text: 'Интервью для СМИ с упоминанием компании', value: 'media_interview', coins: 500, category: 'content' },
        { text: 'Привлечение нового клиента по рекомендации', value: 'new_client', coins: 300, category: 'business' },
        { text: 'Организация положительного отзыва от клиента', value: 'client_review', coins: 200, category: 'business' },
        
        // Особые награды
        { text: 'Прохождение испытательного срока', value: 'probation_passed', coins: 700, category: 'milestone' },
        { text: 'Наставничество на испытательном сроке', value: 'mentoring', coins: 1500, category: 'milestone' },
        { text: 'День рождения', value: 'birthday', coins: 1000, category: 'milestone' },
        { text: 'Стаж работы 1 год', value: 'work_1year', coins: 2000, category: 'milestone' },
        { text: 'Стаж работы 2 года', value: 'work_2years', coins: 3000, category: 'milestone' },
        { text: 'Стаж работы 3 года', value: 'work_3years', coins: 5000, category: 'milestone' },
        { text: 'Стаж работы более 3 лет', value: 'work_3plus_years', coins: 10000, category: 'milestone' }
    ];

    res.json(activityTypes);
});

module.exports = router;