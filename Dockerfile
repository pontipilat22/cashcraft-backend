# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Удаляем исходный код TypeScript (оставляем только dist)
RUN rm -rf src

# Удаляем dev dependencies после сборки
RUN npm prune --production

# Делаем скрипт запуска исполняемым
RUN chmod +x start.sh

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Меняем владельца файлов
RUN chown -R nodejs:nodejs /app
USER nodejs

# Открываем порт
EXPOSE 3000

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=3000

# Graceful shutdown
STOPSIGNAL SIGTERM

# Запускаем приложение через скрипт
CMD ["./start.sh"] 