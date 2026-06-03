[void][System.Reflection.Assembly]::LoadWithPartialName("System.Drawing")

function Resize-Image($srcPath, $dstPath) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap(256, 256)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.DrawImage($src, 0, 0, 256, 256)
    $g.Dispose()
    $src.Dispose()
    $bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Resize-Image "C:\Users\Administrator\.gemini\antigravity\brain\1ec498ef-bac8-4ddc-a363-e6a0c7f8b19f\seamless_rain_texture_256_1780461200533.png" "c:\Users\Administrator\Documents\GitHub\StockWars\Art_References\cozy_rain_texture.png"
Copy-Item "c:\Users\Administrator\Documents\GitHub\StockWars\Art_References\cozy_rain_texture.png" -Destination "C:\Users\Administrator\.gemini\antigravity\brain\1ec498ef-bac8-4ddc-a363-e6a0c7f8b19f\cozy_rain_texture.png"

Write-Output "Rain texture resized and copied successfully!"
