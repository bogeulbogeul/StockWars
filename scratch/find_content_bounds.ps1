Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded\media_178939718*.png" | Sort-Object Name

foreach ($f in $files) {
    $bmp = New-Object System.Drawing.Bitmap($f.FullName)
    $minY = 9999; $maxY = 0; $minX = 9999; $maxX = 0;
    
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            $p = $bmp.GetPixel($x, $y)
            # Content pixel (neither pure black/dark letterbox nor pure white)
            $isBlack = ($p.R -lt 15 -and $p.G -lt 15 -and $p.B -lt 15)
            if (-not $isBlack) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    Write-Host "$($f.Name) : X=[$minX, $maxX] (W=$($maxX-$minX+1)), Y=[$minY, $maxY] (H=$($maxY-$minY+1))"
    $bmp.Dispose()
}
