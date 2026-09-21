Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded\media_1789397188108.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "Sampling background around Col 0 (x=20, y=100..400):"
for ($y = 100; $y -le 400; $y += 30) {
    $p = $bmp.GetPixel(20, $y)
    Write-Host "x=20, y=$y : R=$($p.R), G=$($p.G), B=$($p.B)"
}
$bmp.Dispose()
