# Windows Firewall Rules for CashCraft Backend
# Run this script as Administrator

Write-Host "Adding Windows Firewall rules for CashCraft..." -ForegroundColor Yellow

try {
    # Port 3000 for main backend
    Write-Host "Adding rule for port 3000..." -ForegroundColor Green
    New-NetFirewallRule -DisplayName "CashCraft Backend 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction Stop
    Write-Host "✓ Port 3000 opened successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to open port 3000: $_" -ForegroundColor Red
}

try {
    # Port 3001 for test server
    Write-Host "Adding rule for port 3001..." -ForegroundColor Green
    New-NetFirewallRule -DisplayName "CashCraft Test Server 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -ErrorAction Stop
    Write-Host "✓ Port 3001 opened successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to open port 3001: $_" -ForegroundColor Red
}

try {
    # Allow Node.js
    Write-Host "Adding rule for Node.js..." -ForegroundColor Green
    New-NetFirewallRule -DisplayName "Node.js (CashCraft)" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow -ErrorAction Stop
    Write-Host "✓ Node.js allowed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to allow Node.js: $_" -ForegroundColor Red
}

Write-Host "`nFirewall configuration complete!" -ForegroundColor Green
Write-Host "Please restart your backend server and try connecting from your phone again." -ForegroundColor Yellow

# Show current rules
Write-Host "`nCurrent CashCraft firewall rules:" -ForegroundColor Cyan
Get-NetFirewallRule -DisplayName "CashCraft*" | Select-Object DisplayName, Enabled, Direction, Action | Format-Table 