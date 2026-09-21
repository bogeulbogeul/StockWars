Add-Type -AssemblyName System.Drawing

function Smooth-HeadContour {
    param(
        [System.Drawing.Bitmap]$bmp,
        [int]$x0,
        [int]$x1,
        [string]$dir # "left" or "right"
    )

    $w = $bmp.Width
    $h = $bmp.Height
    $topY = 28
    $botY = 160 # Skull dome region

    # 1. Extract outer boundary curve for the skull dome
    $origOuter = @{}
    $outlineThickness = @{}
    $avgOutlineColor = [System.Drawing.Color]::FromArgb(255, 75, 48, 30)

    for ($y = $topY; $y -le $botY; $y++) {
        $minX = -1; $maxX = -1
        $outStart = -1; $outEnd = -1

        if ($dir -eq "left") {
            # Find leftmost non-transparent pixel
            for ($x = $x0; $x -le $x1; $x++) {
                $p = $bmp.GetPixel($x, $y)
                if ($p.A -gt 30) {
                    $minX = $x
                    break
                }
            }
            if ($minX -ge 0) {
                # Find outline end (transition to skin fill)
                for ($x = $minX; $x -le $minX + 15; $x++) {
                    $p = $bmp.GetPixel($x, $y)
                    if ($p.R -gt 150 -and $p.G -gt 100) {
                        $outEnd = $x
                        break
                    }
                }
                $origOuter[$y] = $minX
                $outlineThickness[$y] = if ($outEnd -gt $minX) { $outEnd - $minX } else { 4 }
            }
        } else {
            # Right view: find rightmost non-transparent pixel
            for ($x = $x1; $x -ge $x0; $x--) {
                $p = $bmp.GetPixel($x, $y)
                if ($p.A -gt 30) {
                    $maxX = $x
                    break
                }
            }
            if ($maxX -ge 0) {
                for ($x = $maxX; $x -ge $maxX - 15; $x--) {
                    $p = $bmp.GetPixel($x, $y)
                    if ($p.R -gt 150 -and $p.G -gt 100) {
                        $outEnd = $x
                        break
                    }
                }
                $origOuter[$y] = $maxX
                $outlineThickness[$y] = if ($outEnd -gt 0 -and $maxX -gt $outEnd) { $maxX - $outEnd } else { 4 }
            }
        }
    }

    # 2. Gaussian / Moving average smoothing on the boundary curve
    $smoothedOuter = @{}
    $window = 7 # Window radius (total 15 samples)
    
    $yKeys = $origOuter.Keys | Sort-Object
    foreach ($y in $yKeys) {
        $sum = 0.0
        $weightSum = 0.0
        for ($dy = -$window; $dy -le $window; $dy++) {
            $currY = $y + $dy
            if ($origOuter.ContainsKey($currY)) {
                $weight = [Math]::Exp(- ($dy * $dy) / (2.0 * 3.5 * 3.5)) # Gaussian weight (sigma=3.5)
                $sum += $origOuter[$currY] * $weight
                $weightSum += $weight
            }
        }
        $smoothedOuter[$y] = [Math]::Round($sum / $weightSum)
    }

    # 3. Apply the smooth boundary back to the bitmap
    # For each Y in skull dome:
    # Clear pixels outside the smoothed boundary, and ensure outline is smoothly rendered
    foreach ($y in $yKeys) {
        $origEdge = $origOuter[$y]
        $smoothEdge = [int]$smoothedOuter[$y]
        $thick = [int]$outlineThickness[$y]
        if ($thick -lt 3) { $thick = 3 }
        if ($thick -gt 6) { $thick = 6 }

        if ($dir -eq "left") {
            # Clear any pixels to the left of smoothEdge
            for ($x = $x0; $x -lt $smoothEdge; $x++) {
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
            # Draw smooth outline at [smoothEdge .. smoothEdge + thick - 1]
            # Sample skin color inside
            $skinColor = $bmp.GetPixel($smoothEdge + $thick + 3, $y)
            if ($skinColor.A -lt 100 -or $skinColor.R -lt 120) {
                # fallback skin
                $skinColor = [System.Drawing.Color]::FromArgb(255, 250, 220, 200)
            }
            
            # Anti-aliasing outer pixel
            $edgeAlpha = 180
            $bmp.SetPixel($smoothEdge, $y, [System.Drawing.Color]::FromArgb($edgeAlpha, $avgOutlineColor.R, $avgOutlineColor.G, $avgOutlineColor.B))
            for ($t = 1; $t -lt $thick; $t++) {
                $bmp.SetPixel($smoothEdge + $t, $y, $avgOutlineColor)
            }
        } else {
            # Right view: clear any pixels to the right of smoothEdge
            for ($x = $smoothEdge + 1; $x -le $x1; $x++) {
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
            $skinColor = $bmp.GetPixel($smoothEdge - $thick - 3, $y)
            if ($skinColor.A -lt 100 -or $skinColor.R -lt 120) {
                $skinColor = [System.Drawing.Color]::FromArgb(255, 250, 220, 200)
            }
            $edgeAlpha = 180
            $bmp.SetPixel($smoothEdge, $y, [System.Drawing.Color]::FromArgb($edgeAlpha, $avgOutlineColor.R, $avgOutlineColor.G, $avgOutlineColor.B))
            for ($t = 1; $t -lt $thick; $t++) {
                $bmp.SetPixel($smoothEdge - $t, $y, $avgOutlineColor)
            }
        }
    }
}

Write-Host "Contour smoothing function defined."
