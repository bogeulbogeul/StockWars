$content = git show HEAD:web/css/modules/character-creation.css
$lines = $content -split "`r?`n"
Write-Host "Total lines: $($lines.Length)"

# Let's inspect comments / major section headers
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "^\s*/\*") {
        Write-Host "Line $($i + 1): $($lines[$i])"
    }
}
