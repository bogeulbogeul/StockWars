$files = Get-ChildItem -Path web/js -Recurse -Include *.js

foreach ($f in $files) {
    $lines = [System.IO.File]::ReadAllLines($f.FullName)
    $corrupt = @()
    for ($i = 0; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        # Check for unquoted ${...} (not inside backticks)
        if ($line -match "(?<!`)(\$\{[^}]+\})(?!`)") {
            # Let's see if the line actually has an odd number of backticks before it or if it's completely unquoted
            $backticks = ($line.ToCharArray() | Where-Object { $_ -eq '`' }).Count
            if ($backticks -eq 0) {
                $corrupt += "Line $($i+1): $line"
            }
        }
    }
    if ($corrupt.Count -gt 0) {
        Write-Host "FOUND potential template corruption in $($f.FullName):" -ForegroundColor Yellow
        $corrupt | Select-Object -First 5 | ForEach-Object { Write-Host "   $_" }
    }
}
