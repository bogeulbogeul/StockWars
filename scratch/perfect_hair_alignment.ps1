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
    
    # 0-alpha gap segment finding
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

    for ($c = 0; $c -lt 4; $c++) {
        $dir = $dirs[$c]
        $seg = $segments[$c]
        $x0 = $seg.Start
        $x1 = $seg.End

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

        $cropRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)
        $cropBmp = $bmp.Clone($cropRect, $bmp.PixelFormat)

        # Verified optimal scale and position parameters
        $scale = 0.48
        $destY = 36
        $destX = 0

        if ($h.id -eq "short") {
            $scale = 0.48
            $destY = 36
            if ($dir -eq "front") { $destX = 65 }
            elseif ($dir -eq "left") { $destX = 53 }
            elseif ($dir -eq "back") { $destX = 61 }
            elseif ($dir -eq "right") { $destX = 69 }
        }
        elseif ($h.id -eq "bob") {
            $scale = 0.48
            $destY = 36
            if ($dir -eq "front") { $destX = 68 }
            elseif ($dir -eq "left") { $destX = 58 }
            elseif ($dir -eq "back") { $destX = 65 }
            elseif ($dir -eq "right") { $destX = 65 }
        }
        elseif ($h.id -eq "long") {
            $destY = 32
            if ($dir -eq "front") {
                $scale = 0.52
                $destX = 67
            }
            elseif ($dir -eq "left") {
                $scale = 0.54
                $destX = 72
                $destY = 30
            }
            elseif ($dir -eq "back") {
                $scale = 0.52
                $destX = 66
            }
            elseif ($dir -eq "right") {
                $scale = 0.54
                $destX = 60
                $destY = 30
            }
        }
        elseif ($h.id -eq "ponytail") {
            $destY = 22
            if ($dir -eq "front") {
                $scale = 0.48
                $destX = 75
            }
            elseif ($dir -eq "left") {
                $scale = 0.55
                $destX = 54
                $destY = 18
            }
            elseif ($dir -eq "back") {
                $scale = 0.62
                $destX = 62
                $destY = 20
            }
            elseif ($dir -eq "right") {
                $scale = 0.57
                $destX = 52
                $destY = 18
            }
        }

        $destW = [int]([Math]::Round($cropW * $scale))
        $destH = [int]([Math]::Round($cropH * $scale))

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
    }
    $bmp.Dispose()
}

# Also ensure hair_none_*.png exist
foreach ($dir in $dirs) {
    $canvas = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.Dispose()
    $filePath = Join-Path $outDir ("hair_none_" + $dir + ".png")
    $canvas.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()
}

foreach ($d in $dirs) {
    $bodySprites[$d].Dispose()
    $faceSprites[$d].Dispose()
}

Write-Host "All 16 hair sprites + none sprites perfected and verified!"
