# Test script for trade creation
$headers = @{
    "Content-Type" = "application/json"
}

# Test data for trade creation
$tradeData = @{
    portfolioId = "test-portfolio-id"
    assetId = "test-asset-id"
    tradeDate = "2024-01-15T09:30:00.000Z"
    side = "BUY"
    quantity = 100
    price = 25000
    fee = 0
    tax = 0
    tradeType = "MARKET"
    source = "MANUAL"
    notes = "Test trade"
} | ConvertTo-Json

Write-Host "Testing trade creation with data:"
Write-Host $tradeData

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/trades" -Method POST -Body $tradeData -Headers $headers
    Write-Host "Success! Status: $($response.StatusCode)"
    Write-Host "Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
