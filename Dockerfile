# Build stage
FROM node:18-alpine AS builder

# Принудительная пересборка - изменить эту строку для сброса кэша
ENV CACHE_BUST=2024-01-15-v4-FORCE-REBUILD
ENV BUILD_DATE=20240115-143000

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# ВАЖНО: Устанавливаем ВСЕ зависимости включая devDependencies для сборки TypeScript
RUN npm ci --include=dev

# Проверяем что TypeScript установлен
RUN npm list typescript || echo "TypeScript not found in dependencies"
RUN which tsc || echo "tsc command not found in PATH"
RUN npx tsc --version || echo "tsc not available via npx"

# Копируем исходный код
COPY . .

# Собираем TypeScript используя npx для гарантии
RUN npx tsc

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