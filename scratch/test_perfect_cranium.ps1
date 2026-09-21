Add-Type -AssemblyName System.Drawing

function Perfect-Cranium {
    param(
        [string]$filePath,
        [string]$dir # "left" or "right"
    )

    $bmp = New-Object System.Drawing.Bitmap($filePath)
    $w = $bmp.Width
    $h = $bmp.Height

    # 1. Find character head bounding box and center in 240x340 canvas
    # Skull dome is between Y=40 and Y=95
    # Find average outline color from existing top outline
    $outColors = @()
    for ($y = 45; $y -le 85; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.A -gt 150 -and $p.R -lt 110 -and $p.G -lt 80) {
                $outColors += $p
                break
            }
        }
    }
    $avgR = if ($outColors.Count -gt 0) { [int](($outColors | Measure-Object -Property R -Average).Average) } else { 75 }
    $avgG = if ($outColors.Count -gt 0) { [int](($outColors | Measure-Object -Property G -Average).Average) } else { 48 }
    $avgB = if ($outColors.Count -gt 0) { [int](($outColors | Measure-Object -Property B -Average).Average) } else { 30 }
    $outlineColor = [System.Drawing.Color]::FromArgb(255, $avgR, $avgG, $avgB)

    # Sample skin tone from center of head
    $skinColor = $bmp.GetPixel(120, 75)
    if ($skinColor.A -lt 100 -or $skinColor.R -lt 120) {
        $skinColor = [System.Drawing.Color]::FromArgb(255, 252, 222, 201)
    }

    # Find exact head parameters:
    # Top apex Y
    $topY = 999
    for ($y = 35; $y -le 55; $y++) {
        for ($x = 70; $x -le 170; $x++) {
            if ($bmp.GetPixel($x, $y).A -gt 30) {
                if ($y -lt $topY) { $topY = $y }
            }
        }
        if ($topY -lt 999) { break }
    }

    # Max head width at Y=90
    $minX90 = 999; $maxX90 = -1
    for ($x = 0; $x -lt $w; $x++) {
        if ($bmp.GetPixel($x, 90).A -gt 30) {
            if ($x -lt $minX90) { $minX90 = $x }
            if ($x -gt $maxX90) { $maxX90 = $x }
        }
    }

    $xc = ($minX90 + $maxX90) / 2.0 # ~120.0
    $rx = ($maxX90 - $minX90 + 1) / 2.0 # ~46.0
    $yc = 90.0
    $ry = $yc - $topY # ~47.0

    Write-Host "$filePath : topY=$topY, Xc=$xc, Yc=$yc, Rx=$rx, Ry=$ry, Outline=($avgR,$avgG,$avgB)"

    # Now, for Y from topY - 2 to 92:
    # Compute ideal smooth elliptical bounds [idealMinX, idealMaxX]
    $outBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($outBmp)
    $g.DrawImage($bmp, 0, 0, $w, $h)
    $g.Dispose()

    for ($y = $topY - 3; $y -le 92; $y++) {
        $dy = $y - $yc
        $val = 1.0 - ($dy * $dy) / ($ry * $ry)
        if ($val -le 0) {
            # Above apex: clear all pixels in head column
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

        # 1. Clear outside the smooth ideal cranium
        for ($x = 0; $x -lt $intLeft; $x++) {
            $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
        for ($x = $intRight + 1; $x -lt $w; $x++) {
            $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }

        # 2. Re-render clean anti-aliased outline on left edge
        # Left edge anti-alias fraction
        $fracL = $idealLeft - [Math]::Floor($idealLeft)
        $alphaL = [int]([Math]::Min(255, [Math]::Max(40, (1.0 - $fracL) * 255)))
        $outBmp.SetPixel($intLeft, $y, [System.Drawing.Color]::FromArgb($alphaL, $avgR, $avgG, $avgB))
        $outBmp.SetPixel($intLeft + 1, $y, $outlineColor)
        $outBmp.SetPixel($intLeft + 2, $y, $outlineColor)

        # 3. Re-render clean anti-aliased outline on right edge
        $fracR = $idealRight - [Math]::Floor($idealRight)
        $alphaR = [int]([Math]::Min(255, [Math]::Max(40, $fracR * 255)))
        $outBmp.SetPixel($intRight, $y, [System.Drawing.Color]::FromArgb($alphaR, $avgR, $avgG, $avgB))
        $outBmp.SetPixel($intRight - 1, $y, $outlineColor)
        $outBmp.SetPixel($intRight - 2, $y, $outlineColor)

        # 4. Fill inside if empty
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
    Write-Host "  -> Perfectly rounded cranium saved to $filePath"
}

# Test on base_fair_left.png and base_fair_right.png
Perfect-Cranium -filePath "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_left.png" -dir "left"
Perfect-Cranium -filePath "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_right.png" -dir "right"

Perfect-Cranium -filePath "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\male_base_fair_left.png" -dir "left"
Perfect-Cranium -filePath "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\male_base_fair_right.png" -dir "right"
Perfect-Cranium -filePath "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\male_left.png" -dir "left"
Perfect-Cranium -filePath "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\male_right.png" -dir "right"
