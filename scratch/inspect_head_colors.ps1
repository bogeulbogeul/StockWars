Add-Type -AssemblyName System.Drawing

# Let's inspect what colors make up the outline and skin in base_fair_left.png
$bmp = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_left.png")

# Sample outline color around top head
$outlineColors = @()
for ($y = 45; $y -le 80; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 200 -and $p.R -lt 90 -and $p.G -lt 60) {
            $outlineColors += $p
            break
        }
    }
}

$avgR = [int](($outlineColors | Measure-Object -Property R -Average).Average)
$avgG = [int](($outlineColors | Measure-Object -Property G -Average).Average)
$avgB = [int](($outlineColors | Measure-Object -Property B -Average).Average)
Write-Host "Average outline color: R=$avgR, G=$avgG, B=$avgB"

# Sample skin fill color inside head
$skinP = $bmp.GetPixel(120, 70)
Write-Host "Skin color at (120,70): R=$($skinP.R), G=$($skinP.G), B=$($skinP.B)"

$bmp.Dispose()
