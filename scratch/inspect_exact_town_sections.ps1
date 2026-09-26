$orig = [System.IO.File]::ReadAllText("scratch/git_orig_town_stage.css", [System.Text.Encoding]::UTF8)
$origLines = $orig -split "`r?`n"

Write-Host "Total original lines: $($origLines.Length)"

# Let's inspect sections:
# 1. Base / Stage / Parallax / HUD / World track: Lines 1 to 183
# 2. Buildings layer & 6 building styles: Lines 184 to 435
# 3. Interactive props (Benches, Electronic Billboard & LEDs): Lines 436 to 791
# 4. Street Props (Lamps, Trees, Signs, Ground Sidewalk & Road): Lines 792 to 964
# 5. Character, healing particles, resting poses, prompts, toasts: Lines 965 to 1171
# 6. Modal & Gateways: Lines 1172 to 1527

Write-Host "`nSection 1 (1-183): $($origLines[0]) ... $($origLines[182])"
Write-Host "Section 2 (184-435): $($origLines[183]) ... $($origLines[434])"
Write-Host "Section 3 (436-791): $($origLines[435]) ... $($origLines[790])"
Write-Host "Section 4 (792-964): $($origLines[791]) ... $($origLines[963])"
Write-Host "Section 5 (965-1171): $($origLines[964]) ... $($origLines[1170])"
Write-Host "Section 6 (1172-1527): $($origLines[1171]) ... $($origLines[1526])"
