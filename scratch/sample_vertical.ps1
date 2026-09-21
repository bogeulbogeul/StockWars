Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded\media_1789397188108.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "Sampling vertical line at x=128:"
for ($y = 0; $y -lt $bmp.Height; $y += 20) {
    $p = $bmp.GetPixel(128, $y)
    Write-Host "Y=$y : R=$($p.R), G=$($p.G), B=$($p.B)"
}

$bmp.Dispose()
