$orig = [System.IO.File]::ReadAllText("scratch/git_orig_town_stage.css", [System.Text.Encoding]::UTF8)
$lines = $orig -split "`r?`n"

$outDir = "web/css/modules/town"
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

# 1. town-base.css (Lines 1 to 183)
$p1 = ($lines[0..182] -join "`n")
[System.IO.File]::WriteAllText("$outDir/town-base.css", $p1, [System.Text.Encoding]::UTF8)

# 2. town-buildings.css (Lines 184 to 435)
$p2 = ($lines[183..434] -join "`n")
[System.IO.File]::WriteAllText("$outDir/town-buildings.css", $p2, [System.Text.Encoding]::UTF8)

# 3. town-billboard.css (Lines 436 to 791)
$p3 = ($lines[435..790] -join "`n")
[System.IO.File]::WriteAllText("$outDir/town-billboard.css", $p3, [System.Text.Encoding]::UTF8)

# 4. town-props.css (Lines 792 to 964 + Ground Platform 1339 to 1376)
$p4 = ($lines[791..963] -join "`n") + "`n`n" + ($lines[1338..1375] -join "`n")
[System.IO.File]::WriteAllText("$outDir/town-props.css", $p4, [System.Text.Encoding]::UTF8)

# 5. town-character.css (Lines 965 to 1171 + Character details 1377 to 1462)
$p5 = ($lines[964..1170] -join "`n") + "`n`n" + ($lines[1376..1461] -join "`n")
[System.IO.File]::WriteAllText("$outDir/town-character.css", $p5, [System.Text.Encoding]::UTF8)

# 6. town-modal.css (Lines 1172 to 1338 + Building Proximity Prompt 1463 to 1526)
$p6 = ($lines[1171..1337] -join "`n") + "`n`n" + ($lines[1462..($lines.Length - 1)] -join "`n")
[System.IO.File]::WriteAllText("$outDir/town-modal.css", $p6, [System.Text.Encoding]::UTF8)

Write-Host "Generated complete 6 town CSS submodules."
Get-ChildItem -Path $outDir | ForEach-Object {
    $c = [System.IO.File]::ReadAllLines($_.FullName).Length
    Write-Host ("{0,-25} : {1,4} lines" -f $_.Name, $c)
}
