Add-Type -AssemblyName System.Drawing

$hairStyles = @(
    @{ id="bob";      file="media_1789463644338.png"; name="단발" },
    @{ id="long";     file="media_1789463644394.png"; name="롱" },
    @{ id="ponytail"; file="media_1789463644478.png"; name="포니테일" },
    @{ id="short";    file="media_1789463644510.png"; name="숏컷" }
)

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"

foreach ($h in $hairStyles) {
    $bmp = New-Object System.Drawing.Bitmap((Join-Path $srcDir $h.file))
    $w = $bmp.Width
    $hVal = $bmp.Height
    $colW = 256

    Write-Host "=== $($h.name) Ear cutout alignment ==="
    # In Col 1 (Left view, X: 256..511): ear slot is an empty white area on the right side of the face
    # In Col 3 (Right view, X: 768..1023): ear slot is an empty white area on the left side of the face
    
    # Let's find top apex of hair in Col 0, Col 1, Col 2, Col 3
    for ($c = 0; $c -lt 4; $c++) {
        $x0 = $c * $colW; $x1 = ($c + 1) * $colW - 1
        $topY = 999; $topX = 0
        for ($y = 0; $y -lt $hVal; $y++) {
            for ($x = $x0; $x -le $x1; $x++) {
                if ($bmp.GetPixel($x, $y).A -gt 25) {
                    if ($y -lt $topY) { $topY = $y; $topX = $x }
                }
            }
            if ($topY -lt 999) { break }
        }
        Write-Host "  Col $c : Top Apex at X=$topX (offset in col: $($topX - $x0)), TopY=$topY"
    }
    $bmp.Dispose()
}
