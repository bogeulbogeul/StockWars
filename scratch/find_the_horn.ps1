Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap("c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\base_fair_right.png")

Write-Host "Printing grid of LeftX (10..11 o'clock) on Right view head:"
for ($y = 40; $y -le 70; $y++) {
    $line = [string]::Format("Y={0,2} : ", $y)
    for ($x = 75; $x -le 115; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -lt 20) {
            $line += " . "
        } elseif ($p.R -lt 110 -and $p.G -lt 80) {
            $line += " # " # Outline
        } else {
            $line += " O " # Skin
        }
    }
    Write-Host $line
}

$bmp.Dispose()
