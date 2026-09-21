Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\character\*.png"
foreach ($f in $files) {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    Write-Host "$($f.Name) : $($img.Width) x $($img.Height)"
    $img.Dispose()
}
