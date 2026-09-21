Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character_base_sheet.png"
$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

$bmp = New-Object System.Drawing.Bitmap($srcPath)
$w = $bmp.Width
$h = $bmp.Height

$cols = 4
$rows = 2
$cellW = [int]($w / $cols) # 256
$cellH = [int]($h / $rows) # 341

$names = @(
    @("male_front", "male_right", "male_back", "male_left"),
    @("female_front", "female_right", "female_back", "female_left")
)

for ($r = 0; $r -lt $rows; $r++) {
    for ($c = 0; $c -lt $cols; $c++) {
        $name = $names[$r][$c]
        $cropBmp = New-Object System.Drawing.Bitmap($cellW, $cellH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        
        for ($x = 0; $x -lt $cellW; $x++) {
            for ($y = 0; $y -lt $cellH; $y++) {
                $srcX = ($c * $cellW) + $x
                $srcY = ($r * $cellH) + $y
                $pixel = $bmp.GetPixel($srcX, $srcY)
                
                # Check white background threshold
                $avg = ($pixel.R + $pixel.G + $pixel.B) / 3.0
                $minVal = [Math]::Min($pixel.R, [Math]::Min($pixel.G, $pixel.B))
                $maxVal = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))
                $isNearWhite = ($minVal -gt 240) -and (($maxVal - $minVal) -lt 15)
                
                if ($isNearWhite) {
                    $cropBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                } elseif ($minVal -gt 220 -and (($maxVal - $minVal) -lt 20)) {
                    # Feathered edge for semi-transparent anti-aliasing
                    $alpha = [int](255 * (240 - $minVal) / 20.0)
                    if ($alpha -lt 0) { $alpha = 0 }
                    if ($alpha -gt 255) { $alpha = 255 }
                    $cropBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
                } else {
                    $cropBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $pixel.R, $pixel.G, $pixel.B))
                }
            }
        }
        
        $outPath = Join-Path $outDir "$name.png"
        $cropBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Saved: $outPath"
        $cropBmp.Dispose()
    }
}

$bmp.Dispose()
Write-Host "Done slicing base character images!"
