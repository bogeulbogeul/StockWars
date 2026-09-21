Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"

$maleFiles = @(
    @{ key="pale"; file="media_1789449323564.png" },
    @{ key="fair"; file="media_1789449332978.png" },
    @{ key="natural"; file="media_1789449351209.png" },
    @{ key="tan"; file="media_1789449365091.png" },
    @{ key="deep"; file="media_1789449387468.png" }
)

# Function to sample skin colors in front-facing head area (roughly x: 10%~20%, y: 20%~40%)
foreach ($item in $maleFiles) {
    $bmp = New-Object System.Drawing.Bitmap((Join-Path $baseDir $item.file))
    $w = $bmp.Width
    $h = $bmp.Height
    
    # Let's find non-white bounding box of column 0
    $colW = [int]($w / 4)
    $minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0
    
    for ($x = 0; $x -lt $colW; $x++) {
        for ($y = 0; $y -lt $h; $y++) {
            $p = $bmp.GetPixel($x, $y)
            $isWhite = ($p.R -gt 240 -and $p.G -gt 240 -and $p.B -gt 240)
            if (-not $isWhite) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    
    # Sample forehead/face center
    $headCenterX = [int](($minX + $maxX) / 2)
    $headCenterY = [int]($minY + ($maxY - $minY) * 0.18)
    
    $pBase = $bmp.GetPixel($headCenterX, $headCenterY)
    
    # Sample shadow (under chin or neck)
    $neckY = [int]($minY + ($maxY - $minY) * 0.35)
    $pShadow = $bmp.GetPixel($headCenterX, $neckY)
    
    Write-Host ("Male {0,-8} bounds: [{1}..{2}, {3}..{4}] HeadCenter Color: R={5}, G={6}, B={7} | Shadow: R={8}, G={9}, B={10}" -f $item.key, $minX, $maxX, $minY, $maxY, $pBase.R, $pBase.G, $pBase.B, $pShadow.R, $pShadow.G, $pShadow.B)
    $bmp.Dispose()
}
