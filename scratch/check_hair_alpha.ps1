Add-Type -AssemblyName System.Drawing
$files = @(
    "media_1789463644338.png",
    "media_1789463644394.png",
    "media_1789463644478.png",
    "media_1789463644510.png"
)
$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"

foreach ($f in $files) {
    $path = Join-Path $srcDir $f
    $bmp = New-Object System.Drawing.Bitmap($path)
    Write-Host "File $f : $($bmp.Width) x $($bmp.Height), Format: $($bmp.PixelFormat)"
    
    # Check pixel around middle of ear in Col 1 (approx X=380, Y=200)
    # Check transparent pixels vs white pixels
    $trans = 0
    $white = 0
    $black = 0
    for ($x = 0; $x -lt $bmp.Width; $x += 4) {
        for ($y = 0; $y -lt $bmp.Height; $y += 4) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.A -lt 10) { $trans++ }
            elseif ($p.R -gt 240 -and $p.G -gt 240 -and $p.B -gt 240) { $white++ }
            else { $black++ }
        }
    }
    Write-Host "  Trans: $trans, White: $white, Dark/Color: $black"
    $bmp.Dispose()
}
