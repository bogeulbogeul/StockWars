$orig = [System.IO.File]::ReadAllText("scratch/original_SmartphoneUI.js", [System.Text.Encoding]::UTF8)
$lines = $orig -split "`r?`n"

for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "^\s{4}([a-zA-Z0-9_]+)\s*\(") {
        Write-Host ("Line {0,4}: {1}" -f ($i+1), $lines[$i].Trim())
    }
}
