$orig = [System.IO.File]::ReadAllText("scratch/git_orig_town_stage.css", [System.Text.Encoding]::UTF8)
$origLines = $orig -split "`r?`n"

for ($i = 0; $i -lt $origLines.Length; $i++) {
    if ($origLines[$i] -match "^\s*/\*") {
        $msg = "Line " + ($i+1) + ": " + $origLines[$i]
        Write-Host $msg
    }
}
