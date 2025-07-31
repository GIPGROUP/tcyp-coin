# Настройка DATABASE_URL в Render

## ⚠️ Проблема
Приложение не может подключиться к PostgreSQL, потому что переменная DATABASE_URL не настроена.

## 🔧 Решение

### Шаг 1: Найдите вашу базу данных
1. Зайдите в [Render Dashboard](https://dashboard.render.com/)
2. Найдите сервис с типом "PostgreSQL" (обычно называется `tcyp-coins-db`)
3. Нажмите на него

### Шаг 2: Скопируйте External Database URL
1. В разделе "Connections" найдите "External Database URL"
2. Нажмите кнопку "Copy" рядом с URL
3. URL выглядит примерно так:
   ```
   postgresql://tcyp_admin:пароль@dpg-xxxxx.oregon-postgres.render.com/tcyp_coins
   ```

### Шаг 3: Добавьте переменную в веб-сервис
1. Вернитесь в Dashboard и откройте ваш веб-сервис (tcyp-coins)
2. Перейдите в "Environment" в левом меню
3. Нажмите "Add Environment Variable"
4. Добавьте:
   - Key: `DATABASE_URL`
   - Value: вставьте скопированный URL
5. Нажмите "Save Changes"

### Шаг 4: Передеплойте приложение
1. Нажмите "Manual Deploy" → "Deploy latest commit"
2. Дождитесь завершения

## 🎯 Альтернативное решение

Если DATABASE_URL должен был быть автоматически, проверьте:

1. В разделе "Environment" должна быть переменная:
   ```
   DATABASE_URL = Internal Database URL from tcyp-coins-db
   ```

2. Если её нет, добавьте вручную:
   - Key: `DATABASE_URL`
   - Value: выберите "Internal Database URL" и укажите вашу БД

## ✅ Проверка

После деплоя в логах должно быть:
```
🐘 Используем PostgreSQL
✅ Успешно подключились к PostgreSQL
```

Если вместо этого видите:
```
🗃️ Используем SQLite
```

Значит DATABASE_URL все еще не настроен правильно.