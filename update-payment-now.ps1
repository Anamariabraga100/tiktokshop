# Script PowerShell para atualizar pagamento manualmente
$transactionId = "d76e42b7-5bd3-46d7-866a-586bd2baaefc"
$url = "https://tiktokshop-orpin.vercel.app/api/manual-update-payment"

$body = @{
    transactionId = $transactionId
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Atualizando pagamento..." -ForegroundColor Yellow
Write-Host "Transaction ID: $transactionId" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -Headers $headers
    
    if ($response.success) {
        if ($response.updated) {
            Write-Host "SUCESSO: Pagamento atualizado!" -ForegroundColor Green
            Write-Host "Status anterior: $($response.oldStatus)" -ForegroundColor Gray
            Write-Host "Status novo: $($response.newStatus)" -ForegroundColor Green
            Write-Host ""
            Write-Host "Pedido:" -ForegroundColor Cyan
            Write-Host "  Numero: $($response.order.order_number)" -ForegroundColor White
            Write-Host "  Status: $($response.order.umbrella_status)" -ForegroundColor White
            Write-Host "  Pago em: $($response.order.umbrella_paid_at)" -ForegroundColor White
        } else {
            Write-Host "INFO: $($response.message)" -ForegroundColor Cyan
            Write-Host "Status atual: $($response.currentStatus)" -ForegroundColor Gray
            Write-Host "Status no gateway: $($response.gatewayStatus)" -ForegroundColor Gray
        }
    } else {
        Write-Host "ERRO: $($response.error)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Resposta completa:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "ERRO ao fazer requisicao:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}
