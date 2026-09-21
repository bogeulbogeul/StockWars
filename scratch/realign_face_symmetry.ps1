Add-Type -AssemblyName System.Drawing

$faceSrc = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789461632227.png"
$faceBmp = New-Object System.Drawing.Bitmap($faceSrc)

$outDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"

$targetCanvasW = 240
$targetCanvasH = 340
$destY = 95
$destH = 40

# 1. Front Face Decal: Perfectly Centered on Head at X=93 (Head center X=124)
$frontCanvas = New-Object System.Drawing.Bitmap($targetCanvasW, $targetCanvasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($frontCanvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

$cropFront = New-Object System.Drawing.Rectangle(57, 102, 202, 128)
$destRectFront = New-Object System.Drawing.Rectangle(93, $destY, 62, $destH)
$g.DrawImage($faceBmp, $destRectFront, $cropFront, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$frontPath = Join-Path $outDir "face_default_front.png"
$frontCanvas.Save($frontPath, [System.Drawing.Imaging.ImageFormat]::Png)
$frontCanvas.Dispose()
Write-Host "Saved Centered Front Face: $frontPath (X=93)"

# 2. Left Face Decal: X=86 (Nose at X=78, Eye at X=86, Distance=8px)
$leftCanvas = New-Object System.Drawing.Bitmap($targetCanvasW, $targetCanvasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($leftCanvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

$cropLeft = New-Object System.Drawing.Rectangle(377, 101, 57, 129)
$destRectLeft = New-Object System.Drawing.Rectangle(86, $destY, 18, $destH)
$g.DrawImage($faceBmp, $destRectLeft, $cropLeft, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$leftPath = Join-Path $outDir "face_default_left.png"
$leftCanvas.Save($leftPath, [System.Drawing.Imaging.ImageFormat]::Png)
$leftCanvas.Dispose()
Write-Host "Saved Symmetrical Left Face: $leftPath (X=86)"

# 3. Back Face Decal: Transparent Empty
$backCanvas = New-Object System.Drawing.Bitmap($targetCanvasW, $targetCanvasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($backCanvas)
$g.Clear([System.Drawing.Color]::Transparent)
$g.Dispose()

$backPath = Join-Path $outDir "face_default_back.png"
$backCanvas.Save($backPath, [System.Drawing.Imaging.ImageFormat]::Png)
$backCanvas.Dispose()
Write-Host "Saved Back Face: $backPath"

# 4. Right Face Decal: X=134 (Nose at X=158, Eye at X=150, Distance=8px)
$rightCanvas = New-Object System.Drawing.Bitmap($targetCanvasW, $targetCanvasH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($rightCanvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

$cropRight = New-Object System.Drawing.Rectangle(898, 101, 55, 129)
$destRectRight = New-Object System.Drawing.Rectangle(134, $destY, 18, $destH)
$g.DrawImage($faceBmp, $destRectRight, $cropRight, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$rightPath = Join-Path $outDir "face_default_right.png"
$rightCanvas.Save($rightPath, [System.Drawing.Imaging.ImageFormat]::Png)
$rightCanvas.Dispose()
Write-Host "Saved Symmetrical Right Face: $rightPath (X=134)"

$faceBmp.Dispose()
Write-Host "Front centered & left-right symmetrical face sprites generated successfully!"
