$orig = [System.IO.File]::ReadAllText("scratch/original_SmartphoneUI.js", [System.Text.Encoding]::UTF8)
$lines = $orig -split "`r?`n"

Write-Host "Total lines: $($lines.Length)"
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "^\s*//\s*={5,}") {
        Write-Host "Line $($i+1): $($lines[$i])"
    } elseif ($lines[$i] -match "^\s*(updateHomeTab|renderMarketTab|renderNewsTab|renderProfileTab|renderSectorDonutChart|renderBubble|initBubble|openNewsDetail|openTradeModal)") {
        Write-Host "Line $($i+1): $($lines[$i])"
    }
}
