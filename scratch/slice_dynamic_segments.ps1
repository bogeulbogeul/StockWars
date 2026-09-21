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
$targetCharH = 282

$dirNames = @("front", "right", "back", "left")

foreach ($skin in $skinMap) {
    $srcPath = Join-Path $srcDir $skin.file
    $bmp = New-Object System.Drawing.Bitmap($srcPath)
    $w = $bmp.Width
    $h = $bmp.Height

    Write-Host "=== Processing $($skin.title) ($($skin.file)) ==="

    # 1. Compute vertical projection
    $proj = New-Object 'int[]' $w
    for ($x = 0; $x -lt $w; $x++) {
        $count = 0
        for ($y = 0; $y -lt $h; $y++) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.A -gt 25) { $count++ }
        }
        $proj[$x] = $count
    }

    # 2. Find the 4 segments (islands of non-zero projection)
    $segments = New-Object System.Collections.ArrayList
    $inSeg = $false
    $segStart = 0
    for ($x = 0; $x -lt $w; $x++) {
        if ($proj[$x] -gt 0 -and -not $inSeg) {
            $inSeg = $true
            $segStart = $x
        } elseif ($proj[$x] -eq 0 -and $inSeg) {
            $inSeg = $false
            if ($x - $segStart -gt 20) { # Filter out noise
                $segments.Add(@{ x0 = $segStart; x1 = $x - 1 }) | Out-Null
            }
        }
    }
    if ($inSeg -and ($w - $segStart -gt 20)) {
        $segments.Add(@{ x0 = $segStart; x1 = $w - 1 }) | Out-Null
    }

    Write-Host "Found $($segments.Count) character segments in $($skin.title)"

    if ($segments.Count -ne 4) {
        Write-Warning "Expected 4 segments, but found $($segments.Count). Adjusting..."
    }

    for ($i = 0; $i -lt [Math]::Min(4, $segments.Count); $i++) {
        $seg = $segments[$i]
        $dir = $dirNames[$i]
        $x0 = $seg.x0
        $x1 = $seg.x1

        # Find exact Y bounds in this segment
        $minY = 9999; $maxY = 0
        $minX = 9999; $maxX = 0
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

        $cropW = $maxX - $minX + 1
        $cropH = $maxY - $minY + 1

        # Extract clean crop
        $cropBmp = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        for ($cx = 0; $cx -lt $cropW; $cx++) {
            for ($cy = 0; $cy -lt $cropH; $cy++) {
                $p = $bmp.GetPixel($minX + $cx, $minY + $cy)
                if ($p.A -lt 25) {
                    $cropBmp.SetPixel($cx, $cy, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                } else {
                    $cropBmp.SetPixel($cx, $cy, $p)
                }
            }
        }

        # Scale and fit on 240x340
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

        # Save skin file
        $skinOut = "male_base_$($skin.name)_$dir.png"
        $skinPath = Join-Path $outDir $skinOut
        $canvas.Save($skinPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "  -> Saved $skinOut"

        # Update default
        if ($skin.name -eq "fair") {
            $defBase = Join-Path $outDir "male_base_$dir.png"
            $defChar = Join-Path $outDir "male_$dir.png"
            $canvas.Save($defBase, [System.Drawing.Imaging.ImageFormat]::Png)
            $canvas.Save($defChar, [System.Drawing.Imaging.ImageFormat]::Png)
            Write-Host "  -> Updated default male_base_$dir.png"
        }

        $canvas.Dispose()
    }
    $bmp.Dispose()
}

Write-Host "Complete dynamic slice finished for all 5 skins!"
