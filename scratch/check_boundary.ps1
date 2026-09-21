Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded\media_1789397188108.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "Checking pixels near x=240..255, y=300..500 in source image:"
for ($x = 220; $x -le 255; $x += 5) {
    for ($y = 350; $y -le 480; $y += 10) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 25) {
            Write-Host "x=$x, y=$y : A=$($p.A)"
        }
    }
}
$bmp.Dispose()
