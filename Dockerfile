# Build stage
FROM node:18-alpine AS builder

# Принудительная пересборка - изменить эту строку для сброса кэша
ENV CACHE_BUST=2024-01-15-v2

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

# Production stage
FROM node:18-alpine AS production

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm ci --only=production --omit=dev

# Копируем собранный код из builder stage
COPY --from=builder /app/dist ./dist

# Копируем скрипт запуска
COPY start.sh ./

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