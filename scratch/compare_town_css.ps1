$orig = [System.IO.File]::ReadAllText("scratch/git_orig_town_stage.css", [System.Text.Encoding]::UTF8)
$origLines = $orig -split "`r?`n"

$townFiles = @(
    "web/css/modules/town/town-base.css",
    "web/css/modules/town/town-buildings.css",
    "web/css/modules/town/town-billboard.css",
    "web/css/modules/town/town-props.css",
    "web/css/modules/town/town-character.css",
    "web/css/modules/town/town-modal.css"
)

$splitTotal = 0
foreach ($f in $townFiles) {
    if (Test-Path $f) {
        $lines = [System.IO.File]::ReadAllLines($f).Length
        Write-Host "$f : $lines lines"
        $splitTotal += $lines
    } else {
        Write-Host "MISSING: $f" -ForegroundColor Red
    }
}

Write-Host "`nOriginal total: $($origLines.Length) lines"
Write-Host "Split total: $splitTotal lines"
Write-Host "Difference: $($origLines.Length - $splitTotal) lines"
