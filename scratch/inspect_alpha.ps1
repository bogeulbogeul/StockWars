Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\55929f9f-455c-4f12-8b4c-3002acd2c56d\.user_uploaded"
$files = @("media_1790403254258.png", "media_1790403254389.png", "media_1790403254532.png")

foreach ($name in $files) {
    $fullPath = Join-Path $srcDir $name
    $bmp = New-Object System.Drawing.Bitmap($fullPath)
    $pixel = $bmp.GetPixel(5, 5)
    Write-Output "$name -> PixelFormat: $($bmp.PixelFormat) | Pixel(5,5): A=$($pixel.A), R=$($pixel.R), G=$($pixel.G), B=$($pixel.B)"
    $bmp.Dispose()
}
