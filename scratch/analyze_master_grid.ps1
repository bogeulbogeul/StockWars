Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"
$file = "media_1789456231270.png"
$srcPath = Join-Path $baseDir $file

$bmp = New-Object System.Drawing.Bitmap($srcPath)
Write-Host "Image dimensions: $($bmp.Width) x $($bmp.Height)"

# Row heights approx = H / 5, Col widths approx = W / 4
$rowH = [int]($bmp.Height / 5)
$colW = [int]($bmp.Width / 4)

Write-Host "Approx Row H: $rowH, Col W: $colW"

# Let's check skin colors in each row at (col 0 center, row center)
$skinNames = @("pale", "fair", "natural", "tan", "deep")
for ($r = 0; $r -lt 5; $r++) {
    $y0 = $r * $rowH
    $headY = $y0 + [int]($rowH * 0.25)
    $headX = [int]($colW * 0.5)
    $p = $bmp.GetPixel($headX, $headY)
    Write-Host ("Row {0} ({1,-7}) sample at ({2},{3}): R={4}, G={5}, B={6}" -f $r, $skinNames[$r], $headX, $headY, $p.R, $p.G, $p.B)
}

$bmp.Dispose()
