$lines = Get-Content "web/js/main.js"
for ($i = 58; $i -lt 70; $i++) {
    Write-Host "$($i+1): '$($lines[$i])'"
}
