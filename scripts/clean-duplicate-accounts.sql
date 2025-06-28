-- Скрипт для очистки дублированных счетов
-- Выполняется только один раз для исправления проблемы с UUID

-- 1. Находим дублированные счета по имени и пользователю
WITH duplicate_accounts AS (
  SELECT 
    user_id,
    name,
    COUNT(*) as count,
    MIN(created_at) as oldest_created_at
  FROM accounts 
  GROUP BY user_id, name
  HAVING COUNT(*) > 1
)

-- 2. Удаляем дублированные счета, оставляя только самый старый
DELETE FROM accounts 
WHERE (user_id, name) IN (
  SELECT user_id, name 
  FROM duplicate_accounts
)
AND created_at > (
  SELECT oldest_created_at 
  FROM duplicate_accounts da 
  WHERE da.user_id = accounts.user_id AND da.name = accounts.name
);

-- 3. Проверяем результат
SELECT 
  user_id,
  name,
  COUNT(*) as remaining_count
FROM accounts 
GROUP BY user_id, name
HAVING COUNT(*) > 1;

-- Если результат пустой, значит дубликаты удалены успешно 