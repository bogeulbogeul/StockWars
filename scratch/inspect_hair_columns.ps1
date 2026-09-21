Add-Type -AssemblyName System.Drawing

$hairStyles = @(
    @{ id="bob";      file="media_1789463644338.png"; name="단발" },
    @{ id="long";     file="media_1789463644394.png"; name="롱" },
    @{ id="ponytail"; file="media_1789463644478.png"; name="포니테일" },
    @{ id="short";    file="media_1789463644510.png"; name="숏컷" }
)

$dir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"

foreach ($h in $hairStyles) {
    $p = Join-Path $dir $h.file
    $bmp = New-Object System.Drawing.Bitmap($p)
    $w = $bmp.Width
    $hVal = $bmp.Height
    $colW = [int]($w / 4)

    Write-Host "========================================"
    Write-Host "Hair Style: $($h.name) ($($h.id)) from $($h.file) [${w}x${hVal}]"

    for ($c = 0; $c -lt 4; $c++) {
        $x0 = $c * $colW
        $x1 = ($c + 1) * $colW - 1
        $minX = 9999; $maxX = -1; $minY = 9999; $maxY = -1

        for ($x = $x0; $x -le $x1; $x++) {
            for ($y = 0; $y -lt $hVal; $y++) {
                if ($bmp.GetPixel($x, $y).A -gt 15) {
                    if ($x -lt $minX) { $minX = $x }
                    if ($x -gt $maxX) { $maxX = $x }
                    if ($y -lt $minY) { $minY = $y }
                    if ($y -gt $maxY) { $maxY = $y }
                }
            }
        }
        $bw = $maxX - $minX + 1
        $bh = $maxY - $minY + 1
        Write-Host "  Col $c : Bounds X=[$minX, $maxX] (W=$bw), Y=[$minY, $maxY] (H=$bh)"
    }
    $bmp.Dispose()
}
