Add-Type -AssemblyName System.Drawing

$files = @(
    "media_1789463644338.png",
    "media_1789463644394.png",
    "media_1789463644478.png",
    "media_1789463644510.png"
)

$dir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"

foreach ($f in $files) {
    $p = Join-Path $dir $f
    $bmp = New-Object System.Drawing.Bitmap($p)
    $w = $bmp.Width
    $h = $bmp.Height
    $tl = $bmp.GetPixel(0, 0)
    
    # Check bounding box of Col 0
    $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
    for ($x = 0; $x -lt [int]($w/4); $x++) {
        for ($y = 0; $y -lt $h; $y++) {
            if ($bmp.GetPixel($x, $y).A -gt 20) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    
    Write-Host "=== $f ==="
    Write-Host "Size: ${w}x${h} | TopLeft Pixel Alpha: $($tl.A), R:$($tl.R), G:$($tl.G), B:$($tl.B)"
    Write-Host "Col 0 Bounds: X=[$minX, $maxX] (W=$($maxX-$minX+1)), Y=[$minY, $maxY] (H=$($maxY-$minY+1))"
    $bmp.Dispose()
}
