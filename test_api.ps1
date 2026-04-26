# Test API Script for GhostGrid Backend (PowerShell)
# Usage: .\test_api.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GhostGrid API Testing Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# API Base URL
$API_URL = "http://127.0.0.1:8000/api"

Write-Host "Testing API endpoints..." -ForegroundColor Yellow
Write-Host ""

# Test 1: GET all boards (List all)
Write-Host "1. Testing GET /boards/ (List all boards)" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Green
Write-Host "URL: $API_URL/boards/" -ForegroundColor Gray
Write-Host ""
try {
    Invoke-WebRequest -Uri "$API_URL/boards/" -Method GET -UseBasicParsing -Verbose
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 2: GET specific board (Get one)
Write-Host "2. Testing GET /boards/{board-id}/ (Get specific board)" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Green
Write-Host "URL: $API_URL/boards/82fe6c17-905a-43f7-b52c-311235a532fc/" -ForegroundColor Gray
Write-Host ""
try {
    Invoke-WebRequest -Uri "$API_URL/boards/82fe6c17-905a-43f7-b52c-311235a532fc/" -Method GET -UseBasicParsing -Verbose
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 3: POST new board (Create new)
Write-Host "3. Testing POST /boards/ (Create new board)" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Green
Write-Host "URL: $API_URL/boards/" -ForegroundColor Gray
Write-Host ""
try {
    $body = @{
        name = "Test Board from API"
        data = @{
            nodes = @()
            edges = @()
        }
    } | ConvertTo-Json -Depth 3
    
    Write-Host "Request Body:" -ForegroundColor Yellow
    Write-Host $body -ForegroundColor Gray
    Write-Host ""
    
    Invoke-WebRequest -Uri "$API_URL/boards/" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -Verbose
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan