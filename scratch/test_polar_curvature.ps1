Add-Type -AssemblyName System.Drawing

# Test smoothing algorithm on Left and Right views of the Fair skin sheet
$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789458217062.png"
$bmp = New-Object System.Drawing.Bitmap($src)

# Let's inspect Left view (X: 300..505, Y: 28..200)
# Top apex is around X=408, Y=29
# Let's find the outer boundary points (x, y) for Left profile head
$boundary = @()
for ($y = 28; $y -le 160; $y++) {
    for ($x = 300; $x -le 505; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 25) {
            $boundary += @{ x=$x; y=$y }
            break
        }
    }
}

Write-Host "Found $($boundary.Count) top-left boundary points."

# Let's check the radius/curvature from skull center
# Approximate center of side-profile skull: (X=408, Y=140)
# Let's compute distance R(theta) for each boundary point
$cx = 408.0
$cy = 135.0

$polarPoints = @()
foreach ($pt in $boundary) {
    $dx = $pt.x - $cx
    $dy = $pt.y - $cy
    $angle = [Math]::Atan2($dy, $dx) # in radians, roughly -PI to -PI/2
    $dist = [Math]::Sqrt($dx*$dx + $dy*$dy)
    $polarPoints += @{ x=$pt.x; y=$pt.y; angle=$angle; dist=$dist }
}

# Print the points between angle -2.6 and -1.6 (the top-left frontal dome)
Write-Host "--- Polar profile of Left Head frontal dome ---"
foreach ($p in $polarPoints) {
    if ($p.y % 5 -eq 0) {
        Write-Host ([string]::Format("Y={0,3}, X={1,3} | Angle={2:F2} rad | Dist={3:F2} px", $p.y, $p.x, $p.angle, $p.dist))
    }
}

$bmp.Dispose()
