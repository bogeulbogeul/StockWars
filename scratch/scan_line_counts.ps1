$files = Get-ChildItem -Path web -Recurse -Include *.js, *.css

$exceeding = @()
$summary = @()

foreach ($file in $files) {
    $lines = [System.IO.File]::ReadAllLines($file.FullName)
    $count = $lines.Length
    $summary += [PSCustomObject]@{
        Path = $file.FullName.Replace((Get-Location).Path + "\", "")
        Lines = $count
    }
    if ($count -gt 500) {
        $exceeding += [PSCustomObject]@{
            Path = $file.FullName.Replace((Get-Location).Path + "\", "")
            Lines = $count
        }
    }
}

Write-Host "=== Total scanned web files: $($summary.Count) ==="
if ($exceeding.Count -gt 0) {
    Write-Host "`nWARNING: The following files exceed 500 lines:" -ForegroundColor Yellow
    $exceeding | Format-Table -AutoSize
} else {
    Write-Host "`nSUCCESS: All web JS & CSS files are STRICTLY <= 500 lines!" -ForegroundColor Green
}
