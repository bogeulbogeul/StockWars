Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
$rigDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\rig"
if (-not (Test-Path $rigDir)) { New-Item -ItemType Directory -Path $rigDir -Force }

$skins = @("pale", "fair", "natural", "tan", "deep")
$dirs = @("front", "left", "back", "right")

# Helper function to crop and center onto target size
function Save-RigPart($srcBmp, $srcRect, $outPath, $outW, $outH) {
    $canvas = New-Object System.Drawing.Bitmap($outW, $outH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $outW, $outH)
    $g.DrawImage($srcBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $canvas.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $canvas.Dispose()
}

foreach ($skin in $skins) {
    foreach ($d in $dirs) {
        $bodyPath = Join-Path $baseDir "base_${skin}_${d}.png"
        if (-not (Test-Path $bodyPath)) { continue }

        $bmp = New-Object System.Drawing.Bitmap($bodyPath)

        # 1. Head (Y: 36 to 142)
        $headRect = New-Object System.Drawing.Rectangle(60, 36, 120, 106)
        if ($d -eq "left") { $headRect = New-Object System.Drawing.Rectangle(60, 36, 120, 106) }
        elseif ($d -eq "right") { $headRect = New-Object System.Drawing.Rectangle(60, 36, 120, 106) }
        Save-RigPart $bmp $headRect (Join-Path $rigDir "head_${skin}_${d}.png") 104 104

        # 2. Torso (Y: 140 to 196)
        $torsoRect = New-Object System.Drawing.Rectangle(96, 140, 48, 56)
        if ($d -eq "left") { $torsoRect = New-Object System.Drawing.Rectangle(98, 140, 44, 56) }
        elseif ($d -eq "right") { $torsoRect = New-Object System.Drawing.Rectangle(98, 140, 44, 56) }
        Save-RigPart $bmp $torsoRect (Join-Path $rigDir "torso_${skin}_${d}.png") 48 52

        # 3. Pelvis (Y: 196 to 226)
        $pelvisRect = New-Object System.Drawing.Rectangle(98, 196, 44, 30)
        if ($d -eq "left") { $pelvisRect = New-Object System.Drawing.Rectangle(100, 196, 40, 30) }
        elseif ($d -eq "right") { $pelvisRect = New-Object System.Drawing.Rectangle(100, 196, 40, 30) }
        Save-RigPart $bmp $pelvisRect (Join-Path $rigDir "pelvis_${skin}_${d}.png") 44 28

        # 4. Arms & Hands (Left & Right)
        if ($d -eq "front" -or $d -eq "back") {
            # Left Arm (on viewer's left: X=70..98)
            $armUpperL = New-Object System.Drawing.Rectangle(76, 148, 22, 34)
            $armLowerL = New-Object System.Drawing.Rectangle(72, 178, 20, 32)
            $handL     = New-Object System.Drawing.Rectangle(68, 206, 18, 22)
            Save-RigPart $bmp $armUpperL (Join-Path $rigDir "arm_upper_${skin}_${d}.png") 20 32
            Save-RigPart $bmp $armLowerL (Join-Path $rigDir "arm_lower_${skin}_${d}.png") 18 30
            Save-RigPart $bmp $handL     (Join-Path $rigDir "hand_${skin}_${d}.png") 16 16

            # Legs (Left & Right)
            $thighL = New-Object System.Drawing.Rectangle(96, 222, 24, 50)
            $calfL  = New-Object System.Drawing.Rectangle(94, 268, 22, 50)
            $footL  = New-Object System.Drawing.Rectangle(92, 314, 26, 18)
            Save-RigPart $bmp $thighL (Join-Path $rigDir "leg_thigh_${skin}_${d}.png") 24 50
            Save-RigPart $bmp $calfL  (Join-Path $rigDir "leg_calf_${skin}_${d}.png") 22 52
            Save-RigPart $bmp $footL  (Join-Path $rigDir "foot_${skin}_${d}.png") 24 18
        } else {
            # Profile views
            $armUpper = New-Object System.Drawing.Rectangle(104, 150, 22, 34)
            $armLower = New-Object System.Drawing.Rectangle(104, 180, 20, 32)
            $hand     = New-Object System.Drawing.Rectangle(104, 208, 18, 22)
            Save-RigPart $bmp $armUpper (Join-Path $rigDir "arm_upper_${skin}_${d}.png") 20 32
            Save-RigPart $bmp $armLower (Join-Path $rigDir "arm_lower_${skin}_${d}.png") 18 30
            Save-RigPart $bmp $hand     (Join-Path $rigDir "hand_${skin}_${d}.png") 16 16

            $thigh = New-Object System.Drawing.Rectangle(104, 222, 26, 50)
            $calf  = New-Object System.Drawing.Rectangle(104, 268, 24, 50)
            $foot  = New-Object System.Drawing.Rectangle(100, 314, 28, 18)
            Save-RigPart $bmp $thigh (Join-Path $rigDir "leg_thigh_${skin}_${d}.png") 24 50
            Save-RigPart $bmp $calf  (Join-Path $rigDir "leg_calf_${skin}_${d}.png") 22 52
            Save-RigPart $bmp $foot  (Join-Path $rigDir "foot_${skin}_${d}.png") 24 18
        }

        $bmp.Dispose()
    }
}

# 5. Create hair_back transparent placeholders
$hairs = @("short", "bob", "long", "ponytail", "none")
foreach ($h in $hairs) {
    foreach ($d in $dirs) {
        $canvas = New-Object System.Drawing.Bitmap(120, 120, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($canvas)
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.Dispose()
        $canvas.Save((Join-Path $rigDir "hair_back_${h}_${d}.png"), [System.Drawing.Imaging.ImageFormat]::Png)
        $canvas.Dispose()
    }
}

Write-Host "All skeletal rig body parts sliced successfully into $rigDir"
