Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789458217062.png"
$bmp = New-Object System.Drawing.Bitmap($src)
$w = $bmp.Width
$h = $bmp.Height

$counts = @()
for ($x = 0; $x -lt $w; $x++) {
    $c = 0
    for ($y = 0; $y -lt $h; $y++) {
        if ($bmp.GetPixel($x, $y).A -gt 25) {
            $c++
        }
    }
    $counts += $c
}

Write-Host "Columns with zero non-transparent pixels:"
$zeros = @()
for ($x = 0; $x -lt $w; $x++) {
    if ($counts[$x] -eq 0) {
        $zeros += $x
    }
}
Write-Host ($zeros -join ", ")

# Find the valleys between the 4 character peaks
# Peak 0: ~130, Peak 1: ~380, Peak 2: ~640, Peak 3: ~890
$v1 = 0; $minC1 = 9999
for ($x = 220; $x -le 290; $x++) {
    if ($counts[$x] -lt $minC1) { $minC1 = $counts[$x]; $v1 = $x }
}

$v2 = 0; $minC2 = 9999
for ($x = 470; $x -le 540; $x++) {
    if ($counts[$x] -lt $minC2) { $minC2 = $counts[$x]; $v2 = $x }
}

$v3 = 0; $minC3 = 9999
for ($x = 730; $x -le 790; $x++) {
    if ($counts[$x] -lt $minC3) { $minC3 = $counts[$x]; $v3 = $x }
}

Write-Host "Valley 1: X=$v1 (count=$minC1)"
Write-Host "Valley 2: X=$v2 (count=$minC2)"
Write-Host "Valley 3: X=$v3 (count=$minC3)"

$bmp.Dispose()
