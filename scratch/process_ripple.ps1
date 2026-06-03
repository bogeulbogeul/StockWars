[void][System.Reflection.Assembly]::LoadWithPartialName("System.Drawing")

function Resize-Image($srcPath, $dstPath) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap(64, 64)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.DrawImage($src, 0, 0, 64, 64)
    $g.Dispose()
    $src.Dispose()
    $bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Resize-Image "C:\Users\Administrator\.gemini\antigravity\brain\1ec498ef-bac8-4ddc-a363-e6a0c7f8b19f\cozy_ripple_sprite_1780461358884.png" "c:\Users\Administrator\Documents\GitHub\StockWars\Art_References\cozy_rain_ripple.png"
Copy-Item "c:\Users\Administrator\Documents\GitHub\StockWars\Art_References\cozy_rain_ripple.png" -Destination "C:\Users\Administrator\.gemini\antigravity\brain\1ec498ef-bac8-4ddc-a363-e6a0c7f8b19f\cozy_rain_ripple.png"

Write-Output "Ripple sprite resized and copied successfully!"
