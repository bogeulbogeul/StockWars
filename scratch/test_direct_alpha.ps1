Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded\media_1789397188108.png"
$bmp = New-Object System.Drawing.Bitmap($src)

$res = New-Object System.Drawing.Bitmap(256, 682, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($x = 0; $x -lt 256; $x++) {
    for ($y = 0; $y -lt 682; $y++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -lt 20) {
            $res.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $res.SetPixel($x, $y, $p)
        }
    }
}
$res.Save("c:\Users\Administrator\Documents\GitHub\StockWars\scratch\test_direct_alpha.png", [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Saved test_direct_alpha.png!"
$bmp.Dispose()
$res.Dispose()
