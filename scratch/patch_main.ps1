$path = "web/js/main.js"
$content = Get-Content $path -Raw

$oldCode = @"
            onWeatherClick: () => {
                const isDev = new URLSearchParams(window.location.search).get('dev') === 'true';
                if (isDev) {
                    const w = weatherService.cycleWeather();
                    toastManager.show(`🛠️ [DEV] 날씨 시뮬레이션: ${w.icon} ${w.text} ${w.temp}°C (태양/구름 연동)`);
                } else {
                    const w = weatherService.currentWeather;
                    toastManager.show(`📍 실시간 로컬 날씨 (${w.city}): ${w.icon} ${w.text} ${w.temp}°C (습도: ${w.humidity}%)`);
                }
            },
"@

$newCode = @"
            onWeatherClick: () => {
                const w = weatherService.cycleWeather();
                toastManager.show(`🌦️ 날씨 시뮬레이션 전환: ${w.icon} ${w.text} (${w.temp}°C)`);
            },
"@

$normalizedContent = $content -replace "`r`n", "`n"
$normalizedOld = $oldCode -replace "`r`n", "`n"
$normalizedNew = $newCode -replace "`r`n", "`n"

if ($normalizedContent.Contains($normalizedOld)) {
    $updated = $normalizedContent.Replace($normalizedOld, $normalizedNew)
    Set-Content -Path $path -Value $updated -NoNewline
    Write-Host "SUCCESS: main.js updated successfully!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Match not found" -ForegroundColor Red
}
