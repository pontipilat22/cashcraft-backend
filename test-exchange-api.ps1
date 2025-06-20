# Test Exchange Rate API
Write-Host "Testing CashCraft Exchange Rate API..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Health check
Write-Host "1. Testing Health Endpoint:" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host $health | ConvertTo-Json
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: Exchange rate without auth
Write-Host "2. Testing Exchange Rate (USD to EUR):" -ForegroundColor Cyan
try {
    $rate = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/exchange-rates/rate?from=USD&to=EUR" -Method Get -TimeoutSec 5
    Write-Host "✅ Exchange rate received" -ForegroundColor Green
    Write-Host ($rate | ConvertTo-Json -Depth 3)
    if ($rate.success -and $rate.data.rate) {
        Write-Host "`n💱 1 USD = $($rate.data.rate) EUR" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Exchange rate request failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Test from mobile app's IP
Write-Host "3. Testing from external IP (192.168.1.8):" -ForegroundColor Cyan
try {
    $rate2 = Invoke-RestMethod -Uri "http://192.168.1.8:3000/api/v1/exchange-rates/rate?from=RUB&to=USD" -Method Get -TimeoutSec 5
    Write-Host "✅ External IP test passed" -ForegroundColor Green
    Write-Host ($rate2 | ConvertTo-Json -Depth 3)
    if ($rate2.success -and $rate2.data.rate) {
        Write-Host "`n💱 1 RUB = $($rate2.data.rate) USD" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ External IP test failed: $_" -ForegroundColor Red
} 