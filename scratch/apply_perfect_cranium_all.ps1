Add-Type -AssemblyName System.Drawing

function Perfect-Cranium {
    param(
        [string]$filePath,
        [string]$dir
    )

    if (-not (Test-Path $filePath)) { return }

    $bmp = New-Object System.Drawing.Bitmap($filePath)
    $w = $bmp.Width
    $h = $bmp.Height

    # 1. Sample average outline color
    $outColors = @()
    for ($y = 45; $y -le 85; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.A -gt 150 -and $p.R -lt 115 -and $p.G -lt 85) {
                $outColors += $p
                break
            }
        }
    }
    $avgR = if ($outColors.Count -gt 0) { [int](($outColors | Measure-Object -Property R -Average).Average) } else { 75 }
    $avgG = if ($outColors.Count -gt 0) { [int](($outColors | Measure-Object -Property G -Average).Average) } else { 48 }
    $avgB = if ($outColors.Count -gt 0) { [int](($outColors | Measure-Object -Property B -Average).Average) } else { 30 }
    $outlineColor = [System.Drawing.Color]::FromArgb(255, $avgR, $avgG, $avgB)

    # 2. Sample skin tone
    $skinColor = $bmp.GetPixel(120, 75)
    if ($skinColor.A -lt 100) {
        $skinColor = [System.Drawing.Color]::FromArgb(255, 250, 220, 200)
    }

    # 3. Find top apex Y
    $topY = 999
    for ($y = 35; $y -le 55; $y++) {
        for ($x = 70; $x -le 170; $x++) {
            if ($bmp.GetPixel($x, $y).A -gt 30) {
                if ($y -lt $topY) { $topY = $y }
            }
        }
        if ($topY -lt 999) { break }
    }

    # 4. Find head width at Y=90
    $minX90 = 999; $maxX90 = -1
    for ($x = 0; $x -lt $w; $x++) {
        if ($bmp.GetPixel($x, 90).A -gt 30) {
            if ($x -lt $minX90) { $minX90 = $x }
            if ($x -gt $maxX90) { $maxX90 = $x }
        }
    }

    $xc = ($minX90 + $maxX90) / 2.0
    $rx = ($maxX90 - $minX90 + 1) / 2.0
    $yc = 90.0
    $ry = $yc - $topY

    $outBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($outBmp)
    $g.DrawImage($bmp, 0, 0, $w, $h)
    $g.Dispose()

    for ($y = $topY - 3; $y -le 92; $y++) {
        $dy = $y - $yc
        $val = 1.0 - ($dy * $dy) / ($ry * $ry)
        if ($val -le 0) {
            for ($x = [int]($xc - $rx - 5); $x -le [int]($xc + $rx + 5); $x++) {
                $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
            continue
        }

        $dx = $rx * [Math]::Sqrt($val)
        $idealLeft = $xc - $dx
        $idealRight = $xc + $dx

        $intLeft = [int][Math]::Round($idealLeft)
        $intRight = [int][Math]::Round($idealRight)

        # Clear outside
        for ($x = 0; $x -lt $intLeft; $x++) {
            $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
        for ($x = $intRight + 1; $x -lt $w; $x++) {
            $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }

        # Render Left edge anti-aliasing
        $fracL = $idealLeft - [Math]::Floor($idealLeft)
        $alphaL = [int]([Math]::Min(255, [Math]::Max(40, (1.0 - $fracL) * 255)))
        $outBmp.SetPixel($intLeft, $y, [System.Drawing.Color]::FromArgb($alphaL, $avgR, $avgG, $avgB))
        $outBmp.SetPixel($intLeft + 1, $y, $outlineColor)
        $outBmp.SetPixel($intLeft + 2, $y, $outlineColor)

        # Render Right edge anti-aliasing
        $fracR = $idealRight - [Math]::Floor($idealRight)
        $alphaR = [int]([Math]::Min(255, [Math]::Max(40, $fracR * 255)))
        $outBmp.SetPixel($intRight, $y, [System.Drawing.Color]::FromArgb($alphaR, $avgR, $avgG, $avgB))
        $outBmp.SetPixel($intRight - 1, $y, $outlineColor)
        $outBmp.SetPixel($intRight - 2, $y, $outlineColor)

        # Fill inside skin
        for ($x = $intLeft + 3; $x -le $intRight - 3; $x++) {
            $currP = $outBmp.GetPixel($x, $y)
            if ($currP.A -lt 200) {
                $outBmp.SetPixel($x, $y, $skinColor)
            }
        }
    }

    $bmp.Dispose()
    $outBmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $outBmp.Dispose()
    Write-Host "  -> Successfully processed $filePath"
}

$skins = @("pale", "fair", "natural", "tan", "deep")
$dirs = @("left", "right")
$charDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"

foreach ($skin in $skins) {
    foreach ($dir in $dirs) {
        Perfect-Cranium -filePath (Join-Path $charDir "base_${skin}_${dir}.png") -dir $dir
        Perfect-Cranium -filePath (Join-Path $charDir "male_base_${skin}_${dir}.png") -dir $dir
        Perfect-Cranium -filePath (Join-Path $charDir "female_base_${skin}_${dir}.png") -dir $dir
    }
}

# Fallbacks
foreach ($dir in $dirs) {
    Perfect-Cranium -filePath (Join-Path $charDir "base_${dir}.png") -dir $dir
    Perfect-Cranium -filePath (Join-Path $charDir "male_base_${dir}.png") -dir $dir
    Perfect-Cranium -filePath (Join-Path $charDir "male_${dir}.png") -dir $dir
    Perfect-Cranium -filePath (Join-Path $charDir "female_base_${dir}.png") -dir $dir
    Perfect-Cranium -filePath (Join-Path $charDir "female_${dir}.png") -dir $dir
}

Write-Host "All side profile craniums completely rounded and polished!"
