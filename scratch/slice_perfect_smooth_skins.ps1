Add-Type -AssemblyName System.Drawing

function Perfect-HeadContour {
    param(
        [System.Drawing.Bitmap]$bmp,
        [int]$x0,
        [int]$x1,
        [string]$dir # "left" or "right"
    )

    $w = $bmp.Width
    $h = $bmp.Height
    $topY = 28
    $botY = 175 # Head and forehead region

    # 1. Detect outline color
    $outlineR = 0; $outlineG = 0; $outlineB = 0; $outCount = 0
    for ($y = $topY + 5; $y -le $botY - 20; $y += 3) {
        for ($x = $x0; $x -le $x1; $x++) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.A -gt 150 -and $p.R -lt 110 -and $p.G -lt 80) {
                $outlineR += $p.R; $outlineG += $p.G; $outlineB += $p.B; $outCount++
                break
            }
        }
    }
    if ($outCount -eq 0) { $outCount = 1 }
    $avgOutline = [System.Drawing.Color]::FromArgb(255, [int]($outlineR/$outCount), [int]($outlineG/$outCount), [int]($outlineB/$outCount))

    # 2. Extract boundary for head (both left edge and right edge)
    $leftEdges = @{}
    $rightEdges = @{}

    for ($y = $topY; $y -le $botY; $y++) {
        $minX = -1; $maxX = -1
        for ($x = $x0; $x -le $x1; $x++) {
            if ($bmp.GetPixel($x, $y).A -gt 20) { $minX = $x; break }
        }
        for ($x = $x1; $x -ge $x0; $x--) {
            if ($bmp.GetPixel($x, $y).A -gt 20) { $maxX = $x; break }
        }
        if ($minX -ge 0 -and $maxX -ge $minX) {
            $leftEdges[$y] = $minX
            $rightEdges[$y] = $maxX
        }
    }

    # 3. Smooth the target side contour with a wide Gaussian window
    # If dir == "left", the problem area is the left edge (forehead & crown slope, Y: 28..120)
    # If dir == "right", the problem area is the right edge (forehead & crown slope, Y: 28..120)

    $targetEdges = if ($dir -eq "left") { $leftEdges } else { $rightEdges }
    $smoothed = @{}
    $yKeys = $targetEdges.Keys | Sort-Object

    foreach ($y in $yKeys) {
        # Only smooth skull dome (Y from topY up to 130 before nose tip)
        if ($y -le 135) {
            $sum = 0.0
            $weightSum = 0.0
            $win = 8 # window radius = 8
            for ($dy = -$win; $dy -le $win; $dy++) {
                $cy = $y + $dy
                if ($targetEdges.ContainsKey($cy)) {
                    $wgt = [Math]::Exp(- ($dy * $dy) / (2.0 * 4.0 * 4.0)) # Gaussian sigma = 4.0
                    $sum += $targetEdges[$cy] * $wgt
                    $weightSum += $wgt
                }
            }
            $smoothed[$y] = $sum / $weightSum
        } else {
            $smoothed[$y] = [double]$targetEdges[$y]
        }
    }

    # 4. Reconstruct clean anti-aliased edge along smoothed boundary
    foreach ($y in $yKeys) {
        if ($y -gt 135) { continue }

        $origVal = $targetEdges[$y]
        $smoothVal = $smoothed[$y]
        $intSmooth = [int][Math]::Round($smoothVal)
        $frac = $smoothVal - [Math]::Floor($smoothVal) # subpixel fraction for anti-aliasing

        if ($dir -eq "left") {
            # Clear anything left of intSmooth
            for ($x = $x0; $x -lt $intSmooth; $x++) {
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }

            # Find skin color inside
            $skinColor = $bmp.GetPixel($intSmooth + 8, $y)
            if ($skinColor.A -lt 100 -or $skinColor.R -lt 120) {
                $skinColor = [System.Drawing.Color]::FromArgb(255, 250, 220, 200)
            }

            # Subpixel anti-aliasing outer pixel
            $alpha1 = [int]([Math]::Min(255, [Math]::Max(40, (1.0 - $frac) * 255)))
            $bmp.SetPixel($intSmooth, $y, [System.Drawing.Color]::FromArgb($alpha1, $avgOutline.R, $avgOutline.G, $avgOutline.B))
            
            # Solid outline stroke (2-3px)
            $bmp.SetPixel($intSmooth + 1, $y, $avgOutline)
            $bmp.SetPixel($intSmooth + 2, $y, $avgOutline)
            
            # Inner anti-aliasing transition to skin
            $mixR = [int](($avgOutline.R + $skinColor.R) / 2)
            $mixG = [int](($avgOutline.G + $skinColor.G) / 2)
            $mixB = [int](($avgOutline.B + $skinColor.B) / 2)
            $bmp.SetPixel($intSmooth + 3, $y, [System.Drawing.Color]::FromArgb(255, $mixR, $mixG, $mixB))
        } else {
            # Right profile: clear anything right of intSmooth
            for ($x = $intSmooth + 1; $x -le $x1; $x++) {
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }

            $skinColor = $bmp.GetPixel($intSmooth - 8, $y)
            if ($skinColor.A -lt 100 -or $skinColor.R -lt 120) {
                $skinColor = [System.Drawing.Color]::FromArgb(255, 250, 220, 200)
            }

            $alpha1 = [int]([Math]::Min(255, [Math]::Max(40, $frac * 255)))
            $bmp.SetPixel($intSmooth, $y, [System.Drawing.Color]::FromArgb($alpha1, $avgOutline.R, $avgOutline.G, $avgOutline.B))
            
            $bmp.SetPixel($intSmooth - 1, $y, $avgOutline)
            $bmp.SetPixel($intSmooth - 2, $y, $avgOutline)
            
            $mixR = [int](($avgOutline.R + $skinColor.R) / 2)
            $mixG = [int](($avgOutline.G + $skinColor.G) / 2)
            $mixB = [int](($avgOutline.B + $skinColor.B) / 2)
            $bmp.SetPixel($intSmooth - 3, $y, [System.Drawing.Color]::FromArgb(255, $mixR, $mixG, $mixB))
        }
    }
}

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
$targetCharH = 282

