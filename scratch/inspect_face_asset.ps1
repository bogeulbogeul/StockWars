Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789461632227.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "File size: $($bmp.Width) x $($bmp.Height)"
$tl = $bmp.GetPixel(0, 0)
Write-Host "Top-Left pixel: A=$($tl.A), R=$($tl.R), G=$($tl.G), B=$($tl.B)"

# Check if background is pure transparent or white
# Count non-transparent / non-white pixels
$nonBg = 0
for ($x = 0; $x -lt $bmp.Width; $x += 10) {
    for ($y = 0; $y -lt $bmp.Height; $y += 10) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 10 -and ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240)) {
            $nonBg++
        }
    }
}
Write-Host "Sampled non-bg pixels: $nonBg"

$bmp.Dispose()
