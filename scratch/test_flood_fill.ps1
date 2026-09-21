Add-Type -AssemblyName System.Drawing

function Remove-Background-FloodFill($bmp) {
    $w = $bmp.Width
    $h = $bmp.Height
    $visited = New-Object 'bool[,]' $w, $h
    $isBg = New-Object 'bool[,]' $w, $h
    
    $queue = New-Object System.Collections.Generic.Queue[System.Drawing.Point]
    
    # Enqueue borders
    for ($x = 0; $x -lt $w; $x++) {
        $queue.Enqueue((New-Object System.Drawing.Point($x, 0)))
        $queue.Enqueue((New-Object System.Drawing.Point($x, $h - 1)))
        $visited[$x, 0] = $true
        $visited[$x, $h - 1] = $true
    }
    for ($y = 0; $y -lt $h; $y++) {
        $queue.Enqueue((New-Object System.Drawing.Point(0, $y)))
        $queue.Enqueue((New-Object System.Drawing.Point($w - 1, $y)))
        $visited[0, $y] = $true
        $visited[$w - 1, $y] = $true
    }
    
    $dx = @(1, -1, 0, 0)
    $dy = @(0, 0, 1, -1)
    
    while ($queue.Count -gt 0) {
        $pt = $queue.Dequeue()
        $px = $pt.X
        $py = $pt.Y
        
        $p = $bmp.GetPixel($px, $py)
        $minVal = [Math]::Min($p.R, [Math]::Min($p.G, $p.B))
        $maxVal = [Math]::Max($p.R, [Math]::Max($p.G, $p.B))
        
        # White background condition: Bright and low saturation
        $isWhiteLike = ($minVal -gt 230) -and (($maxVal - $minVal) -lt 25)
        # Also treat pure dark/black compression borders at edges as background if any
        $isEdgeArtifact = ($minVal -lt 20 -and $maxVal -lt 20) -and ($px -lt 5 -or $px -gt $w - 6 -or $py -lt 5 -or $py -gt $h - 6)
        
        if ($isWhiteLike -or $isEdgeArtifact) {
            $isBg[$px, $py] = $true
            
            for ($i = 0; $i -lt 4; $i++) {
                $nx = $px + $dx[$i]
                $ny = $py + $dy[$i]
                if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h) {
                    if (-not $visited[$nx, $ny]) {
                        $visited[$nx, $ny] = $true
                        $queue.Enqueue((New-Object System.Drawing.Point($nx, $ny)))
                    }
                }
            }
        }
    }
    
    # Create result 32bpp ARGB bitmap
    $res = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    for ($x = 0; $x -lt $w; $x++) {
        for ($y = 0; $y -lt $h; $y++) {
            if ($isBg[$x, $y]) {
                $res.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } else {
                $p = $bmp.GetPixel($x, $y)
                # Soft edge anti-aliasing near background boundary
                $minVal = [Math]::Min($p.R, [Math]::Min($p.G, $p.B))
                $maxVal = [Math]::Max($p.R, [Math]::Max($p.G, $p.B))
                if ($minVal -gt 220 -and (($maxVal - $minVal) -lt 25)) {
                    # Check if neighbor is background
                    $hasBgNeighbor = $false
                    for ($i = 0; $i -lt 4; $i++) {
                        $nx = $x + $dx[$i]; $ny = $y + $dy[$i]
                        if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h) {
                            if ($isBg[$nx, $ny]) { $hasBgNeighbor = $true; break }
                        }
                    }
                    if ($hasBgNeighbor) {
                        $alpha = [int](255 * (240 - $minVal) / 20.0)
                        if ($alpha -lt 0) { $alpha = 0 }
                        if ($alpha -gt 255) { $alpha = 255 }
                        $res.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
                    } else {
                        $res.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $p.R, $p.G, $p.B))
                    }
                } else {
                    $res.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $p.R, $p.G, $p.B))
                }
            }
        }
    }
    return $res
}

# Test on 1 column of fair skin
$srcPath = "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded\media_1789397188108.png"
$fullBmp = New-Object System.Drawing.Bitmap($srcPath)
$rect = New-Object System.Drawing.Rectangle(0, 0, 256, 682)
$col0 = $fullBmp.Clone($rect, $fullBmp.PixelFormat)

$cleanCol0 = Remove-Background-FloodFill($col0)
$cleanCol0.Save("c:\Users\Administrator\Documents\GitHub\StockWars\scratch\test_clean_col0.png", [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "Saved test_clean_col0.png successfully!"
$col0.Dispose()
$cleanCol0.Dispose()
$fullBmp.Dispose()
