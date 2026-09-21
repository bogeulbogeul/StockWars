Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_right.png")

Write-Host "Inspecting Right profile head (facing right):"
# Center of head is around X=120, apex Y ~ 42
# In right view, face is on the right (X > 120), back of head is on left (X < 120)
# Look at top-right quadrant (X from 115 to 170, Y from 40 to 90)

for ($y = 40; $y -le 85; $y++) {
    $minX = -1; $maxX = -1
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        if ($bmp.GetPixel($x, $y).A -gt 25) {
            $minX = $x; break
        }
    }
    for ($x = $bmp.Width - 1; $x -ge 0; $x--) {
        if ($bmp.GetPixel($x, $y).A -gt 25) {
            $maxX = $x; break
        }
    }
    if ($minX -ge 0) {
        $dx = $maxX - 119 # distance from center
        Write-Host ([string]::Format("Y={0,2} | LeftX={1,3} | RightX={2,3} | R_topRight={3,2}", $y, $minX, $maxX, $dx))
    }
}

$bmp.Dispose()
