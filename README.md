# CashCraft Backend API

Backend API для приложения CashCraft - персонального финансового менеджера.

## Технологии

- **Node.js** + **TypeScript**
- **Express.js** - веб-фреймворк
- **PostgreSQL** - база данных
- **Sequelize** - ORM
- **JWT** - авторизация
- **bcrypt** - хеширование паролей

## Установка

1. Клонируйте репозиторий и перейдите в папку backend:
```bash
cd backend
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` на основе примера:
```bash
cp config.example.json .env
```

4. Настройте переменные окружения в `.env`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=cashcraft_user
DB_PASSWORD=your_password_here
DB_NAME=cashcraft_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:19006
```

5. Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE cashcraft_db;
CREATE USER cashcraft_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE cashcraft_db TO cashcraft_user;
```

## Запуск

### Режим разработки
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Авторизация

- `POST /api/v1/auth/register` - Регистрация нового пользователя
- `POST /api/v1/auth/login` - Вход в систему
- `POST /api/v1/auth/guest` - Гостевой вход
- `POST /api/v1/auth/refresh` - Обновление токена
- `POST /api/v1/auth/logout` - Выход из системы

### Счета

- `GET /api/v1/accounts` - Получить все счета
- `POST /api/v1/accounts` - Создать новый счет
- `PUT /api/v1/accounts/:id` - Обновить счет
- `DELETE /api/v1/accounts/:id` - Удалить счет
- `GET /api/v1/accounts/:id/stats` - Статистика по счету

### Транзакции

- `GET /api/v1/transactions` - Получить транзакции (с фильтрацией)
- `POST /api/v1/transactions` - Создать транзакцию
- `PUT /api/v1/transactions/:id` - Обновить транзакцию
- `DELETE /api/v1/transactions/:id` - Удалить транзакцию
- `GET /api/v1/transactions/stats` - Статистика транзакций

### Категории

- `GET /api/v1/categories` - Получить все категории
- `POST /api/v1/categories` - Создать категорию
- `PUT /api/v1/categories/:id` - Обновить категорию
- `DELETE /api/v1/categories/:id` - Удалить категорию
- `POST /api/v1/categories/reset` - Сбросить к стандартным категориям

### Долги

- `GET /api/v1/debts` - Получить все долги
- `GET /api/v1/debts/stats` - Статистика по долгам
- `POST /api/v1/debts` - Создать долг
- `PUT /api/v1/debts/:id` - Обновить долг
- `POST /api/v1/debts/:id/pay` - Погасить долг (полностью или частично)
- `DELETE /api/v1/debts/:id` - Удалить долг

## Структура проекта

```
backend/
├── src/
│   ├── config/         # Конфигурация приложения и БД
│   ├── controllers/    # Контроллеры (бизнес-логика)
│   ├── middleware/     # Middleware (auth, validation)
│   ├── models/         # Модели Sequelize
│   ├── routes/         # Express маршруты
│   ├── services/       # Сервисы (email, sms и т.д.)
│   ├── types/          # TypeScript типы
│   ├── utils/          # Утилиты
│   └── index.ts        # Точка входа
├── dist/               # Скомпилированный код
├── package.json
├── tsconfig.json
└── README.md
```

## Модели данных

### User
- Пользователи системы
- Поддержка обычных и гостевых аккаунтов
- Premium подписка

### Account
- Счета пользователя (наличные, карты, кредиты и т.д.)
- Поддержка разных валют
- Кредитные счета с расчетом платежей

### Transaction
- Операции (доходы, расходы, переводы)
- Связь со счетами и категориями
- Автоматическое обновление балансов

### Category
- Категории доходов и расходов
- Системные и пользовательские категории

### Debt
- Долги (мне должны / я должен)
- Отслеживание сроков возврата

## Безопасность

- Пароли хешируются с помощью bcrypt
- JWT токены для авторизации
- Валидация всех входных данных
- CORS настройки
- Helmet для защиты от распространенных уязвимостей

## Разработка

### Добавление новой модели

1. Создайте файл модели в `src/models/`
2. Добавьте инициализацию в `src/models/index.ts`
3. Создайте контроллер в `src/controllers/`
4. Создайте роуты в `src/routes/`
5. Подключите роуты в `src/routes/index.ts`

### Миграции

В production рекомендуется использовать миграции Sequelize вместо `sync`:

```bash
npm run db:migrate
```

