Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character_base_sheet.png"
$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

$bmp = New-Object System.Drawing.Bitmap($srcPath)
$w = $bmp.Width # 1024
$h = $bmp.Height # 682

# Column boundaries: 0..255, 256..511, 512..767, 768..1023
# Row boundaries:
# Male: y = 5 to 335
# Female: y = 345 to 675

$cols = @(
    @{ name="front"; x0=0; x1=255 },
    @{ name="right"; x0=256; x1=511 },
    @{ name="back"; x0=512; x1=767 },
    @{ name="left"; x0=768; x1=1023 }
)

$genders = @(
    @{ name="male"; y0=5; y1=336 },
    @{ name="female"; y0=346; y1=677 }
)

foreach ($g in $genders) {
    foreach ($c in $cols) {
        $cellW = $c.x1 - $c.x0 + 1
        $cellH = $g.y1 - $g.y0 + 1
        $cropBmp = New-Object System.Drawing.Bitmap($cellW, $cellH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        
        for ($x = 0; $x -lt $cellW; $x++) {
            for ($y = 0; $y -lt $cellH; $y++) {
                $srcX = $c.x0 + $x
                $srcY = $g.y0 + $y
                $pixel = $bmp.GetPixel($srcX, $srcY)
                
                $minVal = [Math]::Min($pixel.R, [Math]::Min($pixel.G, $pixel.B))
                $maxVal = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))
                $isNearWhite = ($minVal -gt 240) -and (($maxVal - $minVal) -lt 15)
                
                if ($isNearWhite) {
                    $cropBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                } elseif ($minVal -gt 215 -and (($maxVal - $minVal) -lt 25)) {
                    $alpha = [int](255 * (240 - $minVal) / 25.0)
                    if ($alpha -lt 0) { $alpha = 0 }
                    if ($alpha -gt 255) { $alpha = 255 }
                    $cropBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
                } else {
                    $cropBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $pixel.R, $pixel.G, $pixel.B))
                }
            }
        }
        
        $fileName = "$($g.name)_$($c.name).png"
        $outPath = Join-Path $outDir $fileName
        $cropBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Saved: $fileName ($cellW x $cellH)"
        $cropBmp.Dispose()
    }
}

$bmp.Dispose()
Write-Host "Clean slicing complete!"
