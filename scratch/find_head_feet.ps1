Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded\media_1789397188108.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "Image size: $($bmp.Width) x $($bmp.Height)"

# Check where the head starts in Col 0 (x: 128)
for ($y = 0; $y -lt $bmp.Height; $y += 5) {
    $p = $bmp.GetPixel(128, $y)
    if ($p.R -lt 200 -or $p.G -lt 200 -or $p.B -lt 200) {
        Write-Host "Head top approx at Y=$y"
        break
    }
}

# Check where the feet end in Col 0 (x: 128, scanning up from bottom)
for ($y = $bmp.Height - 1; $y -ge 0; $y -= 5) {
    $p = $bmp.GetPixel(128, $y)
    if ($p.R -lt 200 -or $p.G -lt 200 -or $p.B -lt 200) {
        Write-Host "Feet bottom approx at Y=$y"
        break
    }
}

$bmp.Dispose()
