Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded\media_1789458217062.png"
$bmp = New-Object System.Drawing.Bitmap($src)

Write-Host "Printing top curve of Left profile head (X=330..470):"
for ($y = 28; $y -le 46; $y++) {
    $line = [string]::Format("Y={0,2} : ", $y)
    for ($x = 330; $x -le 470; $x += 2) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -lt 20) {
            $line += " "
        } elseif ($p.R -lt 110 -and $p.G -lt 80) {
            $line += "#" # Outline
        } else {
            $line += "O" # Skin
        }
    }
    Write-Host $line
}

$bmp.Dispose()
