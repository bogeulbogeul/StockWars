Add-Type -AssemblyName System.Drawing

$skinMap = @(
    @{ name="pale"; file="media_1789458217096.png"; title="Pale" },
    @{ name="fair"; file="media_1789458217062.png"; title="Fair" },
    @{ name="natural"; file="media_1789458216957.png"; title="Natural" },
    @{ name="tan"; file="media_1789458216786.png"; title="Tan" },
    @{ name="deep"; file="media_1789458216903.png"; title="Deep" }
)

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"
$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"

$targetCanvasW = 240
$targetCanvasH = 340
$targetFeetY = 324
$targetCharH = 282 # Base height of character from head apex to feet

# Column dividing intervals based on zero-pixel valleys
$columnIntervals = @(
    @{ dir="front"; x0=0;   x1=284 },
    @{ dir="left";  x0=285; x1=510 },
    @{ dir="back";  x0=511; x1=790 },
    @{ dir="right"; x0=791; x1=1023 }
)

# 1mm padding margin in 1024x682 master space (~6px)
$pad = 8

foreach ($skin in $skinMap) {
    $srcPath = Join-Path $srcDir $skin.file
    $bmp = New-Object System.Drawing.Bitmap($srcPath)
    $w = $bmp.Width
    $h = $bmp.Height

    Write-Host "========================================"
    Write-Host "Processing $($skin.title) with 1mm margin padding..."

    foreach ($col in $columnIntervals) {
        $dir = $col.dir
        $x0 = $col.x0
        $x1 = [Math]::Min($col.x1, $w - 1)

        # 1. Find exact character non-transparent pixels bounds
        $minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0

        for ($x = $x0; $x -le $x1; $x++) {
            for ($y = 0; $y -lt $h; $y++) {
                $p = $bmp.GetPixel($x, $y)
                if ($p.A -gt 5) {
                    if ($x -lt $minX) { $minX = $x }
                    if ($x -gt $maxX) { $maxX = $x }
                    if ($y -lt $minY) { $minY = $y }
                    if ($y -gt $maxY) { $maxY = $y }
                }
            }
        }

        if ($minX -ge $maxX -or $minY -ge $maxY) {
            Write-Warning "Could not find bounds for $($skin.name) $dir"
            continue
        }

        $charPureH = $maxY - $minY + 1
        $charPureW = $maxX - $minX + 1

        # 2. Add 1mm generous safety padding margin
        $cropX0 = [Math]::Max($x0, $minX - $pad)
        $cropX1 = [Math]::Min($x1, $maxX + $pad)
        $cropY0 = [Math]::Max(0, $minY - $pad)
        $cropY1 = [Math]::Min($h - 1, $maxY + $pad)

        $cropW = $cropX1 - $cropX0 + 1
        $cropH = $cropY1 - $cropY0 + 1

        Write-Host "  Dir [$dir]: PureBounds X=[$minX, $maxX], Y=[$minY, $maxY] (H=$charPureH) -> PaddedCrop X=[$cropX0, $cropX1], Y=[$cropY0, $cropY1] (W=$cropW, H=$cropH)"

        # 3. Extract cropped bitmap preserving 100% of original anti-aliased pixels
        $cropBmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        for ($cy = 0; $cy -lt $cropH; $cy++) {
            for ($cx = 0; $cx -lt $cropW; $cx++) {
                $px = $cropX0 + $cx
                $py = $cropY0 + $cy
                $p = $bmp.GetPixel($px, $py)
                $cropBmp.SetPixel($cx, $cy, $p)
            }
        }

        # 4. Fit onto 240x340 canvas maintaining consistent character scale and baseline
        $scale = $targetCharH / [double]$charPureH
        $destW = [int]([Math]::Round($cropW * $scale))
        $destH = [int]([Math]::Round($cropH * $scale))

        # Position so character center is centered and feet align at targetFeetY
        $scaledPadTop = [int]([Math]::Round(($minY - $cropY0) * $scale))
        $scaledPadBottom = [int]([Math]::Round(($cropY1 - $maxY) * $scale))
        
        $destX = [int](($targetCanvasW - $destW) / 2)
        $destY = [int]($targetFeetY + $scaledPadBottom - $destH)

        $canvas = New-Object System.Drawing.Bitmap($targetCanvasW, $targetCanvasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($canvas)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.Clear([System.Drawing.Color]::Transparent)

        $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
        $srcRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
        $g.DrawImage($cropBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $g.Dispose()
        $cropBmp.Dispose()

        # 5. Save files
        $baseFile = Join-Path $outDir "base_$($skin.name)_$dir.png"
        $canvas.Save($baseFile, [System.Drawing.Imaging.ImageFormat]::Png)

        $maleFile = Join-Path $outDir "male_base_$($skin.name)_$dir.png"
        $femaleFile = Join-Path $outDir "female_base_$($skin.name)_$dir.png"
        $canvas.Save($maleFile, [System.Drawing.Imaging.ImageFormat]::Png)
        $canvas.Save($femaleFile, [System.Drawing.Imaging.ImageFormat]::Png)

        if ($skin.name -eq "fair") {
            $defBase = Join-Path $outDir "base_$dir.png"
            $defMaleBase = Join-Path $outDir "male_base_$dir.png"
            $defMale = Join-Path $outDir "male_$dir.png"
            $defFemaleBase = Join-Path $outDir "female_base_$dir.png"
            $defFemale = Join-Path $outDir "female_$dir.png"

            $canvas.Save($defBase, [System.Drawing.Imaging.ImageFormat]::Png)
            $canvas.Save($defMaleBase, [System.Drawing.Imaging.ImageFormat]::Png)
            $canvas.Save($defMale, [System.Drawing.Imaging.ImageFormat]::Png)
            $canvas.Save($defFemaleBase, [System.Drawing.Imaging.ImageFormat]::Png)
            $canvas.Save($defFemale, [System.Drawing.Imaging.ImageFormat]::Png)
        }

        $canvas.Dispose()
    }
    $bmp.Dispose()
    Write-Host "  -> Done for $($skin.title)"
}

Write-Host "All character sprites re-sliced with 1mm margin padding successfully!"
