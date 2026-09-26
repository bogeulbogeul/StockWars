$files = Get-ChildItem -Path web/css -Recurse -Include *.css

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

foreach ($f in $files) {
    $text = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    [System.IO.File]::WriteAllText($f.FullName, $text, $utf8NoBom)
}

Write-Host "Re-saved all $($files.Count) CSS files as UTF-8 without BOM."