## Лицензия

MIT 

Backend API для приложения CashCraft - персонального финансового менеджера.

## Технологии

- **Node.js** + **TypeScript**
- **Express.js** - веб-фреймворк
- **PostgreSQL** - база данных
- **Sequelize** - ORM
- **JWT** - авторизация
- **bcrypt** - хеширование паролей

## Установка

1. Клонируйте репозиторий и перейдите в папку backend:
```bash
cd backend
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env` на основе примера:
```bash
cp config.example.json .env
```

4. Настройте переменные окружения в `.env`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=cashcraft_user
DB_PASSWORD=your_password_here
DB_NAME=cashcraft_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:19006
```

5. Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE cashcraft_db;
CREATE USER cashcraft_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE cashcraft_db TO cashcraft_user;
```

## Запуск

### Режим разработки
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Авторизация

- `POST /api/v1/auth/register` - Регистрация нового пользователя
- `POST /api/v1/auth/login` - Вход в систему
- `POST /api/v1/auth/guest` - Гостевой вход
- `POST /api/v1/auth/refresh` - Обновление токена
- `POST /api/v1/auth/logout` - Выход из системы

### Счета

- `GET /api/v1/accounts` - Получить все счета
- `POST /api/v1/accounts` - Создать новый счет
- `PUT /api/v1/accounts/:id` - Обновить счет
- `DELETE /api/v1/accounts/:id` - Удалить счет
- `GET /api/v1/accounts/:id/stats` - Статистика по счету

### Транзакции

- `GET /api/v1/transactions` - Получить транзакции (с фильтрацией)
- `POST /api/v1/transactions` - Создать транзакцию
- `PUT /api/v1/transactions/:id` - Обновить транзакцию
- `DELETE /api/v1/transactions/:id` - Удалить транзакцию
- `GET /api/v1/transactions/stats` - Статистика транзакций

### Категории

- `GET /api/v1/categories` - Получить все категории
- `POST /api/v1/categories` - Создать категорию
- `PUT /api/v1/categories/:id` - Обновить категорию
- `DELETE /api/v1/categories/:id` - Удалить категорию
- `POST /api/v1/categories/reset` - Сбросить к стандартным категориям

### Долги

- `GET /api/v1/debts` - Получить все долги
- `GET /api/v1/debts/stats` - Статистика по долгам
- `POST /api/v1/debts` - Создать долг
- `PUT /api/v1/debts/:id` - Обновить долг
- `POST /api/v1/debts/:id/pay` - Погасить долг (полностью или частично)
- `DELETE /api/v1/debts/:id` - Удалить долг

## Структура проекта

```
backend/
├── src/
│   ├── config/         # Конфигурация приложения и БД
│   ├── controllers/    # Контроллеры (бизнес-логика)
│   ├── middleware/     # Middleware (auth, validation)
│   ├── models/         # Модели Sequelize
│   ├── routes/         # Express маршруты
│   ├── services/       # Сервисы (email, sms и т.д.)
│   ├── types/          # TypeScript типы
│   ├── utils/          # Утилиты
│   └── index.ts        # Точка входа
├── dist/               # Скомпилированный код
├── package.json
├── tsconfig.json
└── README.md
```

## Модели данных

### User
- Пользователи системы
- Поддержка обычных и гостевых аккаунтов
- Premium подписка

### Account
- Счета пользователя (наличные, карты, кредиты и т.д.)
- Поддержка разных валют
- Кредитные счета с расчетом платежей

### Transaction
- Операции (доходы, расходы, переводы)
- Связь со счетами и категориями
- Автоматическое обновление балансов

### Category
- Категории доходов и расходов
- Системные и пользовательские категории

### Debt
- Долги (мне должны / я должен)
- Отслеживание сроков возврата

## Безопасность

- Пароли хешируются с помощью bcrypt
- JWT токены для авторизации
- Валидация всех входных данных
- CORS настройки
- Helmet для защиты от распространенных уязвимостей

## Разработка

### Добавление новой модели

1. Создайте файл модели в `src/models/`
2. Добавьте инициализацию в `src/models/index.ts`
3. Создайте контроллер в `src/controllers/`
4. Создайте роуты в `src/routes/`
5. Подключите роуты в `src/routes/index.ts`

### Миграции

В production рекомендуется использовать миграции Sequelize вместо `sync`:

```bash
npm run db:migrate
```

## Лицензия

MIT 