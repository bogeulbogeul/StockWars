Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"
$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
$testDir = "c:\Users\Administrator\Documents\GitHub\StockWars\scratch\test_hair_composites"
if (-not (Test-Path $testDir)) { New-Item -ItemType Directory -Path $testDir -Force }

$bmp = New-Object System.Drawing.Bitmap((Join-Path $srcDir "media_1789463644510.png"))

$dirs = @(
    @{ dir="front"; x0=5;   x1=247;  scale=0.48; destX=65; destY=36 },
    @{ dir="left";  x0=262; x1=506;  scale=0.50; destX=71; destY=34 },
    @{ dir="back";  x0=518; x1=761;  scale=0.48; destX=61; destY=36 },
    @{ dir="right"; x0=774; x1=1015; scale=0.50; destX=50; destY=34 }
)

foreach ($d in $dirs) {
    $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
    for ($x = $d.x0; $x -le $d.x1; $x++) {
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

    $destW = [int]([Math]::Round($cropW * $d.scale))
    $destH = [int]([Math]::Round($cropH * $d.scale))

    # High quality canvas
    $canvas = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $destRect = New-Object System.Drawing.Rectangle($d.destX, $d.destY, $destW, $destH)
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
    $g.DrawImage($cropBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # Save to web/assets/character
    $hairFileName = "hair_short_" + $d.dir + ".png"
    $hairFilePath = Join-Path $outDir $hairFileName
    $canvas.Save($hairFilePath, [System.Drawing.Imaging.ImageFormat]::Png)

    # Composite check
    $body = New-Object System.Drawing.Bitmap((Join-Path $outDir ("base_fair_" + $d.dir + ".png")))
    $face = New-Object System.Drawing.Bitmap((Join-Path $outDir ("face_default_" + $d.dir + ".png")))

    $comp = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gc = [System.Drawing.Graphics]::FromImage($comp)
    $gc.Clear([System.Drawing.Color]::Transparent)
    $gc.DrawImage($body, 0, 0, 240, 340)
    $gc.DrawImage($face, 0, 0, 240, 340)
    $gc.DrawImage($canvas, 0, 0, 240, 340)
    $gc.Dispose()

    $compName = "comp_perfect_short_" + $d.dir + ".png"
    $comp.Save((Join-Path $testDir $compName), [System.Drawing.Imaging.ImageFormat]::Png)
    $comp.Dispose()

    $canvas.Dispose()
    $cropBmp.Dispose()
    $body.Dispose()
    $face.Dispose()

    Write-Host ("Saved " + $hairFileName + " (" + $destW + "x" + $destH + " at X=" + $d.destX + ", Y=" + $d.destY + ")")
}

$bmp.Dispose()
Write-Host "Perfected 4 directions of Shortcut Hair!"
