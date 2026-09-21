Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789458217062.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "Left profile head in high-res sheet (Col 1):"
# High res Y range for head top: Y from 28 to 150, X from 300 to 500
$highResPoints = @()
for ($y = 28; $y -le 150; $y += 2) {
    $minX = -1; $maxX = -1
    for ($x = 300; $x -le 505; $x++) {
        if ($bmp.GetPixel($x, $y).A -gt 30) {
            $minX = $x; break
        }
    }
    for ($x = 505; $x -ge 300; $x--) {
        if ($bmp.GetPixel($x, $y).A -gt 30) {
            $maxX = $x; break
        }
    }
    if ($minX -ge 0) {
        $highResPoints += @{ y=$y; minX=$minX; maxX=$maxX; w=($maxX - $minX + 1) }
    }
}

foreach ($p in $highResPoints) {
    if ($p.y % 4 -eq 0) {
        Write-Host ([string]::Format("HighRes Y={0,3} | LeftX={1,3} | RightX={2,3} | W={3,3}", $p.y, $p.minX, $p.maxX, $p.w))
    }
}

$bmp.Dispose()
