Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character"
$dirs = @("front", "left", "back", "right")

Write-Host "=== Base Head Widths and Bounds ==="
foreach ($d in $dirs) {
    $bmp = New-Object System.Drawing.Bitmap((Join-Path $baseDir "base_fair_$d.png"))
    $minX = 999; $maxX = -1; $minY = 999; $maxY = -1
    # Only head (Y from 40 to 140)
    for ($y = 40; $y -le 140; $y++) {
        for ($x = 0; $x -lt 240; $x++) {
            if ($bmp.GetPixel($x, $y).A -gt 15) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    $w = $maxX - $minX + 1
    $cx = ($minX + $maxX) / 2.0
    Write-Host "$d Head: MinX=$minX, MaxX=$maxX, Width=$w, CenterX=$cx, MinY=$minY, MaxY=$maxY"
    $bmp.Dispose()
}

$hairs = @("short", "bob", "long", "ponytail")
Write-Host "`n=== Hair Bounds and Head Coverage ==="
foreach ($h in $hairs) {
    Write-Host "--- Hair: $h ---"
    foreach ($d in $dirs) {
        $hairPath = Join-Path $baseDir "hair_${h}_$d.png"
        if (Test-Path $hairPath) {
            $bmp = New-Object System.Drawing.Bitmap($hairPath)
            $minX = 999; $maxX = -1; $minY = 999; $maxY = -1
            for ($y = 0; $y -lt 340; $y++) {
                for ($x = 0; $x -lt 240; $x++) {
                    if ($bmp.GetPixel($x, $y).A -gt 15) {
                        if ($x -lt $minX) { $minX = $x }
                        if ($x -gt $maxX) { $maxX = $x }
                        if ($y -lt $minY) { $minY = $y }
                        if ($y -gt $maxY) { $maxY = $y }
                    }
                }
            }
            $w = $maxX - $minX + 1
            $cx = ($minX + $maxX) / 2.0
            Write-Host "  ${d}: MinX=$minX, MaxX=$maxX, Width=$w, CenterX=$cx, MinY=$minY, MaxY=$maxY"
            $bmp.Dispose()
        }
    }
}
