-- Создание пользователя и базы данных для CashCraft
-- Выполните этот скрипт под пользователем postgres

-- Удаляем существующие подключения к базе данных (если есть)
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'cashcraft_db' AND pid <> pg_backend_pid();

-- Удаляем базу данных, если существует
DROP DATABASE IF EXISTS cashcraft_db;

-- Удаляем пользователя, если существует
DROP USER IF EXISTS cashcraft_user;

-- Создаем нового пользователя
CREATE USER cashcraft_user WITH PASSWORD 'cashcraft123';

-- Создаем базу данных
CREATE DATABASE cashcraft_db OWNER cashcraft_user;

-- Даем все права пользователю на базу данных
GRANT ALL PRIVILEGES ON DATABASE cashcraft_db TO cashcraft_user;

-- Подключаемся к новой базе данных
\c cashcraft_db

-- Даем права на схему public
GRANT ALL ON SCHEMA public TO cashcraft_user;

-- Сообщение об успешном выполнении
\echo 'База данных cashcraft_db и пользователь cashcraft_user успешно созданы!'
\echo 'Пароль пользователя: cashcraft123'
\echo 'Не забудьте обновить пароль в файле backend/.env' 