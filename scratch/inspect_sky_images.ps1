Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\55929f9f-455c-4f12-8b4c-3002acd2c56d\.user_uploaded"
$files = Get-ChildItem -Path "$dir\*.png"
foreach ($f in $files) {
    $bmp = New-Object System.Drawing.Bitmap($f.FullName)
    $w = $bmp.Width
    $h = $bmp.Height
    $top = $bmp.GetPixel([int]($w/2), 10)
    $mid = $bmp.GetPixel([int]($w/2), [int]($h/2))
    $bot = $bmp.GetPixel([int]($w/2), [int]($h - 10))
    $bmp.Dispose()
    Write-Output "$($f.Name) (${w}x${h}) -> Top: R=$($top.R), G=$($top.G), B=$($top.B) | Mid: R=$($mid.R), G=$($mid.G), B=$($mid.B) | Bot: R=$($bot.R), G=$($bot.G), B=$($bot.B)"
}
