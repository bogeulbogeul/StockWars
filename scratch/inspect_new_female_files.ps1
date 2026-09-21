Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"

$files = @(
    "media_1789453620742.png",
    "media_1789453620850.png",
    "media_1789453620909.png",
    "media_1789453621000.png",
    "media_1789453621069.png"
)

foreach ($f in $files) {
    $bmp = New-Object System.Drawing.Bitmap((Join-Path $baseDir $f))
    # Sample forehead center
    $head = $bmp.GetPixel(130, 160)
    Write-Host ("File {0,-25} Size: {1}x{2} HeadColor: R={3}, G={4}, B={5}" -f $f, $bmp.Width, $bmp.Height, $head.R, $head.G, $head.B)
    $bmp.Dispose()
}
