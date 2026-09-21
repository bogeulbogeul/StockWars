Add-Type -AssemblyName System.Drawing

$faceSrc = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789461632227.png"
$faceBmp = New-Object System.Drawing.Bitmap($faceSrc)

$bodyLeft = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_left.png")
$bodyRight = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_right.png")

# Left Decal: X: 377..433 (W=57), Y: 101..229 (H=129)
# Height scale ~ 40px (same scale as front face: 40 / 129 ~ 0.31)
# Width = 57 * 0.31 ~ 18px
$destHL = 40
$destWL = 18
$destYL = 80
$destXL = 84 # Eye at ~84..96, mouth at ~84..88

# Test Composite Left
$compLeft = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($compLeft)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($bodyLeft, 0, 0, 240, 340)

$cropLeft = New-Object System.Drawing.Rectangle(377, 101, 57, 129)
$destRectL = New-Object System.Drawing.Rectangle($destXL, $destYL, $destWL, $destHL)
$g.DrawImage($faceBmp, $destRectL, $cropLeft, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$testOutL = "c:\Users\Administrator\Documents\GitHub\StockWars\scratch\test_composite_left.png"
$compLeft.Save($testOutL, [System.Drawing.Imaging.ImageFormat]::Png)
$compLeft.Dispose()
Write-Host "Saved Left Composite: $testOutL (X=$destXL, Y=$destYL, W=$destWL, H=$destHL)"

# Right Decal: X: 898..952 (W=55), Y: 101..229 (H=129)
$destHR = 40
$destWR = 18
$destYR = 80
$destXR = 240 - $destXL - $destWR # 138 (symmetrical)

$compRight = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($compRight)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($bodyRight, 0, 0, 240, 340)

$cropRight = New-Object System.Drawing.Rectangle(898, 101, 55, 129)
$destRectR = New-Object System.Drawing.Rectangle($destXR, $destYR, $destWR, $destHR)
$g.DrawImage($faceBmp, $destRectR, $cropRight, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$testOutR = "c:\Users\Administrator\Documents\GitHub\StockWars\scratch\test_composite_right.png"
$compRight.Save($testOutR, [System.Drawing.Imaging.ImageFormat]::Png)
$compRight.Dispose()
Write-Host "Saved Right Composite: $testOutR (X=$destXR, Y=$destYR, W=$destWR, H=$destHR)"

$faceBmp.Dispose()
$bodyLeft.Dispose()
$bodyRight.Dispose()
