Add-Type -AssemblyName System.Drawing

$src = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_left.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "Canvas size: $($bmp.Width) x $($bmp.Height)"

# In base_fair_left.png, find the outline of the head (Y from 40 to 120, X from 20 to 220)
$points = @()
for ($y = 40; $y -le 130; $y++) {
    $minX = 999; $maxX = -1
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        if ($bmp.GetPixel($x, $y).A -gt 20) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
    if ($minX -lt 999) {
        $points += @{ y=$y; leftX=$minX; rightX=$maxX; width=($maxX - $minX + 1) }
    }
}

foreach ($pt in $points) {
    if ($pt.y % 2 -eq 0) {
        Write-Host ([string]::Format("Y={0,3} : LeftX={1,3}, RightX={2,3}, Width={3,3}", $pt.y, $pt.leftX, $pt.rightX, $pt.width))
    }
}

$bmp.Dispose()
