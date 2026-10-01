Write-Host "Testing Black Swan Weather Special Effects..."

$weatherService = Get-Content "web/js/engine/weatherService.js" -Raw
$skyWeatherLayer = Get-Content "web/js/components/sky/SkyWeatherLayer.js" -Raw
$skyWeatherCss = Get-Content "web/css/modules/sky-weather.css" -Raw

if ($weatherService -match "category: 'black_swan'" -and $skyWeatherLayer -match "skyBlackSwanVfx" -and $skyWeatherCss -match "blackSwanSirenPulse") {
    Write-Host "SUCCESS: Black Swan Crisis Special Weather & Visual VFX are properly integrated!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Black Swan test failed" -ForegroundColor Red
}
