Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789461632227.png"
$bmp = New-Object System.Drawing.Bitmap($src)
$w = $bmp.Width
$h = $bmp.Height

$counts = @()
for ($x = 0; $x -lt $w; $x++) {
    $c = 0
    for ($y = 0; $y -lt $h; $y++) {
        if ($bmp.GetPixel($x, $y).A -gt 15) { $c++ }
    }
    $counts += $c
}

Write-Host "Columns with zero pixels:"
$zeros = @()
for ($x = 0; $x -lt $w; $x++) {
    if ($counts[$x] -eq 0) { $zeros += $x }
}
Write-Host ($zeros -join ", ")

# Find valleys between decals
$v1 = 0; $minC1 = 9999
for ($x = 240; $x -le 390; $x++) {
    if ($counts[$x] -lt $minC1) { $minC1 = $counts[$x]; $v1 = $x }
}

Write-Host "Valley between Front and Left: X=$v1 (count=$minC1)"

$bmp.Dispose()
