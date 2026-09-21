Add-Type -AssemblyName System.Drawing

function Get-NonTransparentBounds($filePath) {
    $bmp = New-Object System.Drawing.Bitmap($filePath)
    $minX = $bmp.Width
    $minY = $bmp.Height
    $maxX = 0
    $maxY = 0

    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            $pixel = $bmp.GetPixel($x, $y)
            if ($pixel.A -gt 10) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    $bmp.Dispose()
    return @{ MinX = $minX; MinY = $minY; MaxX = $maxX; MaxY = $maxY; Width = ($maxX - $minX + 1); Height = ($maxY - $minY + 1) }
}

$files = @(
    "web\assets\character\base_fair_front.png",
    "web\assets\character\face_default_front.png",
    "web\assets\character\hair_short_front.png",
    "web\assets\character\hair_bob_front.png",
    "web\assets\character\hair_long_front.png",
    "web\assets\character\hair_ponytail_front.png"
)

foreach ($rel in $files) {
    $full = Join-Path "c:\Users\Administrator\Documents\GitHub\StockWars" $rel
    if (Test-Path $full) {
        $b = Get-NonTransparentBounds $full
        Write-Host "$rel -> X: $($b.MinX)..$($b.MaxX) (W=$($b.Width)), Y: $($b.MinY)..$($b.MaxY) (H=$($b.Height))"
    }
}
