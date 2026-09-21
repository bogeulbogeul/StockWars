Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_left.png")

Write-Host "Left profile head outline coordinates (Y=40..100):"
for ($y = 40; $y -le 100; $y++) {
    $minX = -1; $maxX = -1
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        if ($bmp.GetPixel($x, $y).A -gt 30) {
            $minX = $x; break
        }
    }
    for ($x = $bmp.Width - 1; $x -ge 0; $x--) {
        if ($bmp.GetPixel($x, $y).A -gt 30) {
            $maxX = $x; break
        }
    }
    if ($minX -ge 0) {
        Write-Host ([string]::Format("Y={0,2} | LeftX={1,3} | RightX={2,3}", $y, $minX, $maxX))
    }
}

$bmp.Dispose()
