Add-Type -AssemblyName System.Drawing

$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

$hairStyles = @(
    @{ id="bob";      file="media_1789463644338.png"; name="단발"; topYOffset=36; scale=0.46 },
    @{ id="long";     file="media_1789463644394.png"; name="롱";   topYOffset=34; scale=0.46 },
    @{ id="ponytail"; file="media_1789463644478.png"; name="포니테일"; topYOffset=22; scale=0.46 },
    @{ id="short";    file="media_1789463644510.png"; name="숏컷"; topYOffset=36; scale=0.46 }
)

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"
$dirs = @("front", "left", "back", "right")

$targetCanvasW = 240
$targetCanvasH = 340

foreach ($h in $hairStyles) {
    $srcPath = Join-Path $srcDir $h.file
    $masterBmp = New-Object System.Drawing.Bitmap($srcPath)
    $w = $masterBmp.Width
    $hVal = $masterBmp.Height
    $colW = 256

    Write-Host "========================================"
    Write-Host "Generating 4 directions for Hair: $($h.name) ($($h.id))"

    for ($c = 0; $c -lt 4; $c++) {
        $dir = $dirs[$c]
        $x0 = $c * $colW
        $x1 = ($c + 1) * $colW - 1

        # 1. Find bounding box of this hair view
        $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
        for ($x = $x0; $x -le $x1; $x++) {
            for ($y = 0; $y -lt $hVal; $y++) {
                if ($masterBmp.GetPixel($x, $y).A -gt 15) {
                    if ($x -lt $minX) { $minX = $x }
                    if ($x -gt $maxX) { $maxX = $x }
                    if ($y -lt $minY) { $minY = $y }
                    if ($y -gt $maxY) { $maxY = $y }
                }
            }
        }

        $cropW = $maxX - $minX + 1
        $cropH = $maxY - $minY + 1

        # 2. Crop directly preserving 100% original anti-aliased pixels
        $cropRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)
        $cropBmp = $masterBmp.Clone($cropRect, $masterBmp.PixelFormat)

        # 3. Scale onto 240x340 canvas
        $destW = [int]([Math]::Round($cropW * $h.scale))
        $destH = [int]([Math]::Round($cropH * $h.scale))

        # Horizontal alignment:
        # Head center is at X=124 in front and back, X=120 in left and right
        $headCenterX = if ($dir -eq "front" -or $dir -eq "back") { 124 } else { 120 }
        $destX = [int]($headCenterX - ($destW / 2))
        $destY = $h.topYOffset

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

        # 4. Save file
        $fileName = "hair_$($h.id)_$dir.png"
        $filePath = Join-Path $outDir $fileName
        $canvas.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
        $canvas.Dispose()
        Write-Host "  -> Saved $fileName"
    }
    $masterBmp.Dispose()
}

# Also generate hair_none_*.png (empty transparent for bald option)
foreach ($dir in $dirs) {
    $canvas = New-Object System.Drawing.Bitmap($targetCanvasW, $targetCanvasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.Dispose()
    $filePath = Join-Path $outDir "hair_none_$dir.png"
    $canvas.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()
}

Write-Host "All 4 hairstyles (16 sprites) + none option generated successfully!"
