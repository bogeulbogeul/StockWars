Add-Type -AssemblyName System.Drawing
$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"

# Inspect media_1789463644478.png (ponytail)
$bmp = New-Object System.Drawing.Bitmap((Join-Path $srcDir "media_1789463644478.png"))
Write-Host "Ponytail sheet width: $($bmp.Width), height: $($bmp.Height)"
for ($c = 0; $c -lt 4; $c++) {
    $x0 = $c * 256
    $x1 = ($c + 1) * 256 - 1
    $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
    for ($x = $x0; $x -le $x1; $x++) {
        for ($y = 0; $y -lt $bmp.Height; $y++) {
            if ($bmp.GetPixel($x, $y).A -gt 15) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    $offsetMinX = $minX - $x0
    $offsetMaxX = $maxX - $x0
    $w = $maxX - $minX + 1
    $cx = ($offsetMinX + $offsetMaxX) / 2.0
    Write-Host "Col $c : MinX in col=$offsetMinX, MaxX=$offsetMaxX, Width=$w, Center in col=$cx, MinY=$minY, MaxY=$maxY"
}
$bmp.Dispose()

# Inspect media_1789463644394.png (long)
$bmp2 = New-Object System.Drawing.Bitmap((Join-Path $srcDir "media_1789463644394.png"))
Write-Host "`nLong sheet width: $($bmp2.Width), height: $($bmp2.Height)"
for ($c = 0; $c -lt 4; $c++) {
    $x0 = $c * 256
    $x1 = ($c + 1) * 256 - 1
    $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
    for ($x = $x0; $x -le $x1; $x++) {
        for ($y = 0; $y -lt $bmp2.Height; $y++) {
            if ($bmp2.GetPixel($x, $y).A -gt 15) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    $offsetMinX = $minX - $x0
    $offsetMaxX = $maxX - $x0
    $w = $maxX - $minX + 1
    $cx = ($offsetMinX + $offsetMaxX) / 2.0
    Write-Host "Col $c : MinX in col=$offsetMinX, MaxX=$offsetMaxX, Width=$w, Center in col=$cx, MinY=$minY, MaxY=$maxY"
}
$bmp2.Dispose()
