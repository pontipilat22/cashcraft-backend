# Скрипт для открытия портов в Windows Firewall
# Запустите PowerShell от имени администратора и выполните этот скрипт

Write-Host "Добавление правил в Windows Firewall..." -ForegroundColor Yellow

# Порт 3000 для основного backend
Write-Host "Добавляем правило для порта 3000..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "CashCraft Backend 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# Порт 3001 для тестового сервера  
Write-Host "Добавляем правило для порта 3001..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "CashCraft Test Server 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow

# Разрешаем Node.js полностью
Write-Host "Добавляем правило для Node.js..." -ForegroundColor Green
New-NetFirewallRule -DisplayName "Node.js" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow

Write-Host "`nПравила успешно добавлены!" -ForegroundColor Green
Write-Host "Теперь попробуйте подключиться с телефона снова." -ForegroundColor Yellow 