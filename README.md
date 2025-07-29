# 🪙 TCYP Coin - Корпоративная валюта

Система внутренней мотивации сотрудников с использованием виртуальной валюты ЦУПкоины.

![TCYP Coin Logo](coin_img.png)

## 📋 Описание

TCYP Coin - это веб-приложение для управления корпоративной системой поощрений. Сотрудники могут зарабатывать виртуальные монеты за различные активности и обменивать их на корпоративные бонусы.

### ✨ Основные возможности

- 💰 **Личный кабинет** - отслеживание баланса и истории транзакций
- 📊 **Общий дашборд** - рейтинги, статистика и каталог наград
- 🎰 **Еженедельная рулетка** - розыгрыш призов среди активных сотрудников
- 👨‍💼 **Админ-панель** - управление заявками и начислениями
- 📱 **Адаптивный дизайн** - работает на всех устройствах

## 🚀 Быстрый старт

### Требования

- Node.js 16+
- npm или yarn

### Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/tcyp-coin.git
cd tcyp-coin/tcyp-coin-app
```

2. Установите зависимости backend:
```bash
cd backend
npm install
```

3. Создайте базу данных:
```bash
npm run init-db
```

4. Запустите backend:
```bash
npm start
```

5. В новом терминале установите зависимости frontend:
```bash
cd ../frontend
npm install
```

6. Запустите frontend:
```bash
npm run dev
```

7. Откройте http://localhost:5173

### Тестовые аккаунты

- **Администратор:** admin@tcyp.ru / password123
- **Сотрудник:** alexandrov@tcyp.ru / password123

## 🏗️ Структура проекта

```
tcyp-coin-app/
├── backend/           # Node.js + Express API
│   ├── database/      # SQLite база данных
│   ├── routes/        # API endpoints
│   └── middleware/    # Авторизация и др.
├── frontend/          # Vue 3 + Vuetify 3
│   ├── src/
│   │   ├── views/     # Страницы приложения
│   │   ├── stores/    # Pinia хранилища
│   │   └── api/       # API клиент
│   └── public/        # Статические файлы
└── README.md
```

## 📦 Технологии

**Backend:**
- Node.js + Express
- SQLite (development) / PostgreSQL (production)
- JWT авторизация
- bcrypt для хеширования паролей

**Frontend:**
- Vue 3 (Composition API)
- Vuetify 3 (Material Design)
- Vue Router
- Pinia (state management)
- Axios

## 🌐 Развертывание

Подробная инструкция по развертыванию находится в файле [DEPLOYMENT_PLAN.md](../DEPLOYMENT_PLAN.md)

### Рекомендуемые платформы:
- **Render.com** - бесплатный план для небольших проектов
- **Railway.app** - $5 кредитов в месяц
- **Vercel + Supabase** - отдельный хостинг для frontend и backend

## 🔒 Безопасность

- Все пароли хешируются с использованием bcrypt
- JWT токены для авторизации
- Защита API endpoints через middleware
- Валидация входных данных

## 📝 API Документация

### Основные endpoints:

**Авторизация:**
- `POST /api/auth/login` - вход в систему
- `GET /api/auth/me` - текущий пользователь

**Пользователи:**
- `GET /api/users/me` - профиль пользователя
- `GET /api/users/me/stats` - статистика
- `GET /api/users/leaderboard` - общий рейтинг

**Заявки:**
- `POST /api/requests` - создать заявку
- `GET /api/requests/my` - мои заявки

**Администратор:**
- `GET /api/admin/requests/pending` - ожидающие заявки
- `POST /api/admin/requests/:id/approve` - одобрить заявку
- `POST /api/admin/coins/add` - начислить монеты

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста:

1. Сделайте Fork проекта
2. Создайте branch для вашей функции (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License.

## 📞 Контакты

По вопросам обращайтесь:
- Email: admin@tcyp.ru
- Telegram: @tcyp_support

---

Сделано с ❤️ для команды ЦУП