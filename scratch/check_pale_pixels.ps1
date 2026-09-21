Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"
$paleFile = "media_1789453620742.png"

$bmp = New-Object System.Drawing.Bitmap((Join-Path $baseDir $paleFile))
$blackDots = 0
for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -lt 50 -and $p.G -lt 50 -and $p.B -lt 50) {
            $blackDots++
        }
    }
}

Write-Host "Black pixels in Pale file ($paleFile): $blackDots"
$bmp.Dispose()
