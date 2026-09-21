Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789458217062.png"
$bmp = New-Object System.Drawing.Bitmap($src)

# Check Left profile head top
Write-Host "--- LEFT PROFILE (Col 1) HEAD TOP PIXELS ---"
for ($x = 300; $x -le 505; $x += 5) {
    for ($y = 0; $y -lt 150; $y++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 15) {
            Write-Host "X=$x : Y=$y (A=$($p.A), R=$($p.R), G=$($p.G), B=$($p.B))"
            break
        }
    }
}

Write-Host "--- RIGHT PROFILE (Col 3) HEAD TOP PIXELS ---"
for ($x = 800; $x -le 1000; $x += 5) {
    for ($y = 0; $y -lt 150; $y++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 15) {
            Write-Host "X=$x : Y=$y (A=$($p.A), R=$($p.R), G=$($p.G), B=$($p.B))"
            break
        }
    }
}

$bmp.Dispose()
