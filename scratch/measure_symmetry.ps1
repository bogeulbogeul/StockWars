Add-Type -AssemblyName System.Drawing

$faceSrc = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789461632227.png"
$faceBmp = New-Object System.Drawing.Bitmap($faceSrc)

$bodyFront = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_front.png")
$bodyLeft = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_left.png")
$bodyRight = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_right.png")

# 1. Front Head Symmetry in bodyFront
Write-Host "--- FRONT BODY HEAD SYMMETRY ---"
for ($y = 80; $y -le 130; $y += 10) {
    $minX = 999; $maxX = -1
    for ($x = 0; $x -lt $bodyFront.Width; $x++) {
        if ($bodyFront.GetPixel($x, $y).A -gt 30) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
    $cx = ($minX + $maxX) / 2.0
    Write-Host "Y=$y : MinX=$minX, MaxX=$maxX, CenterX=$cx"
}

# 2. Front Face Decal Features in faceBmp (X: 50..260, Y: 100..230)
Write-Host "--- FRONT FACE DECAL FEATURE CENTERS ---"
# Find left eye bounds (around X: 50..130) and right eye bounds (around X: 180..260) and mouth (around X: 130..180, Y > 190)
$leftEyeMinX = 999; $leftEyeMaxX = -1
$rightEyeMinX = 999; $rightEyeMaxX = -1
$mouthMinX = 999; $mouthMaxX = -1

for ($x = 50; $x -le 260; $x++) {
    for ($y = 100; $y -le 230; $y++) {
        $p = $faceBmp.GetPixel($x, $y)
        if ($p.A -gt 30) {
            if ($x -lt 130) {
                if ($x -lt $leftEyeMinX) { $leftEyeMinX = $x }
                if ($x -gt $leftEyeMaxX) { $leftEyeMaxX = $x }
            } elseif ($x -gt 180) {
                if ($x -lt $rightEyeMinX) { $rightEyeMinX = $x }
                if ($x -gt $rightEyeMaxX) { $rightEyeMaxX = $x }
            } elseif ($y -gt 190) {
                if ($x -lt $mouthMinX) { $mouthMinX = $x }
                if ($x -gt $mouthMaxX) { $mouthMaxX = $x }
            }
        }
    }
}

$cxLeftEye = ($leftEyeMinX + $leftEyeMaxX) / 2.0
$cxRightEye = ($rightEyeMinX + $rightEyeMaxX) / 2.0
$cxMouth = ($mouthMinX + $mouthMaxX) / 2.0
$cxEyes = ($cxLeftEye + $cxRightEye) / 2.0

Write-Host "Left Eye X: [$leftEyeMinX, $leftEyeMaxX], Center: $cxLeftEye"
Write-Host "Right Eye X: [$rightEyeMinX, $rightEyeMaxX], Center: $cxRightEye"
Write-Host "Mouth X: [$mouthMinX, $mouthMaxX], Center: $cxMouth"
Write-Host "True Eyes Center X in raw sheet: $cxEyes"
Write-Host "Crop Box Midpoint in raw sheet: $((57 + 258) / 2.0)"
Write-Host "Offset between crop box and true eye center: $($cxEyes - ((57 + 258) / 2.0)) px in raw sheet"

$faceBmp.Dispose()
$bodyFront.Dispose()
$bodyLeft.Dispose()
$bodyRight.Dispose()
