Add-Type -AssemblyName System.Drawing

$maleFront = [System.Drawing.Bitmap]::FromFile("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\male_base_front.png")
Write-Host "Male Base Front size: $($maleFront.Width) x $($maleFront.Height)"

$minX = 9999; $maxX = 0; $minY = 9999; $maxY = 0
for ($y = 0; $y -lt $maleFront.Height; $y++) {
    for ($x = 0; $x -lt $maleFront.Width; $x++) {
        $p = $maleFront.GetPixel($x, $y)
        if ($p.A -gt 20) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
Write-Host "Male non-transparent box: X=[$minX, $maxX] (W=$($maxX-$minX+1)), Y=[$minY, $maxY] (H=$($maxY-$minY+1))"
$maleFront.Dispose()
