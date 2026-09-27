Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\55929f9f-455c-4f12-8b4c-3002acd2c56d\.user_uploaded"
$files = @("media_1790403254258.png", "media_1790403254389.png", "media_1790403254532.png")

foreach ($name in $files) {
    $fullPath = Join-Path $srcDir $name
    $bmp = New-Object System.Drawing.Bitmap($fullPath)
    $w = $bmp.Width
    $h = $bmp.Height
    $mid = $bmp.GetPixel([int]($w/2), [int]($h/2))
    $top = $bmp.GetPixel(10, 10)
    Write-Output "$name (${w}x${h}) -> Center: R=$($mid.R),G=$($mid.G),B=$($mid.B) | Corner: R=$($top.R),G=$($top.G),B=$($top.B)"
    $bmp.Dispose()
}
