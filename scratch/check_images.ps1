Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem "C:\Users\Administrator\.gemini\antigravity-ide\brain\7417655f-9bbf-4bd5-84f4-3032d4a5cc2f\.user_uploaded\media_178939718*.png" | Sort-Object Name
foreach ($f in $files) {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    Write-Host "$($f.Name) : $($img.Width) x $($img.Height)"
    $img.Dispose()
}
