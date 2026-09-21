Add-Type -AssemblyName System.Drawing

$files = @(
    "web\assets\character\base_fair_front.png",
    "web\assets\character\face_default_front.png",
    "web\assets\character\hair_short_front.png",
    "web\assets\character\rig\head_fair_front.png",
    "web\assets\character\rig\torso_fair_front.png"
)

foreach ($rel in $files) {
    $full = Join-Path "c:\Users\Administrator\Documents\GitHub\StockWars" $rel
    if (Test-Path $full) {
        $img = [System.Drawing.Image]::FromFile($full)
        Write-Host "$rel : $($img.Width) x $($img.Height)"
        $img.Dispose()
    } else {
        Write-Host "NOT FOUND: $rel"
    }
}
