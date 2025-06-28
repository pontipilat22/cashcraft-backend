#!/bin/sh

# Скрипт запуска с правильной обработкой сигналов

# Функция для graceful shutdown
graceful_shutdown() {
    echo "🛑 Received shutdown signal. Starting graceful shutdown..."
    
    # Останавливаем Node.js процесс
    if [ -n "$NODE_PID" ]; then
        kill -TERM "$NODE_PID"
        
        # Ждем завершения процесса
        wait "$NODE_PID"
    fi
    
    echo "✅ Graceful shutdown completed"
    exit 0
}

# Обработка сигналов
trap graceful_shutdown SIGTERM SIGINT

# Запускаем приложение в фоне
echo "🚀 Starting CashCraft Backend..."
node dist/index.js &
NODE_PID=$!

# Ждем завершения процесса
wait "$NODE_PID" 