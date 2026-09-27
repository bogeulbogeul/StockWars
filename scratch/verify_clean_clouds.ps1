Add-Type -AssemblyName System.Drawing

$dir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\weather"
$files = Get-ChildItem -Path "$dir\cloud_*.png"

foreach ($f in $files) {
    $bmp = New-Object System.Drawing.Bitmap($f.FullName)
    # Check if top edge has disconnected islands
    $topRowHasAlpha = $false
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        if ($bmp.GetPixel($x, 0).A -gt 30) { $topRowHasAlpha = $true; break }
    }
    Write-Output "$($f.Name): $($bmp.Width)x$($bmp.Height), TopEdgeAlpha=$topRowHasAlpha"
    $bmp.Dispose()
}
