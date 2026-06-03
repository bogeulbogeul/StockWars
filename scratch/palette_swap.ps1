[void][System.Reflection.Assembly]::LoadWithPartialName("System.Drawing")

$srcPath = "c:\Users\Administrator\Documents\GitHub\StockWars\Art_References\cozy_pure_sky_day_256.png"
$dstSunset = "c:\Users\Administrator\Documents\GitHub\StockWars\Art_References\cozy_pure_sky_sunset_256.png"
$dstNight = "c:\Users\Administrator\Documents\GitHub\StockWars\Art_References\cozy_pure_sky_night_256.png"
$dstRainy = "c:\Users\Administrator\Documents\GitHub\StockWars\Art_References\cozy_pure_sky_rainy_256.png"

$src = [System.Drawing.Image]::FromFile($srcPath)
$bmpSunset = New-Object System.Drawing.Bitmap($src)
$bmpNight = New-Object System.Drawing.Bitmap($src)
$bmpRainy = New-Object System.Drawing.Bitmap($src)
$src.Dispose()

# Helper for HSL
function Get-Hsl($r, $g, $b) {
    $rNorm = $r / 255.0
    $gNorm = $g / 255.0
    $bNorm = $b / 255.0
    $max = [Math]::Max($rNorm, [Math]::Max($gNorm, $bNorm))
    $min = [Math]::Min($rNorm, [Math]::Min($gNorm, $bNorm))
    $h = 0.0; $s = 0.0; $l = ($max + $min) / 2.0
    if ($max -ne $min) {
        $d = $max - $min
        $s = if ($l -gt 0.5) { $d / (2.0 - $max - $min) } else { $d / ($max + $min) }
        
        if ($max -eq $rNorm) { 
            $h = ($gNorm - $bNorm) / $d
            if ($gNorm -lt $bNorm) { $h += 6.0 }
        }
        elseif ($max -eq $gNorm) { 
            $h = ($bNorm - $rNorm) / $d + 2.0 
        }
        else { 
            $h = ($rNorm - $gNorm) / $d + 4.0 
        }
        $h /= 6.0
    }
    return @{ H = $h; S = $s; L = $l }
}

for ($y = 0; $y -lt $bmpSunset.Height; $y++) {
    for ($x = 0; $x -lt $bmpSunset.Width; $x++) {
        $c = $bmpSunset.GetPixel($x, $y)
        $hsl = Get-Hsl $c.R $c.G $c.B
        
        $isSky = ($hsl.H -gt 0.45 -and $hsl.H -lt 0.68 -and $hsl.S -gt 0.2)
        
        if ($isSky) {
            $ratio = $y / 255.0
            
            # --- SUNSET SKY ---
            $sr = 0; $sg = 0; $sb = 0
            if ($ratio -lt 0.5) {
                $subRatio = $ratio * 2.0
                $sr = 110 + (225 - 110) * $subRatio
                $sg = 95 + (135 - 95) * $subRatio
                $sb = 140 + (140 - 140) * $subRatio
            } else {
                $subRatio = ($ratio - 0.5) * 2.0
                $sr = 225 + (250 - 225) * $subRatio
                $sg = 135 + (195 - 135) * $subRatio
                $sb = 140 + (135 - 140) * $subRatio
            }
            $bmpSunset.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($sr, $sg, $sb))
            
            # --- NIGHT SKY ---
            $nr = 15 + (38 - 15) * $ratio
            $ng = 18 + (28 - 18) * $ratio
            $nb = 38 + (58 - 38) * $ratio
            $bmpNight.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($nr, $ng, $nb))

            # --- RAINY SKY ---
            $rr = 70 + (120 - 70) * $ratio
            $rg = 85 + (135 - 85) * $ratio
            $rb = 105 + (155 - 105) * $ratio
            $bmpRainy.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($rr, $rg, $rb))
        } else {
            # --- CLOUD PIXELS ---
            $l = $hsl.L
            
            # SUNSET CLOUDS:
            if ($l -gt 0.82) {
                $bmpSunset.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 232, 215))
            } elseif ($l -gt 0.68) {
                $bmpSunset.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(235, 198, 180))
            } elseif ($l -gt 0.52) {
                $bmpSunset.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(215, 155, 145))
            } else {
                $bmpSunset.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(120, 85, 90))
            }
            
            # NIGHT CLOUDS:
            if ($l -gt 0.82) {
                $bmpNight.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(135, 125, 155))
            } elseif ($l -gt 0.68) {
                $bmpNight.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(105, 95, 125))
            } elseif ($l -gt 0.52) {
                $bmpNight.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(80, 72, 100))
            } else {
                $bmpNight.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(42, 35, 52))
            }

            # RAINY CLOUDS:
            if ($l -gt 0.82) {
                $bmpRainy.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(175, 185, 195))
            } elseif ($l -gt 0.68) {
                $bmpRainy.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(150, 160, 170))
            } elseif ($l -gt 0.52) {
                $bmpRainy.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(120, 130, 140))
            } else {
                $bmpRainy.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(65, 73, 82))
            }
        }
    }
}

$bmpSunset.Save($dstSunset, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpNight.Save($dstNight, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpRainy.Save($dstRainy, [System.Drawing.Imaging.ImageFormat]::Png)

$bmpSunset.Dispose()
$bmpNight.Dispose()
$bmpRainy.Dispose()

Write-Output "Sunset, Night, and Rainy pure sky variations generated successfully!"
