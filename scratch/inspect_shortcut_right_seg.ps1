Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"
$bmp = New-Object System.Drawing.Bitmap((Join-Path $srcDir "media_1789463644510.png"))

# Right Seg (Col 3): X from 774 to 1015
$minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
for ($x = 774; $x -le 1015; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        if ($bmp.GetPixel($x, $y).A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1
Write-Host "Right Seg (Col 3): MinX=$minX, MaxX=$maxX, Width=$cropW, MinY=$minY, MaxY=$maxY, Height=$cropH"

for ($y = $minY; $y -le $maxY; $y += 20) {
    $minPx = 999; $maxPx = -1
    for ($x = $minX; $x -le $maxX; $x++) {
        if ($bmp.GetPixel($x, $y).A -gt 15) {
            if ($x -lt $minPx) { $minPx = $x }
            if ($x -gt $maxPx) { $maxPx = $x }
        }
    }
    Write-Host "  Crop Y=$($y-$minY): MinX=$($minPx-$minX), MaxX=$($maxPx-$minX), Width=$($maxPx-$minPx+1)"
}

# Find ear cutout in Right Seg (Col 3)
# In Right seg, back of hair is on the LEFT (Crop X=0), bangs on the RIGHT (Crop X=241)
# Ear cutout is the gap where ear shows through at around Y=120..200
for ($y = $minY + 120; $y -le $minY + 180; $y += 10) {
    # Check pixels across this row
    $line = ""
    for ($x = $minX; $x -le $maxX; $x += 4) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 15) { $line += "#" } else { $line += "." }
    }
    Write-Host "  Y=$($y-$minY): $line"
}

$bmp.Dispose()
