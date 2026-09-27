Add-Type -AssemblyName System.Drawing

$destDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\weather"
if (!(Test-Path -Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\55929f9f-455c-4f12-8b4c-3002acd2c56d\.user_uploaded"

function Trim-And-Save($bmp, $outPath) {
    $minX = $bmp.Width
    $maxX = 0
    $minY = $bmp.Height
    $maxY = 0

    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.A -gt 15) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -gt $minX -and $maxY -gt $minY) {
        $w = $maxX - $minX + 1
        $h = $maxY - $minY + 1
        $rect = New-Object System.Drawing.Rectangle($minX, $minY, $w, $h)
        $cropped = $bmp.Clone($rect, $bmp.PixelFormat)
        $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $cropped.Dispose()
        Write-Output "Saved: $outPath (${w}x${h})"
    }
}

# 1. Process Sun
$sunBmp = New-Object System.Drawing.Bitmap("$srcDir\media_1790403254258.png")
Trim-And-Save $sunBmp "$destDir\sun.png"
$sunBmp.Dispose()

# Function to find and extract separate cloud components using BFS / Connected Components
function Extract-Cloud-Islands($srcFile, $prefix) {
    $bmp = New-Object System.Drawing.Bitmap($srcFile)
    $w = $bmp.Width
    $h = $bmp.Height
    $visited = New-Object 'bool[,]' $w, $h
    $islands = @()

    for ($y = 0; $y -lt $h; $y += 2) {
        for ($x = 0; $x -lt $w; $x += 2) {
            if (!$visited[$x, $y]) {
                $p = $bmp.GetPixel($x, $y)
                if ($p.A -gt 20) {
                    # BFS
                    $queue = New-Object System.Collections.Generic.Queue[System.Drawing.Point]
                    $queue.Enqueue((New-Object System.Drawing.Point($x, $y)))
                    $visited[$x, $y] = $true

                    $minX = $x
                    $maxX = $x
                    $minY = $y
                    $maxY = $y
                    $pixelCount = 0

                    while ($queue.Count -gt 0) {
                        $pt = $queue.Dequeue()
                        $pixelCount++

                        if ($pt.X -lt $minX) { $minX = $pt.X }
                        if ($pt.X -gt $maxX) { $maxX = $pt.X }
                        if ($pt.Y -lt $minY) { $minY = $pt.Y }
                        if ($pt.Y -gt $maxY) { $maxY = $pt.Y }

                        $neighbors = @(
                            (New-Object System.Drawing.Point($pt.X+1, $pt.Y)),
                            (New-Object System.Drawing.Point($pt.X-1, $pt.Y)),
                            (New-Object System.Drawing.Point($pt.X, $pt.Y+1)),
                            (New-Object System.Drawing.Point($pt.X, $pt.Y-1))
                        )

                        foreach ($n in $neighbors) {
                            if ($n.X -ge 0 -and $n.X -lt $w -and $n.Y -ge 0 -and $n.Y -lt $h) {
                                if (!$visited[$n.X, $n.Y]) {
                                    $visited[$n.X, $n.Y] = $true
                                    $np = $bmp.GetPixel($n.X, $n.Y)
                                    if ($np.A -gt 20) {
                                        $queue.Enqueue($n)
                                    }
                                }
                            }
                        }
                    }

                    if ($pixelCount -gt 1500 -and ($maxX - $minX) -gt 40 -and ($maxY - $minY) -gt 20) {
                        $islands += @{
                            minX = $minX
                            maxX = $maxX
                            minY = $minY
                            maxY = $maxY
                            area = ($maxX - $minX) * ($maxY - $minY)
                        }
                    }
                }
            }
        }
    }

    # Sort islands by top-to-bottom, left-to-right
    $sorted = $islands | Sort-Object { $_.minY * 1000 + $_.minX }

    $idx = 1
    foreach ($isl in $sorted) {
        $iw = $isl.maxX - $isl.minX + 1
        $ih = $isl.maxY - $isl.minY + 1
        $rect = New-Object System.Drawing.Rectangle($isl.minX, $isl.minY, $iw, $ih)
        $cropped = $bmp.Clone($rect, $bmp.PixelFormat)
        $outPath = "$destDir\${prefix}_${idx}.png"
        $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $cropped.Dispose()
        Write-Output "Saved: $outPath (${iw}x${ih})"
        $idx++
    }

    $bmp.Dispose()
}

# 2. Extract White Clouds
Extract-Cloud-Islands "$srcDir\media_1790403254389.png" "cloud_white"

# 3. Extract Dark Clouds
Extract-Cloud-Islands "$srcDir\media_1790403254532.png" "cloud_dark"
