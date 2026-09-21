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
$targetCharH = 282

# Column boundaries based on the zero-pixel valleys
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
    Write-Host "Processing $($skin.title) from $($skin.file)..."

    foreach ($col in $columnIntervals) {
        $dir = $col.dir
        $x0 = $col.x0
        $x1 = [Math]::Min($col.x1, $w - 1)

        # 1. Find exact character bounding box in this column
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
        Write-Host "  Dir [$dir]: Bounds X=[$minX, $maxX] (W=$cropW), Y=[$minY, $maxY] (H=$cropH)"

        # 2. Extract cropped bitmap with alpha cleanup
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

        # 3. Fit onto 240x340 canvas aligned to bottom feet and centered horizontally
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
        # Base names
        $baseFile = Join-Path $outDir "base_$($skin.name)_$dir.png"
        $canvas.Save($baseFile, [System.Drawing.Imaging.ImageFormat]::Png)

        # Compat names for male / female paths
        $maleFile = Join-Path $outDir "male_base_$($skin.name)_$dir.png"
        $femaleFile = Join-Path $outDir "female_base_$($skin.name)_$dir.png"
        $canvas.Save($maleFile, [System.Drawing.Imaging.ImageFormat]::Png)
        $canvas.Save($femaleFile, [System.Drawing.Imaging.ImageFormat]::Png)

        Write-Host "    -> Saved base_$($skin.name)_$dir.png (and male/female compat)"

        # Default fallbacks (using fair skin)
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
            Write-Host "    -> Updated default fallback sprites for $dir"
        }

        $canvas.Dispose()
    }
    $bmp.Dispose()
}

Write-Host "All 5 skin tones & 4 directions sliced and saved successfully!"
