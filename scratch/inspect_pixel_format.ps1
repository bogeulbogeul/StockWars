Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"
$file = "media_1789456231270.png"
$srcPath = Join-Path $baseDir $file

$bmp = New-Object System.Drawing.Bitmap($srcPath)
Write-Host "PixelFormat: $($bmp.PixelFormat)"

for ($y = 0; $y -lt 100; $y += 10) {
    $p = $bmp.GetPixel(102, $y)
    Write-Host ("Y={0} A={1} R={2} G={3} B={4}" -f $y, $p.A, $p.R, $p.G, $p.B)
}

$bmp.Dispose()
