Add-Type -AssemblyName System.Drawing

$skinMap = @(
    @{ name="pale"; file="media_1789397187992.png"; title="Pale" },
    @{ name="fair"; file="media_1789397188108.png"; title="Fair" },
    @{ name="natural"; file="media_1789397188227.png"; title="Natural" },
    @{ name="tan"; file="media_1789397188289.png"; title="Tan" },
    @{ name="deep"; file="media_1789397188375.png"; title="Deep" }
)

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded"
$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

$targetCanvasW = 240
$targetCanvasH = 340
$targetFeetY = 324
$targetCharH = 282 # Perfectly matches female 291px/head 34px, feet 324px

$dirs = @("front", "right", "back", "left")

foreach ($skin in $skinMap) {
    $srcPath = Join-Path $srcDir $skin.file
    $bmp = New-Object System.Drawing.Bitmap($srcPath)
    $w = $bmp.Width
    $h = $bmp.Height
    $colW = [int]($w / 4) # 256

    Write-Host "Processing $($skin.title) from $($skin.file)..."

    for ($c = 0; $c -lt 4; $c++) {
        $dir = $dirs[$c]
        $x0 = $c * $colW
        $x1 = [Math]::Min($x0 + $colW - 1, $w - 1)

        # 1. Find character bounding box
        $minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0

        for ($x = $x0; $x -le $x1; $x++) {
            for ($y = 0; $y -lt $h; $y++) {
                $p = $bmp.GetPixel($x, $y)
                if ($p.A -gt 25) {
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

        # 2. Extract cropped bitmap with alpha cleanup
        $cropBmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        for ($cx = 0; $cx -lt $cropW; $cx++) {
            for ($cy = 0; $cy -lt $cropH; $cy++) {
                $px = $minX + $cx
                $py = $minY + $cy
                $p = $bmp.GetPixel($px, $py)
                if ($p.A -lt 25) {
                    $cropBmp.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                } else {
                    $cropBmp.SetPixel($cx, $cy, $p)
                }
            }
        }

        # 3. Fit onto 240x340 canvas aligned to bottom feet
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

        # Save skin specific file
        $skinFileName = "male_base_$($skin.name)_$dir.png"
        $skinOutPath = Join-Path $outDir $skinFileName
        $canvas.Save($skinOutPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "  -> Saved $skinFileName"

        # Update default
        if ($skin.name -eq "fair") {
            $defBase = Join-Path $outDir "male_base_$dir.png"
            $defChar = Join-Path $outDir "male_$dir.png"
            $canvas.Save($defBase, [System.Drawing.Imaging.ImageFormat]::Png)
            $canvas.Save($defChar, [System.Drawing.Imaging.ImageFormat]::Png)
            Write-Host "  -> Updated default male_base_$dir.png & male_$dir.png"
        }

        $canvas.Dispose()
    }
    $bmp.Dispose()
}

Write-Host "All 5 male skin tones sliced and updated successfully!"
