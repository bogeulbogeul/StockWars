Add-Type -AssemblyName System.Drawing

$testDir = "c:\Users\Administrator\Documents\GitHub\StockWars\scratch\test_hair_composites"
if (-not (Test-Path $testDir)) { New-Item -ItemType Directory -Path $testDir -Force }

$hairStyles = @(
    @{ id="bob";      file="media_1789463644338.png"; name="단발" },
    @{ id="long";     file="media_1789463644394.png"; name="롱" },
    @{ id="ponytail"; file="media_1789463644478.png"; name="포니테일" },
    @{ id="short";    file="media_1789463644510.png"; name="숏컷" }
)

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"
$dirs = @("front", "left", "back", "right")

# Let's load the fair base sprites
$bodySprites = @{}
$faceSprites = @{}
foreach ($d in $dirs) {
    $bodySprites[$d] = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_$d.png")
    $faceSprites[$d] = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\face_default_$d.png")
}

# Scale factor:
# In the master body sheet (1024x682), full body height is 613px, scaled to 282px in 240x340 canvas.
# Scale = 282.0 / 613.0 = ~0.46003
# The hair master sheet is also 1024px wide!
# So 1px in hair master sheet = 0.46003px on 240x340 canvas!

$masterScale = 282.0 / 613.0

foreach ($h in $hairStyles) {
    $bmp = New-Object System.Drawing.Bitmap((Join-Path $srcDir $h.file))
    $w = $bmp.Width
    $hVal = $bmp.Height
    $colW = [int]($w / 4) # 256

    for ($c = 0; $c -lt 4; $c++) {
        $dir = $dirs[$c]
        $x0 = $c * $colW
        $x1 = ($c + 1) * $colW - 1

        # Find bounds in this column
        $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1
        for ($x = $x0; $x -le $x1; $x++) {
            for ($y = 0; $y -lt $hVal; $y++) {
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

        # Crop hair piece
        $cropRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)
        $cropBmp = $bmp.Clone($cropRect, $bmp.PixelFormat)

        # Scale hair piece
        $destW = [int]([Math]::Round($cropW * $masterScale))
        $destH = [int]([Math]::Round($cropH * $masterScale))

        # Position hair on canvas:
        # In front view: head top is at Y=43, head center X=124
        # Hair apex should sit right above head top Y=36..42
        $destX = [int](124 - ($destW / 2))
        $destY = 38 # Top of hair sits naturally above head top Y=43

        if ($dir -eq "left") {
            $destX = [int](120 - ($destW / 2))
        } elseif ($dir -eq "right") {
            $destX = [int](120 - ($destW / 2))
        } elseif ($dir -eq "back") {
            $destX = [int](124 - ($destW / 2))
        }

        # Composite test
        $comp = New-Object System.Drawing.Bitmap(240, 340, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($comp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.Clear([System.Drawing.Color]::Transparent)

        # Draw base body
        $g.DrawImage($bodySprites[$dir], 0, 0, 240, 340)
        # Draw face (if not back)
        $g.DrawImage($faceSprites[$dir], 0, 0, 240, 340)
        # Draw hair
        $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
        $g.DrawImage($cropBmp, $destRect, (New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)), [System.Drawing.GraphicsUnit]::Pixel)
        $g.Dispose()

        $outName = "test_$($h.id)_$dir.png"
        $comp.Save((Join-Path $testDir $outName), [System.Drawing.Imaging.ImageFormat]::Png)
        $comp.Dispose()
        $cropBmp.Dispose()
    }
    $bmp.Dispose()
    Write-Host "Composited $($h.name) in all 4 directions."
}

foreach ($d in $dirs) {
    $bodySprites[$d].Dispose()
    $faceSprites[$d].Dispose()
}

Write-Host "Test composites generated in $testDir"
