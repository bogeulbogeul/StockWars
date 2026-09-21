$charDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"

$skins = @("pale", "fair", "natural", "tan", "deep")
$dirs = @("front", "right", "back", "left")

foreach ($skin in $skins) {
    foreach ($dir in $dirs) {
        $maleFile = Join-Path $charDir "male_base_${skin}_${dir}.png"
        $femaleFile = Join-Path $charDir "female_base_${skin}_${dir}.png"

        if (Test-Path $maleFile) {
            Copy-Item -Path $maleFile -Destination $femaleFile -Force
            Write-Host "Synced: male_base_${skin}_${dir}.png -> female_base_${skin}_${dir}.png"
        }
    }
}

# Also sync default fallbacks
foreach ($dir in $dirs) {
    $maleDefault = Join-Path $charDir "male_base_${dir}.png"
    $femaleDefault = Join-Path $charDir "female_base_${dir}.png"
    $femaleChar = Join-Path $charDir "female_${dir}.png"

    if (Test-Path $maleDefault) {
        Copy-Item -Path $maleDefault -Destination $femaleDefault -Force
        Copy-Item -Path $maleDefault -Destination $femaleChar -Force
        Write-Host "Synced default: male_base_${dir}.png -> female_base_${dir}.png & female_${dir}.png"
    }
}

Write-Host "All male and female base sprites unified 100% identically!"
