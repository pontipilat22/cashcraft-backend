# Инструкции по развертыванию Backend

## 🐳 Docker развертывание

### Вариант 1: Простая сборка (Dockerfile)

```bash
# Сборка образа
docker build -t cashcraft-backend .

# Запуск контейнера
docker run -d \
  --name cashcraft-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=your_database_url \
  -e JWT_SECRET=your_jwt_secret \
  cashcraft-backend
```

### Вариант 2: Оптимизированная сборка (Dockerfile.multi-stage)

```bash
# Сборка образа с многоэтапной сборкой
docker build -f Dockerfile.multi-stage -t cashcraft-backend .

# Запуск контейнера
docker run -d \
  --name cashcraft-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=your_database_url \
  -e JWT_SECRET=your_jwt_secret \
  cashcraft-backend
```

### 2. Использование docker-compose

```bash
# Запуск (использует многоэтапную сборку)
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

## 🔧 Переменные окружения

Создайте файл `.env` в корне проекта:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🚀 Production развертывание

### 1. Подготовка

```bash
# Установка зависимостей
npm ci

# Сборка TypeScript
npm run build

# Очистка dev dependencies
npm prune --production
```

### 2. Запуск

```bash
# Запуск в production
npm run start:prod
```

## 📊 Мониторинг

### Health Check

```bash
# Проверка состояния сервера
curl http://localhost:3000/health

# Ответ: {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Ping Test

```bash
# Простой тест доступности
curl http://localhost:3000/ping

# Ответ: pong
```

## 🛑 Graceful Shutdown

Сервер корректно обрабатывает сигналы завершения:

- `SIGTERM` - стандартное завершение контейнера
- `SIGINT` - Ctrl+C
- `SIGUSR2` - перезапуск nodemon

### Логи при завершении:

```
🛑 Received SIGTERM. Starting graceful shutdown...
📡 HTTP server closed
🗄️ Database connection closed
✅ Graceful shutdown completed
```

## 🔍 Troubleshooting

### Проблема: tsc: not found

**Решение**: Используйте правильный Dockerfile или многоэтапную сборку

```bash
# Для Railway/Production
docker build -f Dockerfile.multi-stage -t cashcraft-backend .

# Или простой вариант
docker build -t cashcraft-backend .
```

### Проблема: npm warn config production

**Решение**: Используйте `--omit=dev` вместо `--production`

```bash
npm ci --only=production --omit=dev
```

### Проблема: npm error signal SIGTERM

**Решение**: Это нормальное завершение. Graceful shutdown уже настроен.

### Проблема: Порт занят

**Решение**: Измените порт в переменных окружения

```bash
export PORT=3001
```

## 📈 Производительность

### Рекомендации:

1. **Мониторинг**: Используйте health check endpoints
2. **Логирование**: Настройте централизованное логирование
3. **База данных**: Используйте connection pooling
4. **Кэширование**: Настройте Redis для кэширования
5. **SSL**: Используйте reverse proxy с SSL

### Мониторинг ресурсов:

```bash
# Использование памяти
docker stats cashcraft-backend

# Логи в реальном времени
docker logs -f cashcraft-backend
```

## 🏗️ Различия между Dockerfile

### Dockerfile (простой)
- ✅ Простая сборка
- ⚠️ Больший размер образа
- ✅ Быстрая сборка

### Dockerfile.multi-stage (оптимизированный)
- ✅ Меньший размер образа
- ✅ Только production зависимости
- ⚠️ Более сложная сборка
- ✅ Рекомендуется для production 