$columnIntervals = @(
    @{ dir="front"; x0=0;   x1=284 },
    @{ dir="left";  x0=285; x1=510 },
    @{ dir="back";  x0=511; x1=790 },
    @{ dir="right"; x0=791; x1=1023 }
)

foreach ($skin in $skinMap) {
    $srcPath = Join-Path $srcDir $skin.file
    $bmp = New-Object System.Drawing.Bitmap($srcPath)
    $w = $bmp.Width
    $h = $bmp.Height

    Write-Host "========================================"
    Write-Host "Smoothing and slicing $($skin.title)..."

    # Apply head contour perfection on Left (col 1) and Right (col 3)
    Perfect-HeadContour -bmp $bmp -x0 285 -x1 510 -dir "left"
    Perfect-HeadContour -bmp $bmp -x0 791 -x1 1023 -dir "right"

    foreach ($col in $columnIntervals) {
        $dir = $col.dir
        $x0 = $col.x0
        $x1 = [Math]::Min($col.x1, $w - 1)

        # 1. Find character bounding box
        $minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0

        for ($x = $x0; $x -le $x1; $x++) {
            for ($y = 0; $y -lt $h; $y++) {
                $p = $bmp.GetPixel($x, $y)
                if ($p.A -gt 15) {
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

        $cropW = $maxX - $minX + 1
        $cropH = $maxY - $minY + 1

        # 2. Extract cropped bitmap
        $cropBmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        for ($cx = 0; $cx -lt $cropW; $cx++) {
            for ($cy = 0; $cy -lt $cropH; $cy++) {
                $px = $minX + $cx
                $py = $minY + $cy
                $p = $bmp.GetPixel($px, $py)
                if ($p.A -lt 15) {
                    $cropBmp.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                } else {
                    $cropBmp.SetPixel($cx, $cy, $p)
                }
            }
        }

        # 3. Fit onto 240x340 canvas
        $scale = $targetCharH / [double]$cropH
        $destW = [int]([Math]::Round($cropW * $scale))
        $destH = [int]([Math]::Round($cropH * $scale))
        $destX = [int](($targetCanvasW - $destW) / 2)
        $destY = [int]($targetFeetY - $destH)

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

        # 4. Save files
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
    Write-Host "  -> Successfully smoothed & saved all directions for $($skin.title)"
}

Write-Host "All 5 skin tones & 4 directions smoothed and saved!"
