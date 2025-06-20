# Настройка переменных окружения для Backend

## Создание .env файла

1. Создайте файл `.env` в корне папки `/backend`
2. Скопируйте содержимое ниже и настройте под ваши нужды

## Пример .env файла

```env
# База данных PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cashcraft
DB_USER=cashcraft_user
DB_PASSWORD=your_secure_password_here

# JWT токены
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Шифрование данных
ENCRYPTION_KEY=your-32-character-encryption-key

# Сервер
PORT=3000
NODE_ENV=development

# CORS (разрешенные источники)
# Для Expo Go на разных платформах
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19000,http://localhost:19006,http://10.0.2.2:3000

# Bcrypt
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (опционально, для будущих функций)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

## Описание переменных

### База данных
- `DB_HOST` - хост PostgreSQL (обычно localhost)
- `DB_PORT` - порт PostgreSQL (по умолчанию 5432)
- `DB_NAME` - имя базы данных
- `DB_USER` - пользователь базы данных
- `DB_PASSWORD` - пароль пользователя БД

### JWT токены
- `JWT_SECRET` - секретный ключ для подписи access токенов
- `JWT_REFRESH_SECRET` - секретный ключ для refresh токенов
- `JWT_EXPIRES_IN` - время жизни access токена (15m = 15 минут)
- `JWT_REFRESH_EXPIRES_IN` - время жизни refresh токена (7d = 7 дней)

### Шифрование
- `ENCRYPTION_KEY` - ключ для шифрования чувствительных данных (32 символа)

### Сервер
- `PORT` - порт на котором запускается сервер
- `NODE_ENV` - окружение (development/production)

### CORS
- `ALLOWED_ORIGINS` - разрешенные источники для CORS (через запятую)

### Безопасность
- `BCRYPT_ROUNDS` - количество раундов хеширования паролей
- `RATE_LIMIT_WINDOW_MS` - окно времени для rate limiting (в миллисекундах)
- `RATE_LIMIT_MAX_REQUESTS` - максимальное количество запросов в окне

## Генерация безопасных ключей

### Для JWT токенов
```bash
# Генерация JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Генерация JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Для шифрования данных
```bash
# Генерация ENCRYPTION_KEY (32 символа)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Настройка для разных окружений

### Development (локальная разработка)
```env
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19000,http://localhost:19006
```

### Production
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app-domain.com
# Используйте более сложные пароли и ключи
# Включите SSL для базы данных
```

## Важные замечания

1. **Никогда не коммитьте .env файл в git!** Убедитесь, что `.env` добавлен в `.gitignore`

2. **Используйте сильные пароли и ключи** в production окружении

3. **Для разных платформ Expo** могут потребоваться разные CORS настройки:
   - iOS Simulator: `http://localhost:19000`
   - Android Emulator: `http://10.0.2.2:3000`
   - Expo Go: `http://localhost:8081`

4. **База данных должна быть создана** перед запуском сервера:
   ```sql
   CREATE DATABASE cashcraft;
   CREATE USER cashcraft_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE cashcraft TO cashcraft_user;
   ```

## Проверка настроек

После создания .env файла, запустите сервер:
```bash
npm run dev
```

Если все настроено правильно, вы увидите:
```
Server is running on port 3000
Database connection has been established successfully
```

## Устранение проблем

### Ошибка подключения к БД
- Проверьте, что PostgreSQL запущен
- Проверьте правильность DB_HOST, DB_PORT
- Убедитесь, что пользователь и пароль корректны

### Ошибки CORS
- Добавьте нужный origin в ALLOWED_ORIGINS
- Для Android эмулятора используйте IP вашего компьютера вместо localhost

### Ошибки токенов
- Убедитесь, что JWT_SECRET достаточно длинный и сложный
- Проверьте формат JWT_EXPIRES_IN (например: 15m, 1h, 7d) 

## Создание .env файла

1. Создайте файл `.env` в корне папки `/backend`
2. Скопируйте содержимое ниже и настройте под ваши нужды

## Пример .env файла

```env
# База данных PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cashcraft
DB_USER=cashcraft_user
DB_PASSWORD=your_secure_password_here

# JWT токены
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Шифрование данных
ENCRYPTION_KEY=your-32-character-encryption-key

# Сервер
PORT=3000
NODE_ENV=development

# CORS (разрешенные источники)
# Для Expo Go на разных платформах
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19000,http://localhost:19006,http://10.0.2.2:3000

# Bcrypt
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (опционально, для будущих функций)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
```

## Описание переменных

### База данных
- `DB_HOST` - хост PostgreSQL (обычно localhost)
- `DB_PORT` - порт PostgreSQL (по умолчанию 5432)
- `DB_NAME` - имя базы данных
- `DB_USER` - пользователь базы данных
- `DB_PASSWORD` - пароль пользователя БД

### JWT токены
- `JWT_SECRET` - секретный ключ для подписи access токенов
- `JWT_REFRESH_SECRET` - секретный ключ для refresh токенов
- `JWT_EXPIRES_IN` - время жизни access токена (15m = 15 минут)
- `JWT_REFRESH_EXPIRES_IN` - время жизни refresh токена (7d = 7 дней)

### Шифрование
- `ENCRYPTION_KEY` - ключ для шифрования чувствительных данных (32 символа)

### Сервер
- `PORT` - порт на котором запускается сервер
- `NODE_ENV` - окружение (development/production)

### CORS
- `ALLOWED_ORIGINS` - разрешенные источники для CORS (через запятую)

### Безопасность
- `BCRYPT_ROUNDS` - количество раундов хеширования паролей
- `RATE_LIMIT_WINDOW_MS` - окно времени для rate limiting (в миллисекундах)
- `RATE_LIMIT_MAX_REQUESTS` - максимальное количество запросов в окне

## Генерация безопасных ключей

### Для JWT токенов
```bash
# Генерация JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Генерация JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Для шифрования данных
```bash
# Генерация ENCRYPTION_KEY (32 символа)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Настройка для разных окружений

### Development (локальная разработка)
```env
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19000,http://localhost:19006
```

### Production
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-app-domain.com
# Используйте более сложные пароли и ключи
# Включите SSL для базы данных
```

## Важные замечания

1. **Никогда не коммитьте .env файл в git!** Убедитесь, что `.env` добавлен в `.gitignore`

2. **Используйте сильные пароли и ключи** в production окружении

3. **Для разных платформ Expo** могут потребоваться разные CORS настройки:
   - iOS Simulator: `http://localhost:19000`
   - Android Emulator: `http://10.0.2.2:3000`
   - Expo Go: `http://localhost:8081`

4. **База данных должна быть создана** перед запуском сервера:
   ```sql
   CREATE DATABASE cashcraft;
   CREATE USER cashcraft_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE cashcraft TO cashcraft_user;
   ```

## Проверка настроек

После создания .env файла, запустите сервер:
```bash
npm run dev
```

Если все настроено правильно, вы увидите:
```
Server is running on port 3000
Database connection has been established successfully
```

## Устранение проблем

### Ошибка подключения к БД
- Проверьте, что PostgreSQL запущен
- Проверьте правильность DB_HOST, DB_PORT
- Убедитесь, что пользователь и пароль корректны

### Ошибки CORS
- Добавьте нужный origin в ALLOWED_ORIGINS
- Для Android эмулятора используйте IP вашего компьютера вместо localhost

### Ошибки токенов
- Убедитесь, что JWT_SECRET достаточно длинный и сложный
- Проверьте формат JWT_EXPIRES_IN (например: 15m, 1h, 7d) 