$lines = [System.IO.File]::ReadAllLines("web/js/main.js", [System.Text.Encoding]::UTF8)

# Replace lines 60 to 68 (0-indexed 59 to 67)
$newLines = @(
    "            onWeatherClick: () => {",
    "                const w = weatherService.cycleWeather();",
    "                toastManager.show(`🌦️ 날씨 시뮬레이션 전환: ${w.icon} ${w.text} (${w.temp}°C)`);",
    "            },"
)

$result = $lines[0..58] + $newLines + $lines[69..($lines.Length-1)]
[System.IO.File]::WriteAllLines("web/js/main.js", $result, [System.Text.Encoding]::UTF8)
Write-Host "SUCCESS: main.js line replacement complete!" -ForegroundColor Green
