Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
$rigDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\rig"
if (-not (Test-Path $rigDir)) { New-Item -ItemType Directory -Path $rigDir -Force }

$skins = @("pale", "fair", "natural", "tan", "deep")
$dirs = @("front", "left", "back", "right")

# Helper function to crop exact 1:1 rectangle without scaling
function Crop-Exact($srcBmp, [System.Drawing.Rectangle]$rect, $outPath) {
    $canvas = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.Clear([System.Drawing.Color]::Transparent)

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $rect.Width, $rect.Height)
    $g.DrawImage($srcBmp, $destRect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()
}

foreach ($skin in $skins) {
    foreach ($d in $dirs) {
        $bodyPath = Join-Path $baseDir "base_${skin}_${d}.png"
        if (-not (Test-Path $bodyPath)) { continue }

        $bmp = New-Object System.Drawing.Bitmap($bodyPath)

        # 1. Head (1:1 crop from Y: 20 to 142, X: 50 to 190) -> 140x122
        $headRect = New-Object System.Drawing.Rectangle(50, 20, 140, 122)
        Crop-Exact $bmp $headRect (Join-Path $rigDir "head_${skin}_${d}.png")

        # 2. Torso (1:1 crop from Y: 136 to 196, X: 90 to 150) -> 60x60
        $torsoRect = New-Object System.Drawing.Rectangle(90, 136, 60, 60)
        Crop-Exact $bmp $torsoRect (Join-Path $rigDir "torso_${skin}_${d}.png")

        # 3. Pelvis (1:1 crop from Y: 194 to 226, X: 92 to 148) -> 56x32
        $pelvisRect = New-Object System.Drawing.Rectangle(92, 194, 56, 32)
        Crop-Exact $bmp $pelvisRect (Join-Path $rigDir "pelvis_${skin}_${d}.png")

        # 4. Arms (Upper, Lower, Hand)
        if ($d -eq "front" -or $d -eq "back") {
            # Left side
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(76, 150, 24, 34)) (Join-Path $rigDir "arm_upper_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(72, 178, 22, 32)) (Join-Path $rigDir "arm_lower_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(68, 206, 20, 22)) (Join-Path $rigDir "hand_${skin}_${d}.png")

            # Legs
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(96, 218, 24, 52)) (Join-Path $rigDir "leg_thigh_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(94, 266, 22, 52)) (Join-Path $rigDir "leg_calf_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(92, 312, 26, 20)) (Join-Path $rigDir "foot_${skin}_${d}.png")
        } else {
            # Profile (left / right)
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(100, 150, 28, 34)) (Join-Path $rigDir "arm_upper_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(100, 178, 26, 32)) (Join-Path $rigDir "arm_lower_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(100, 206, 24, 22)) (Join-Path $rigDir "hand_${skin}_${d}.png")

            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(102, 218, 28, 52)) (Join-Path $rigDir "leg_thigh_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(102, 266, 26, 52)) (Join-Path $rigDir "leg_calf_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(98, 312, 30, 20)) (Join-Path $rigDir "foot_${skin}_${d}.png")
        }

        $bmp.Dispose()
    }
}

Write-Host "Rig parts successfully sliced 1:1!"
