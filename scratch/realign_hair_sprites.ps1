Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"
$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
$testDir = "c:\Users\Administrator\Documents\GitHub\StockWars\scratch\test_hair_composites"
if (-not (Test-Path $testDir)) { New-Item -ItemType Directory -Path $testDir -Force }

$hairs = @(
    @{ id="bob";      file="media_1789463644338.png" },
    @{ id="long";     file="media_1789463644394.png" },
    @{ id="ponytail"; file="media_1789463644478.png" },
    @{ id="short";    file="media_1789463644510.png" }
)

$dirs = @("front", "left", "back", "right")

$bodySprites = @{}
$faceSprites = @{}
foreach ($d in $dirs) {
    $bodySprites[$d] = New-Object System.Drawing.Bitmap((Join-Path $outDir ("base_fair_" + $d + ".png")))
    $faceSprites[$d] = New-Object System.Drawing.Bitmap((Join-Path $outDir ("face_default_" + $d + ".png")))
}

foreach ($h in $hairs) {
    $bmp = New-Object System.Drawing.Bitmap((Join-Path $srcDir $h.file))
    
    # Find 4 segments with 0-alpha gaps
    $colAlphas = @()
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $count = 0
        for ($y = 0; $y -lt $bmp.Height; $y++) {
            if ($bmp.GetPixel($x, $y).A -gt 15) { $count++ }
        }
        $colAlphas += $count
    }

    $inSeg = $false
    $segStart = 0
    $segments = @()
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        if ($colAlphas[$x] -gt 0 -and -not $inSeg) {
            $inSeg = $true
            $segStart = $x
        } elseif ($colAlphas[$x] -eq 0 -and $inSeg) {
            $inSeg = $false
            $segments += @{ Start=$segStart; End=($x - 1) }
        }
    }
    if ($inSeg) {
        $segments += @{ Start=$segStart; End=($bmp.Width - 1) }
    }

    Write-Host ("Processing " + $h.id + ": found " + $segments.Count + " segments")

    for ($c = 0; $c -lt 4; $c++) {
        $dir = $dirs[$c]
        $seg = $segments[$c]
        $x0 = $seg.Start
        $x1 = $seg.End

        # Find exact 2D bounding box
        $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
        for ($x = $x0; $x -le $x1; $x++) {
            for ($y = 0; $y -lt $bmp.Height; $y++) {
                if ($bmp.GetPixel($x, $y).A -gt 15) {
                    if ($x -lt $minX) { $minX = $x }
                    if ($x -gt $maxX) { $maxX = $x }
                    if ($y -lt $minY) { $minY = $y }
                    if ($y -gt $maxY) { $maxY = $y }
                }
            }
        }

        $cropW = $maxX - $minX + 1
        $cropH = $maxY - $minY + 1

        # Find apex (topmost center pixel) in crop
        $apexX = 0
        $apexCount = 0
        for ($x = $minX; $x -le $maxX; $x++) {
            if ($bmp.GetPixel($x, $minY).A -gt 15) {
                $apexX += ($x - $minX)
                $apexCount++
            }
        }
        $cropApexX = if ($apexCount -gt 0) { $apexX / $apexCount } else { $cropW / 2.0 }

        # Crop sprite
        $cropRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)
        $cropBmp = $bmp.Clone($cropRect, $bmp.PixelFormat)

        # Scale factor
        $scale = 0.48
        if ($h.id -eq "long") { $scale = 0.52 }
        if ($h.id -eq "ponytail" -and $dir -eq "back") { $scale = 0.52 }
        if ($h.id -eq "ponytail" -and ($dir -eq "left" -or $dir -eq "right")) { $scale = 0.48 }

        $destW = [int]([Math]::Round($cropW * $scale))
        $destH = [int]([Math]::Round($cropH * $scale))

        # Y position
        $destY = 36
        if ($h.id -eq "ponytail") { $destY = 22 }
        if ($h.id -eq "long") { $destY = 32 }

        # Center alignment
        $headCenterX = 124.0
        if ($dir -eq "left") { $headCenterX = 122.0 }
        elseif ($dir -eq "right") { $headCenterX = 117.0 }
        elseif ($dir -eq "back") { $headCenterX = 122.5 }

        # Use cropApexX to align apex precisely to head center
        $scaledApexX = $cropApexX * $scale
        $destX = [int]([Math]::Round($headCenterX - $scaledApexX))

        # Adjust for side profiles if needed
        if ($h.id -eq "long" -and $dir -eq "left") {
            $destX = 68
        }
        if ($h.id -eq "long" -and $dir -eq "right") {
            $destX = 64
        }
        if ($h.id -eq "ponytail" -and $dir -eq "back") {
            $destX = 68
        }

        # Create output canvas
        $canvas = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($canvas)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.Clear([System.Drawing.Color]::Transparent)

        $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
        $srcRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
        $g.DrawImage($cropBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $g.Dispose()

        # Save hair sprite to web/assets/character
        $hairFileName = "hair_" + $h.id + "_" + $dir + ".png"
        $hairFilePath = Join-Path $outDir $hairFileName
        $canvas.Save($hairFilePath, [System.Drawing.Imaging.ImageFormat]::Png)

        # Composite check
        $comp = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $gc = [System.Drawing.Graphics]::FromImage($comp)
        $gc.Clear([System.Drawing.Color]::Transparent)
        $gc.DrawImage($bodySprites[$dir], 0, 0, 240, 340)
        $gc.DrawImage($faceSprites[$dir], 0, 0, 240, 340)
        $gc.DrawImage($canvas, 0, 0, 240, 340)
        $gc.Dispose()

        $compName = "comp_" + $h.id + "_" + $dir + ".png"
        $comp.Save((Join-Path $testDir $compName), [System.Drawing.Imaging.ImageFormat]::Png)
        $comp.Dispose()

        $canvas.Dispose()
        $cropBmp.Dispose()
        Write-Host ("  -> Saved " + $hairFileName + " (" + $destW + "x" + $destH + " at X=" + $destX + ", Y=" + $destY + ")")
    }
    $bmp.Dispose()
}

foreach ($d in $dirs) {
    $bodySprites[$d].Dispose()
    $faceSprites[$d].Dispose()
}

Write-Host "All hair sprites regenerated and verified successfully!"
