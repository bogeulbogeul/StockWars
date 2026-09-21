Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded\media_1789397188108.png"
$bmp = New-Object System.Drawing.Bitmap($srcPath)
Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"

# Let's inspect vertical slices: 4 equal columns of width 256 each
for ($c = 0; $c -lt 4; $c++) {
    $x0 = $c * 256
    $x1 = $x0 + 255
    $minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0;
    for ($x = $x0; $x -le $x1; $x++) {
        for ($y = 0; $y -lt $bmp.Height; $y++) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.R -lt 245 -or $p.G -lt 245 -or $p.B -lt 245) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    Write-Host "Col $c : X=[$minX, $maxX] (rel: $($minX-$x0), $($maxX-$x0)), Y=[$minY, $maxY], Height=$($maxY-$minY+1)"
}
$bmp.Dispose()
