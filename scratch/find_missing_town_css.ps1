$orig = [System.IO.File]::ReadAllText("scratch/git_orig_town_stage.css", [System.Text.Encoding]::UTF8)
$origLines = $orig -split "`r?`n"

$combined = ""
foreach ($f in @(
    "web/css/modules/town/town-base.css",
    "web/css/modules/town/town-buildings.css",
    "web/css/modules/town/town-billboard.css",
    "web/css/modules/town/town-props.css",
    "web/css/modules/town/town-character.css",
    "web/css/modules/town/town-modal.css"
)) {
    $combined += "`n" + [System.IO.File]::ReadAllText($f)
}

Write-Host "Searching for missing blocks from original..."
$missingBlockStart = -1
for ($i = 0; $i -lt $origLines.Length; $i++) {
    $line = $origLines[$i].Trim()
    if ($line.Length -gt 5 -and !$line.StartsWith("/*") -and !$combined.Contains($line)) {
        Write-Host "Line $($i+1): $($origLines[$i])"
    }
}
