Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded\media_1789397188108.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "Vertical projection (columns with 0 or very low alpha sum):"
for ($x = 0; $x -lt $bmp.Width; $x++) {
    $sumA = 0
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 25) { $sumA += 1 }
    }
    if ($sumA -eq 0 -or $x % 50 -eq 0) {
        Write-Host "x=$x : non-transparent pixels=$sumA"
    }
}
$bmp.Dispose()
