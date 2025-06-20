# Update Exchange Rates
Write-Host "Updating exchange rates..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/exchange-rates/update" -Method Post -TimeoutSec 30
    Write-Host "✅ Exchange rates updated successfully!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Failed to update rates: $_" -ForegroundColor Red
}

# Test after update
Write-Host "`nTesting USD to EUR rate after update:" -ForegroundColor Cyan
try {
    $rate = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/exchange-rates/rate?from=USD&to=EUR" -Method Get
    if ($rate.success -and $rate.data.rate) {
        Write-Host "✅ 1 USD = $($rate.data.rate) EUR" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed to get rate: $_" -ForegroundColor Red
} 