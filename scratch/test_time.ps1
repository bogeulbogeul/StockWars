$lat = 37.5665
$lng = 126.9780
$date = Get-Date "2026-10-01 19:34:37"
$startYear = Get-Date "2026-01-01 00:00:00"
$dayOfYear = ($date - $startYear).Days + 1

$declination = 0.409 * [Math]::Sin((2 * [Math]::PI / 365) * ($dayOfYear - 81))
$latRad = $lat * ([Math]::PI / 180)

$cosHourAngle = -[Math]::Tan($latRad) * [Math]::Tan($declination)
$clampedCos = [Math]::Max(-1, [Math]::Min(1, $cosHourAngle))
$hourAngle = [Math]::Acos($clampedCos)

$sunHours = ($hourAngle * 180 / [Math]::PI) / 15
$solarNoon = 12 - ($lng / 15 - 9) # UTC+9

$sunrise = $solarNoon - $sunHours
$sunset = $solarNoon + $sunHours
$currentHour = $date.Hour + $date.Minute / 60 + $date.Second / 3600

$nightStart = $sunset + 0.75

Write-Host "Day of Year: $dayOfYear"
Write-Host "Sunrise: $sunrise (approx $([Math]::Floor($sunrise)):$([Math]::Round(($sunrise % 1) * 60)))"
Write-Host "Sunset: $sunset (approx $([Math]::Floor($sunset)):$([Math]::Round(($sunset % 1) * 60)))"
Write-Host "Night Start: $nightStart (approx $([Math]::Floor($nightStart)):$([Math]::Round(($nightStart % 1) * 60)))"
Write-Host "Current Hour: $currentHour"

if ($currentHour -ge $nightStart) {
    Write-Host "Result Stage: NIGHT"
} else {
    Write-Host "Result Stage: SUNSET or DAY"
}
