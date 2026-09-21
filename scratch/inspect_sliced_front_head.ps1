Add-Type -AssemblyName System.Drawing

$src = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_front.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "--- FRONT VIEW HEAD CONTOUR ---"
for ($y = 40; $y -le 90; $y += 2) {
    $minX = 999; $maxX = -1
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        if ($bmp.GetPixel($x, $y).A -gt 20) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
        }
    }
    if ($minX -lt 999) {
        $centerX = ($minX + $maxX) / 2.0
        Write-Host ([string]::Format("Y={0,3} : LeftX={1,3}, RightX={2,3}, Width={3,3}, CenterX={4:F1}", $y, $minX, $maxX, ($maxX - $minX + 1), $centerX))
    }
}

$bmp.Dispose()
