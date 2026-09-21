Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"
$file = "media_1789456231270.png"
$srcPath = Join-Path $baseDir $file

$bmp = New-Object System.Drawing.Bitmap($srcPath)
$w = $bmp.Width
$h = $bmp.Height

$rowH = $h / 5.0
$colW = $w / 4.0

$skinNames = @("pale", "fair", "natural", "tan", "deep")
$dirNames = @("front", "right", "back", "left")

for ($r = 0; $r -lt 5; $r++) {
    $y0 = [int]($r * $rowH)
    $y1 = [int](($r + 1) * $rowH - 1)
    
    for ($c = 0; $c -lt 4; $c++) {
        $x0 = [int]($c * $colW)
        $x1 = [int](($c + 1) * $colW - 1)
        
        $minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0
        $pixelCount = 0
        
        for ($x = $x0; $x -le $x1; $x++) {
            for ($y = $y0; $y -le $y1; $y++) {
                $p = $bmp.GetPixel($x, $y)
                if ($p.A -gt 20) {
                    $pixelCount++
                    if ($x -lt $minX) { $minX = $x }
                    if ($x -gt $maxX) { $maxX = $x }
                    if ($y -lt $minY) { $minY = $y }
                    if ($y -gt $maxY) { $maxY = $y }
                }
            }
        }
        
        $charW = if ($minX -le $maxX) { $maxX - $minX + 1 } else { 0 }
        $charH = if ($minY -le $maxY) { $maxY - $minY + 1 } else { 0 }
        
        Write-Host ("Cell [{0},{1}] ({2,-7} {3,-5}): X=[{4}..{5}] (W={6}), Y=[{7}..{8}] (H={9}), Pixels={10}" -f $r, $c, $skinNames[$r], $dirNames[$c], $minX, $maxX, $charW, $minY, $maxY, $charH, $pixelCount)
    }
}

$bmp.Dispose()
