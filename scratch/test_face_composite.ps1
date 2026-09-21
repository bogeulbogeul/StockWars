Add-Type -AssemblyName System.Drawing

$faceSrc = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789461632227.png"
$faceBmp = New-Object System.Drawing.Bitmap($faceSrc)

$bodyFront = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_front.png")
$bodyLeft = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_left.png")
$bodyRight = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_right.png")

Write-Host "Body canvas size: $($bodyFront.Width) x $($bodyFront.Height)"

# In bodyFront:
# Head is X=[74, 166], CenterX=120. Width of head = 93px.
# Head Y=[42, 136], Height of head = 95px.
# In faceSrc (Front decal X: 57..258, W=202, Y: 102..229, H=128):
# Decal width should fit inside head width (e.g. ~64px wide, ~40px high)
# Let's test a scaling factor:
# Head width is 93px. Decal width of ~62px is ~66% of head width (classic chibi proportions).
# Scale = 62 / 202 = ~0.307
# Face height = 128 * 0.307 = ~39.3px
# Face Top Y: Eye top around Y=78, Mouth bottom around Y=118.

$destW = 62
$destH = 40
$destX = [int]((240 - $destW) / 2) # 89
$destY = 80 # Y from 80 to 120

# Test Composite Front
$compFront = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($compFront)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

$g.DrawImage($bodyFront, 0, 0, 240, 340)

# Crop Front Decal
$cropFront = New-Object System.Drawing.Rectangle(57, 102, 202, 128)
$destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
$g.DrawImage($faceBmp, $destRect, $cropFront, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$testOut = "c:\Users\Administrator\Documents\GitHub\StockWars\scratch\test_composite_front.png"
$compFront.Save($testOut, [System.Drawing.Imaging.ImageFormat]::Png)
$compFront.Dispose()
Write-Host "Saved test front composite: $testOut (X=$destX, Y=$destY, W=$destW, H=$destH)"

$faceBmp.Dispose()
$bodyFront.Dispose()
$bodyLeft.Dispose()
$bodyRight.Dispose()
