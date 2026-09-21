Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"
$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
$testDir = "c:\Users\Administrator\Documents\GitHub\StockWars\scratch\test_hair_composites"

$bodySprites = @{
    "left" = New-Object System.Drawing.Bitmap((Join-Path $outDir "base_fair_left.png"));
    "right" = New-Object System.Drawing.Bitmap((Join-Path $outDir "base_fair_right.png"))
}
$faceSprites = @{
    "left" = New-Object System.Drawing.Bitmap((Join-Path $outDir "face_default_left.png"));
    "right" = New-Object System.Drawing.Bitmap((Join-Path $outDir "face_default_right.png"))
}

$bmp = New-Object System.Drawing.Bitmap((Join-Path $srcDir "media_1789463644478.png"))

# Segment 1 (left) is X: 249..509, Segment 3 (right) is X: 741..1004
$configs = @(
    @{ dir="left"; x0=249; x1=509; scale=0.55; destX=54; destY=18 },
    @{ dir="right"; x0=741; x1=1004; scale=0.57; destX=52; destY=18 }
)

foreach ($cfg in $configs) {
    $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
    for ($x = $cfg.x0; $x -le $cfg.x1; $x++) {
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

    $destW = [int]([Math]::Round($cropW * $cfg.scale))
    $destH = [int]([Math]::Round($cropH * $cfg.scale))

    $canvas = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $destRect = New-Object System.Drawing.Rectangle($cfg.destX, $cfg.destY, $destW, $destH)
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
    $g.DrawImage($cropBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # Save to character dir
    $hairFileName = "hair_ponytail_" + $cfg.dir + ".png"
    $canvas.Save((Join-Path $outDir $hairFileName), [System.Drawing.Imaging.ImageFormat]::Png)

    # Composite check
    $comp = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gc = [System.Drawing.Graphics]::FromImage($comp)
    $gc.Clear([System.Drawing.Color]::Transparent)
    $gc.DrawImage($bodySprites[$cfg.dir], 0, 0, 240, 340)
    $gc.DrawImage($faceSprites[$cfg.dir], 0, 0, 240, 340)
    $gc.DrawImage($canvas, 0, 0, 240, 340)
    $gc.Dispose()

    $compName = "comp_ponytail_" + $cfg.dir + ".png"
    $comp.Save((Join-Path $testDir $compName), [System.Drawing.Imaging.ImageFormat]::Png)
    $comp.Dispose()

    $canvas.Dispose()
    $cropBmp.Dispose()
}

$bmp.Dispose()
$bodySprites["left"].Dispose()
$bodySprites["right"].Dispose()
$faceSprites["left"].Dispose()
$faceSprites["right"].Dispose()

Write-Host "Updated ponytail side composites!"
