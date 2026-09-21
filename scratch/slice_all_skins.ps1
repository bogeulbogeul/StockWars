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
$targetCharH = 285 # Standard chibi character height

$dirs = @("front", "right", "back", "left")

function Process-SpriteSheet($skinInfo) {
    $srcPath = Join-Path $srcDir $skinInfo.file
    $bmp = New-Object System.Drawing.Bitmap($srcPath)
    $w = $bmp.Width
    $h = $bmp.Height
    $colW = [int]($w / 4) # 256

    for ($c = 0; $c -lt 4; $c++) {
        $dir = $dirs[$c]
        $x0 = $c * $colW
        $x1 = [Math]::Min($x0 + $colW - 1, $w - 1)

        # 1. First pass: find character bounding box in this column (excluding white and letterbox black)
        $minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0

        for ($x = $x0; $x -le $x1; $x++) {
            for ($y = 0; $y -lt $h; $y++) {
                $p = $bmp.GetPixel($x, $y)
                $isBlack = ($p.R -lt 25 -and $p.G -lt 25 -and $p.B -lt 25)
                $minVal = [Math]::Min($p.R, [Math]::Min($p.G, $p.B))
                $maxVal = [Math]::Max($p.R, [Math]::Max($p.G, $p.B))
                $isWhite = ($minVal -gt 238) -and (($maxVal - $minVal) -lt 15)

                if (-not $isBlack -and -not $isWhite) {
                    if ($x -lt $minX) { $minX = $x }
                    if ($x -gt $maxX) { $maxX = $x }
                    if ($y -lt $minY) { $minY = $y }
                    if ($y -gt $maxY) { $maxY = $y }
                }
            }
        }

        if ($minX -ge $maxX -or $minY -ge $maxY) {
            Write-Warning "Could not find bounds for $($skinInfo.name) $dir"
            continue
        }

        # Add small safety padding for anti-aliasing
        $pad = 2
        $cropX = [Math]::Max($x0, $minX - $pad)
        $cropY = [Math]::Max(0, $minY - $pad)
        $cropW = [Math]::Min($w - $cropX, ($maxX - $minX + 1) + ($pad * 2))
        $cropH = [Math]::Min($h - $cropY, ($maxY - $minY + 1) + ($pad * 2))

        # 2. Extract and remove white background
        $cleanCharBmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        for ($cx = 0; $cx -lt $cropW; $cx++) {
            for ($cy = 0; $cy -lt $cropH; $cy++) {
                $px = $cropX + $cx
                $py = $cropY + $cy
                $p = $bmp.GetPixel($px, $py)

                $minVal = [Math]::Min($p.R, [Math]::Min($p.G, $p.B))
                $maxVal = [Math]::Max($p.R, [Math]::Max($p.G, $p.B))
                $isNearWhite = ($minVal -gt 240) -and (($maxVal - $minVal) -lt 15)
                $isBlack = ($p.R -lt 25 -and $p.G -lt 25 -and $p.B -lt 25)

                if ($isNearWhite -or $isBlack) {
                    $cleanCharBmp.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                } elseif ($minVal -gt 215 -and (($maxVal - $minVal) -lt 25)) {
                    $alpha = [int](255 * (240 - $minVal) / 25.0)
                    if ($alpha -lt 0) { $alpha = 0 }
                    if ($alpha -gt 255) { $alpha = 255 }
                    $cleanCharBmp.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
                } else {
                    $cleanCharBmp.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb(255, $p.R, $p.G, $p.B))
                }
            }
        }

        # 3. Fit onto 240x340 canvas aligned to feet
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
        $g.DrawImage($cleanCharBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $g.Dispose()
        $cleanCharBmp.Dispose()

        # Save skin-specific file
        $skinOutFile = "male_base_$($skinInfo.name)_$dir.png"
        $skinOutPath = Join-Path $outDir $skinOutFile
        $canvas.Save($skinOutPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Generated: $skinOutFile"

        # If this is the default/fair skin (or default), also update male_base_{dir}.png and male_{dir}.png
        if ($skinInfo.name -eq "fair") {
            $defaultBase = Join-Path $outDir "male_base_$dir.png"
            $defaultChar = Join-Path $outDir "male_$dir.png"
            $canvas.Save($defaultBase, [System.Drawing.Imaging.ImageFormat]::Png)
            $canvas.Save($defaultChar, [System.Drawing.Imaging.ImageFormat]::Png)
            Write-Host "Updated default: male_base_$dir.png & male_$dir.png"
        }

        $canvas.Dispose()
    }

    $bmp.Dispose()
}

foreach ($skin in $skinMap) {
    Write-Host "=== Processing Skin Tone: $($skin.title) ==="
    Process-SpriteSheet($skin)
}

Write-Host "All male skin tones sliced and generated successfully!"
