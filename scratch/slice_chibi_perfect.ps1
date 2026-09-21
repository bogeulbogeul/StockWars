Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
$rigDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\rig"

$skins = @("pale", "fair", "natural", "tan", "deep")
$dirs = @("front", "left", "back", "right")

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

        # 1. Head (Y: 50 to 155, X: 60 to 180) -> 120 x 105
        Crop-Exact $bmp (New-Object System.Drawing.Rectangle(60, 50, 120, 105)) (Join-Path $rigDir "head_${skin}_${d}.png")

        # 2. Torso (Y: 154 to 205, X: 85 to 155) -> 70 x 51
        Crop-Exact $bmp (New-Object System.Drawing.Rectangle(85, 154, 70, 51)) (Join-Path $rigDir "torso_${skin}_${d}.png")

        # 3. Pelvis (Y: 204 to 236, X: 90 to 150) -> 60 x 32
        Crop-Exact $bmp (New-Object System.Drawing.Rectangle(90, 204, 60, 32)) (Join-Path $rigDir "pelvis_${skin}_${d}.png")

        # 4. Arms & Legs
        if ($d -eq "front" -or $d -eq "back") {
            # Left Arm (Viewer's left: X=66..94)
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(68, 158, 26, 34)) (Join-Path $rigDir "arm_upper_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(66, 188, 24, 30)) (Join-Path $rigDir "arm_lower_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(64, 214, 22, 22)) (Join-Path $rigDir "hand_${skin}_${d}.png")

            # Left Leg (Viewer's left: X=90..118)
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(90, 230, 26, 46)) (Join-Path $rigDir "leg_thigh_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(88, 270, 24, 46)) (Join-Path $rigDir "leg_calf_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(86, 310, 28, 18)) (Join-Path $rigDir "foot_${skin}_${d}.png")
        } else {
            # Profile (left / right)
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(102, 158, 28, 34)) (Join-Path $rigDir "arm_upper_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(102, 188, 26, 30)) (Join-Path $rigDir "arm_lower_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(102, 214, 24, 22)) (Join-Path $rigDir "hand_${skin}_${d}.png")

            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(100, 230, 28, 46)) (Join-Path $rigDir "leg_thigh_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(100, 270, 26, 46)) (Join-Path $rigDir "leg_calf_${skin}_${d}.png")
            Crop-Exact $bmp (New-Object System.Drawing.Rectangle(96, 310, 30, 18)) (Join-Path $rigDir "foot_${skin}_${d}.png")
        }

        $bmp.Dispose()
    }
}

Write-Host "Sliced all chibi rig parts perfectly!"
