# Инструкция по переходу с SQLite на PostgreSQL

## 📋 Что было сделано

1. **Добавлена поддержка PostgreSQL** - приложение теперь может работать как с SQLite (локально), так и с PostgreSQL (на сервере)
2. **Автоматический выбор БД** - приложение само определяет какую БД использовать по переменным окружения
3. **Скрипты миграции** - созданы инструменты для переноса данных

## 🚀 Шаги для перехода на PostgreSQL

### Шаг 1: Локальная миграция данных

1. Сначала экспортируйте текущие данные из SQLite:
   ```bash
   cd backend
   npm run export-data
   ```

2. Установите переменную окружения с URL вашей PostgreSQL БД от Render:
   ```bash
   # Windows
   set DATABASE_URL=postgresql://tcyp_admin:ваш_пароль@dpg-xxx.oregon-postgres.render.com/tcyp_coins

   # Linux/Mac
   export DATABASE_URL=postgresql://tcyp_admin:ваш_пароль@dpg-xxx.oregon-postgres.render.com/tcyp_coins
   ```

   URL можно найти в панели Render: Database → Connection → External Database URL

3. Инициализируйте структуру PostgreSQL:
   ```bash
   npm run init-postgres
   ```

4. Мигрируйте данные:
   ```bash
   npm run migrate-to-postgres
   ```

### Шаг 2: Коммит изменений

```bash
git add .
git commit -m "Переход на PostgreSQL для постоянного хранения данных"
git push origin master
```

### Шаг 3: Настройка на Render

1. Зайдите в панель управления Render
2. Перейдите в настройки вашего веб-сервиса
3. В разделе "Environment" убедитесь, что есть переменная `DATABASE_URL` (она должна быть автоматически добавлена Render)
4. Нажмите "Manual Deploy" → "Deploy latest commit"

### Шаг 4: Инициализация БД на сервере

После деплоя подключитесь к консоли сервера Render и выполните:
```bash
cd backend
npm run init-postgres
```

### Шаг 5: Восстановление данных

Если у вас есть бэкап данных, восстановите их:
```bash
# Создайте файл с бэкапом на сервере
cat > backups/backup_to_restore.json
# Вставьте содержимое бэкапа и нажмите Ctrl+D

# Импортируйте данные
npm run import-backup backups/backup_to_restore.json
```

## ✅ Преимущества PostgreSQL

1. **Данные не теряются** при обновлении сервера
2. **Лучшая производительность** для большого количества пользователей
3. **Надежность** - автоматические бэкапы от Render
4. **Масштабируемость** - можно увеличить ресурсы БД при необходимости

## 🔧 Отладка

**Проверить подключение к PostgreSQL локально:**
```bash
set DATABASE_URL=ваш_url_от_render
node -e "require('./database/db-postgres').pool.query('SELECT NOW()').then(r => console.log('Connected!', r.rows[0]))"
```

**Посмотреть логи на сервере:**
- В панели Render перейдите в Logs
- Ищите сообщения с 🐘 (PostgreSQL) или 🗃️ (SQLite)

## 📝 Важные замечания

1. **Локальная разработка** - по умолчанию будет использоваться SQLite
2. **На сервере** - автоматически используется PostgreSQL
3. **Переменная DATABASE_URL** - ключ для переключения между БД
4. **Бэкапы** - Render автоматически делает бэкапы PostgreSQL БД

## 🆘 Если что-то пошло не так

1. Проверьте логи в Render
2. Убедитесь, что DATABASE_URL правильный
3. Попробуйте переинициализировать БД: `npm run init-postgres`
4. В крайнем случае можно вернуться на SQLite, удалив DATABASE_URL