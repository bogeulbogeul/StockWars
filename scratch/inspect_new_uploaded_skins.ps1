Add-Type -AssemblyName System.Drawing

$dir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"
$files = @(
    @{ name="pale"; file="media_1789458217096.png" },
    @{ name="fair"; file="media_1789458217062.png" },
    @{ name="natural"; file="media_1789458216957.png" },
    @{ name="tan"; file="media_1789458216786.png" },
    @{ name="deep"; file="media_1789458216903.png" }
)

foreach ($item in $files) {
    $p = Join-Path $dir $item.file
    $bmp = New-Object System.Drawing.Bitmap($p)
    $w = $bmp.Width
    $h = $bmp.Height
    
    # Check top-left pixel
    $tl = $bmp.GetPixel(0, 0)
    Write-Host "=== $($item.name) ($($item.file)) ==="
    Write-Host "Size: ${w}x${h} | TopLeft Pixel Alpha: $($tl.A), R:$($tl.R), G:$($tl.G), B:$($tl.B)"
    
    # Find bounding box of whole image non-alpha pixels
    $minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0
    for ($x = 0; $x -lt $w; $x++) {
        for ($y = 0; $y -lt $h; $y++) {
            $pAlpha = $bmp.GetPixel($x, $y).A
            if ($pAlpha -gt 10) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    Write-Host "Overall Bounds: X=[$minX, $maxX], Y=[$minY, $maxY], Width=$($maxX - $minX + 1), Height=$($maxY - $minY + 1)"
    
    # Check 4 columns
    $colW = [int]($w / 4) # 256
    for ($c = 0; $c -lt 4; $c++) {
        $cMinX = 9999; $cMaxX = 0; $cMinY = 9999; $cMaxY = 0
        $x0 = $c * $colW
        $x1 = ($c + 1) * $colW - 1
        for ($x = $x0; $x -le $x1; $x++) {
            for ($y = 0; $y -lt $h; $y++) {
                if ($bmp.GetPixel($x, $y).A -gt 10) {
                    if ($x -lt $cMinX) { $cMinX = $x }
                    if ($x -gt $cMaxX) { $cMaxX = $x }
                    if ($y -lt $cMinY) { $cMinY = $y }
                    if ($y -gt $cMaxY) { $cMaxY = $y }
                }
            }
        }
        Write-Host "  Col $c (X $x0..$x1): Bounds X=[$cMinX, $cMaxX] (W=$($cMaxX - $cMinX + 1)), Y=[$cMinY, $cMaxY] (H=$($cMaxY - $cMinY + 1))"
    }
    $bmp.Dispose()
}
