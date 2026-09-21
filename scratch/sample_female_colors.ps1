Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"
$femaleFile = "media_1789449863748.png"

$bmp = New-Object System.Drawing.Bitmap((Join-Path $baseDir $femaleFile))
$w = $bmp.Width
$h = $bmp.Height

# Sample female forehead, chest, underwear, background, linework
$colW = [int]($w / 4)
$headCenter = $bmp.GetPixel(128, 160)
$chest = $bmp.GetPixel(128, 270)
$underwearTop = $bmp.GetPixel(128, 325)
$belly = $bmp.GetPixel(128, 370)
$linework = $bmp.GetPixel(55, 300)
$bg = $bmp.GetPixel(10, 10)

Write-Host "HeadCenter: R=$($headCenter.R), G=$($headCenter.G), B=$($headCenter.B)"
Write-Host "Chest: R=$($chest.R), G=$($chest.G), B=$($chest.B)"
Write-Host "UnderwearTop: R=$($underwearTop.R), G=$($underwearTop.G), B=$($underwearTop.B)"
Write-Host "Belly: R=$($belly.R), G=$($belly.G), B=$($belly.B)"
Write-Host "Linework: R=$($linework.R), G=$($linework.G), B=$($linework.B)"
Write-Host "Background: R=$($bg.R), G=$($bg.G), B=$($bg.B)"

$bmp.Dispose()
