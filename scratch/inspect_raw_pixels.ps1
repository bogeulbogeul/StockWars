Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded\media_1789397188108.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "Pixel at (10, 10): A=$($bmp.GetPixel(10,10).A), R=$($bmp.GetPixel(10,10).R), G=$($bmp.GetPixel(10,10).G), B=$($bmp.GetPixel(10,10).B)"
Write-Host "Pixel at (50, 50): A=$($bmp.GetPixel(50,50).A), R=$($bmp.GetPixel(50,50).R), G=$($bmp.GetPixel(50,50).G), B=$($bmp.GetPixel(50,50).B)"
Write-Host "Pixel at (100, 100): A=$($bmp.GetPixel(100,100).A), R=$($bmp.GetPixel(100,100).R), G=$($bmp.GetPixel(100,100).G), B=$($bmp.GetPixel(100,100).B)"
Write-Host "Pixel at (20, 300): A=$($bmp.GetPixel(20,300).A), R=$($bmp.GetPixel(20,300).R), G=$($bmp.GetPixel(20,300).G), B=$($bmp.GetPixel(20,300).B)"

$bmp.Dispose()
