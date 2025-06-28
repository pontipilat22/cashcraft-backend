# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (только production)
RUN npm ci --only=production --omit=dev

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Удаляем исходный код TypeScript (оставляем только dist)
RUN rm -rf src

# Удаляем dev dependencies
RUN npm prune --production

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

# Запускаем приложение
CMD ["node", "dist/index.js"] 