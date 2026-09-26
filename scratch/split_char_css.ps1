$content = git show HEAD:web/css/modules/character-creation.css
$lines = $content -split "`r?`n"

$outDir = "web/css/modules/character"
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

# Remove any old/scratch files in character dir
Get-ChildItem -Path $outDir | Remove-Item -Force

# Part 1: kiosk-base.css (Lines 1 to 322)
$part1Header = "/* Character Creation: Kiosk Base & Stepper Layout */`n"
$part1 = $part1Header + ($lines[0..321] -join "`n")
[System.IO.File]::WriteAllText("$outDir/kiosk-base.css", $part1, [System.Text.Encoding]::UTF8)

# Part 2: avatar-customizer.css (Lines 324 to 701)
$part2Header = "/* Character Creation: Avatar Customization Controls & Motion Selectors */`n"
$part2 = $part2Header + ($lines[323..700] -join "`n")
[System.IO.File]::WriteAllText("$outDir/avatar-customizer.css", $part2, [System.Text.Encoding]::UTF8)

# Part 3: personality-test.css (Lines 703 to 821)
$part3Header = "/* Character Creation: Step 2 Personality Test */`n"
$part3 = $part3Header + ($lines[702..820] -join "`n")
[System.IO.File]::WriteAllText("$outDir/personality-test.css", $part3, [System.Text.Encoding]::UTF8)

# Part 4: id-card.css (Lines 823 to 1123)
$part4Header = "/* Character Creation: Step 3 Trader ID Hologram Card */`n"
$part4 = $part4Header + ($lines[822..($lines.Length - 1)] -join "`n")
[System.IO.File]::WriteAllText("$outDir/id-card.css", $part4, [System.Text.Encoding]::UTF8)

# Router: character-creation.css
$routerContent = @"
/* ==========================================================================
   Character Creation Router (CODE_STANDARDS 500-Line Limit Rule)
   Aggregates modularized Character Creation kiosk styling:
   - kiosk-base.css: Modal layout, headers, steppers, preview stage
   - avatar-customizer.css: Swatches, sliders, animations, motion selectors
   - personality-test.css: TPT Question/Option cards and scoring views
   - id-card.css: Hologram Trader ID pass, badge ceremony, stats breakdown
   ========================================================================== */

@import './character/kiosk-base.css';
@import './character/avatar-customizer.css';
@import './character/personality-test.css';
@import './character/id-card.css';
"@
[System.IO.File]::WriteAllText("web/css/modules/character-creation.css", $routerContent, [System.Text.Encoding]::UTF8)

Write-Host "Generated character creation CSS modules successfully."
Get-ChildItem -Path $outDir | Select-Object Name, Length
