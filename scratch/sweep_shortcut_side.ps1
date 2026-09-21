Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"
$testDir = "c:\Users\Administrator\Documents\GitHub\StockWars\scratch\test_hair_composites"
if (-not (Test-Path $testDir)) { New-Item -ItemType Directory -Path $testDir -Force }

$bmp = New-Object System.Drawing.Bitmap((Join-Path $srcDir "media_1789463644510.png"))

# Test parameter sweep for Shortcut Left & Right
# For Left:
# Segment 1: X from 262 to 506.
# We want to test destX around 70..76, scale around 0.48..0.52, destY around 34..38
$testConfigs = @(
    @{ name="left_test1"; dir="left"; x0=262; x1=506; scale=0.48; destX=68; destY=34 },
    @{ name="left_test2"; dir="left"; x0=262; x1=506; scale=0.50; destX=70; destY=34 },
    @{ name="left_test3"; dir="left"; x0=262; x1=506; scale=0.50; destX=72; destY=34 },
    @{ name="left_test4"; dir="left"; x0=262; x1=506; scale=0.50; destX=74; destY=34 },
    @{ name="left_test5"; dir="left"; x0=262; x1=506; scale=0.52; destX=74; destY=32 },
    
    @{ name="right_test1"; dir="right"; x0=774; x1=1015; scale=0.48; destX=54; destY=34 },
    @{ name="right_test2"; dir="right"; x0=774; x1=1015; scale=0.50; destX=52; destY=34 },
    @{ name="right_test3"; dir="right"; x0=774; x1=1015; scale=0.50; destX=50; destY=34 },
    @{ name="right_test4"; dir="right"; x0=774; x1=1015; scale=0.50; destX=48; destY=34 },
    @{ name="right_test5"; dir="right"; x0=774; x1=1015; scale=0.52; destX=48; destY=32 }
)

foreach ($cfg in $testConfigs) {
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

    # Canvas
    $canvas = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $destRect = New-Object System.Drawing.Rectangle($cfg.destX, $cfg.destY, $destW, $destH)
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
    $g.DrawImage($cropBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # Load base body & face
    $body = New-Object System.Drawing.Bitmap((Join-Path $baseDir ("base_fair_" + $cfg.dir + ".png")))
    $face = New-Object System.Drawing.Bitmap((Join-Path $baseDir ("face_default_" + $cfg.dir + ".png")))

    $comp = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gc = [System.Drawing.Graphics]::FromImage($comp)
    $gc.Clear([System.Drawing.Color]::Transparent)
    $gc.DrawImage($body, 0, 0, 240, 340)
    $gc.DrawImage($face, 0, 0, 240, 340)
    $gc.DrawImage($canvas, 0, 0, 240, 340)
    $gc.Dispose()

    $comp.Save((Join-Path $testDir ($cfg.name + ".png")), [System.Drawing.Imaging.ImageFormat]::Png)
    $comp.Dispose()
    $canvas.Dispose()
    $cropBmp.Dispose()
    $body.Dispose()
    $face.Dispose()
}

$bmp.Dispose()
Write-Host "Generated test sweep composites!"
