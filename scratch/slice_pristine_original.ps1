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
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

$targetCanvasW = 240
$targetCanvasH = 340
$targetFeetY = 324
$targetCharH = 282 # Base character height

# Natural column intervals between characters in 1024x682 master sheet
$columnIntervals = @(
    @{ dir="front"; x0=0;   x1=284 },
    @{ dir="left";  x0=285; x1=510 },
    @{ dir="back";  x0=511; x1=790 },
    @{ dir="right"; x0=791; x1=1023 }
)

# Generous margin padding to ensure 0% edge clipping
$pad = 10

foreach ($skin in $skinMap) {
    $srcPath = Join-Path $srcDir $skin.file
    $masterBmp = New-Object System.Drawing.Bitmap($srcPath)
    $w = $masterBmp.Width
    $h = $masterBmp.Height

    Write-Host "=================================================="
    Write-Host "Pristine Direct Slicing: $($skin.title) from $($skin.file)"

    foreach ($col in $columnIntervals) {
        $dir = $col.dir
        $x0 = $col.x0
        $x1 = [Math]::Min($col.x1, $w - 1)

        # 1. Find character bounding box from original unmodified alpha
        $minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0

        for ($x = $x0; $x -le $x1; $x++) {
            for ($y = 0; $y -lt $h; $y++) {
                $p = $masterBmp.GetPixel($x, $y)
                if ($p.A -gt 0) {
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

        $charH = $maxY - $minY + 1
        $charW = $maxX - $minX + 1

        # 2. Add generous padding
        $cropX0 = [Math]::Max($x0, $minX - $pad)
        $cropX1 = [Math]::Min($x1, $maxX + $pad)
        $cropY0 = [Math]::Max(0, $minY - $pad)
        $cropY1 = [Math]::Min($h - 1, $maxY + $pad)

        $cropW = $cropX1 - $cropX0 + 1
        $cropH = $cropY1 - $cropY0 + 1

        # 3. Direct crop from original master bitmap with 100% original pixels
        $cropRect = New-Object System.Drawing.Rectangle($cropX0, $cropY0, $cropW, $cropH)
        $cropBmp = $masterBmp.Clone($cropRect, $masterBmp.PixelFormat)

        # 4. Scale onto high quality canvas
        $scale = $targetCharH / [double]$charH
        $destW = [int]([Math]::Round($cropW * $scale))
        $destH = [int]([Math]::Round($cropH * $scale))

        $scaledPadBottom = [int]([Math]::Round(($cropY1 - $maxY) * $scale))
        $destX = [int](($targetCanvasW - $destW) / 2)
        $destY = [int]($targetFeetY + $scaledPadBottom - $destH)

        $canvas = New-Object System.Drawing.Bitmap($targetCanvasW, $targetCanvasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
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
        $cropBmp.Dispose()

        # 5. Save output sprites
        $baseFile = Join-Path $outDir "base_$($skin.name)_$dir.png"
        $maleFile = Join-Path $outDir "male_base_$($skin.name)_$dir.png"
        $femaleFile = Join-Path $outDir "female_base_$($skin.name)_$dir.png"

        $canvas.Save($baseFile, [System.Drawing.Imaging.ImageFormat]::Png)
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
        Write-Host "  -> Saved $dir sprite cleanly."
    }
    $masterBmp.Dispose()
}

Write-Host "All pristine sprites directly sliced and saved with 100% original fidelity!"
