Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"

# 1. Base Left Body analysis
$baseLeft = New-Object System.Drawing.Bitmap((Join-Path $baseDir "base_fair_left.png"))
Write-Host "=== Base Fair Left Head Profile ==="
for ($y = 40; $y -le 140; $y += 10) {
    $minX = 999; $maxX = -1
    for ($x = 0; $x -lt $baseLeft.Width; $x++) {
        if ($baseLeft.GetPixel($x, $y).A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
    Write-Host "  Y=$y : MinX=$minX, MaxX=$maxX, Width=$($maxX-$minX+1)"
}
$baseLeft.Dispose()

# 2. Base Right Body analysis
$baseRight = New-Object System.Drawing.Bitmap((Join-Path $baseDir "base_fair_right.png"))
Write-Host "`n=== Base Fair Right Head Profile ==="
for ($y = 40; $y -le 140; $y += 10) {
    $minX = 999; $maxX = -1
    for ($x = 0; $x -lt $baseRight.Width; $x++) {
        if ($baseRight.GetPixel($x, $y).A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
    Write-Host "  Y=$y : MinX=$minX, MaxX=$maxX, Width=$($maxX-$minX+1)"
}
$baseRight.Dispose()

# 3. Shortcut Master Analysis for Seg 1 (Left) & Seg 3 (Right)
$bmp = New-Object System.Drawing.Bitmap((Join-Path $srcDir "media_1789463644510.png"))
Write-Host "`n=== Shortcut Hair Segments (Left & Right) ==="
# Left: X from 262 to 506
$minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
for ($x = 262; $x -le 506; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        if ($bmp.GetPixel($x, $y).A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
Write-Host "Left Seg (Col 1): MinX=$minX, MaxX=$maxX, Width=$($maxX-$minX+1), MinY=$minY, MaxY=$maxY, Height=$($maxY-$minY+1)"

# Find ear cutout in Seg 1
# Ear cutout is the transparent valley between front side-strand and back hair at around Y=150..250
for ($y = $minY; $y -le $maxY; $y += 20) {
    $minPx = 999; $maxPx = -1
    for ($x = $minX; $x -le $maxX; $x++) {
        if ($bmp.GetPixel($x, $y).A -gt 15) {
            if ($x -lt $minPx) { $minPx = $x }
            if ($x -gt $maxPx) { $maxPx = $x }
        }
    }
    Write-Host "  Crop Y=$($y-$minY) (Abs Y=$y): MinX=$($minPx-$minX), MaxX=$($maxPx-$minX), Width=$($maxPx-$minPx+1)"
}

$bmp.Dispose()
