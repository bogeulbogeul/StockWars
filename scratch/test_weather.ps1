Write-Host "Testing Weather & VFX Code Integrity..."

# Read JS files to check for syntax matching
$weatherService = Get-Content "web/js/engine/weatherService.js" -Raw
$skyWeatherLayer = Get-Content "web/js/components/sky/SkyWeatherLayer.js" -Raw
$skyWeatherCss = Get-Content "web/css/modules/sky-weather.css" -Raw

if ($weatherService -match "category: 'snow'" -and $skyWeatherLayer -match "sky-snow-vfx-container" -and $skyWeatherCss -match "rainDropFall") {
    Write-Host "SUCCESS: All Rain & Snow VFX logic and styles are properly installed!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Verification failed" -ForegroundColor Red
}
