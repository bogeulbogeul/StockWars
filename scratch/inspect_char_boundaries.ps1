$content = git show HEAD:web/css/modules/character-creation.css
$lines = $content -split "`r?`n"

# Boundary inspection
Write-Host "Lines 320-330:"
for ($i = 319; $i -le 329; $i++) {
    Write-Host "$($i + 1): $($lines[$i])"
}

Write-Host "`nLines 700-710:"
for ($i = 699; $i -le 709; $i++) {
    Write-Host "$($i + 1): $($lines[$i])"
}

Write-Host "`nLines 820-830:"
for ($i = 819; $i -le 829; $i++) {
    Write-Host "$($i + 1): $($lines[$i])"
}
