Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789458217062.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "Printing grid of pixels around Left profile top head (X=355..380, Y=30..48):"
for ($y = 30; $y -le 48; $y++) {
    $line = "Y=$y : "
    for ($x = 355; $x -le 380; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -lt 15) {
            $line += " . "
        } elseif ($p.A -lt 150) {
            $line += " - "
        } else {
            # Check if outline (dark) or skin (light)
            if ($p.R -lt 100) {
                $line += " # " # outline
            } else {
                $line += " O " # skin fill
            }
        }
    }
    Write-Host $line
}

$bmp.Dispose()
