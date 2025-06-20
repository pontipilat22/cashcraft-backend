# Windows Firewall Rules for CashCraft Backend
# Run this script as Administrator

Write-Host "Adding Windows Firewall rules for CashCraft..." -ForegroundColor Yellow

# Port 3000 for main backend
Write-Host "Adding rule for port 3000..." -ForegroundColor Green
try {
    New-NetFirewallRule -DisplayName "CashCraft Backend 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction Stop
    Write-Host "[OK] Port 3000 opened successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to open port 3000: $_" -ForegroundColor Red
}

# Port 3001 for test server
Write-Host "Adding rule for port 3001..." -ForegroundColor Green
try {
    New-NetFirewallRule -DisplayName "CashCraft Test Server 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -ErrorAction Stop
    Write-Host "[OK] Port 3001 opened successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to open port 3001: $_" -ForegroundColor Red
}

# Allow Node.js
Write-Host "Adding rule for Node.js..." -ForegroundColor Green
try {
    New-NetFirewallRule -DisplayName "Node.js (CashCraft)" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow -ErrorAction Stop
    Write-Host "[OK] Node.js allowed successfully" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to allow Node.js: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Firewall configuration complete!" -ForegroundColor Green
Write-Host "Please restart your backend server and try connecting from your phone again." -ForegroundColor Yellow

# Show current rules
Write-Host ""
Write-Host "Current CashCraft firewall rules:" -ForegroundColor Cyan
Get-NetFirewallRule -DisplayName "CashCraft*" | Select-Object DisplayName, Enabled, Direction, Action | Format-Table 