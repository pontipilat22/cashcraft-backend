-- Сброс и создание пользователя с паролем из .env файла
-- Выполните этот скрипт под пользователем postgres

-- Закрываем все подключения к базе данных
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'cashcraft_db' AND pid <> pg_backend_pid();

-- Удаляем базу данных если существует
DROP DATABASE IF EXISTS cashcraft_db;

-- Удаляем пользователя если существует
DROP USER IF EXISTS cashcraft_user;

-- Создаем пользователя с паролем из .env
CREATE USER cashcraft_user WITH PASSWORD 'Zarutskiy22012011!';

-- Создаем базу данных
CREATE DATABASE cashcraft_db OWNER cashcraft_user;

-- Даем все права
GRANT ALL PRIVILEGES ON DATABASE cashcraft_db TO cashcraft_user;

-- Подключаемся к базе
\c cashcraft_db

-- Даем права на схему
GRANT ALL ON SCHEMA public TO cashcraft_user;

\echo '✅ База данных и пользователь успешно созданы!'
\echo '📝 Пароль: Zarutskiy22012011!' 