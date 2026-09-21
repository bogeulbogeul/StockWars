Add-Type -AssemblyName System.Drawing

$femaleFront = [System.Drawing.Bitmap]::FromFile("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\female_base_front.png")
Write-Host "Female Base Front size: $($femaleFront.Width) x $($femaleFront.Height)"

$minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0
for ($y = 0; $y -lt $femaleFront.Height; $y++) {
    for ($x = 0; $x -lt $femaleFront.Width; $x++) {
        $p = $femaleFront.GetPixel($x, $y)
        if ($p.A -gt 20) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
Write-Host "Female non-transparent box: X=[$minX, $maxX] (W=$($maxX-$minX+1)), Y=[$minY, $maxY] (H=$($maxY-$minY+1))"
$femaleFront.Dispose()
