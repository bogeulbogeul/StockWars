Add-Type -AssemblyName System.Drawing

$bodyLeft = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_left.png")
$bodyRight = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_right.png")

# In Left view: Nose points LEFT. Front of face is MinX.
Write-Host "--- LEFT PROFILE (Facing Left) ---"
for ($y = 95; $y -le 130; $y += 5) {
    $minX = 999; $maxX = -1
    for ($x = 0; $x -lt $bodyLeft.Width; $x++) {
        if ($bodyLeft.GetPixel($x, $y).A -gt 30) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
    Write-Host "Y=$y : FaceFront(MinX)=$minX, Back(MaxX)=$maxX, W=$($maxX-$minX+1)"
}

# In Right view: Nose points RIGHT. Front of face is MaxX.
Write-Host "--- RIGHT PROFILE (Facing Right) ---"
for ($y = 95; $y -le 130; $y += 5) {
    $minX = 999; $maxX = -1
    for ($x = 0; $x -lt $bodyRight.Width; $x++) {
        if ($bodyRight.GetPixel($x, $y).A -gt 30) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
    Write-Host "Y=$y : Back(MinX)=$minX, FaceFront(MaxX)=$maxX, W=$($maxX-$minX+1)"
}

$bodyLeft.Dispose()
$bodyRight.Dispose()
