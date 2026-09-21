Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789461632227.png"
$bmp = New-Object System.Drawing.Bitmap($src)
$w = $bmp.Width
$h = $bmp.Height

# Check 4 quarters
$colW = [int]($w / 4) # 256

for ($c = 0; $c -lt 4; $c++) {
    $x0 = $c * $colW
    $x1 = ($c + 1) * $colW - 1
    $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1

    for ($x = $x0; $x -le $x1; $x++) {
        for ($y = 0; $y -lt $h; $y++) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.A -gt 15) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($minX -le $maxX) {
        $bw = $maxX - $minX + 1
        $bh = $maxY - $minY + 1
        $cx = ($minX + $maxX) / 2.0
        $cy = ($minY + $maxY) / 2.0
        Write-Host "Quarter $c (X $x0..$x1): Bounds X=[$minX, $maxX] (W=$bw), Y=[$minY, $maxY] (H=$bh), Center=($cx, $cy)"
    } else {
        Write-Host "Quarter $c (X $x0..$x1): EMPTY (Blank/Back view)"
    }
}

$bmp.Dispose()
