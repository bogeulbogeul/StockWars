$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "git.exe"
$psi.Arguments = "show HEAD:web/js/components/SmartphoneUI.js"
$psi.RedirectStandardOutput = $true
$psi.UseShellExecute = $false
$psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8

$p = [System.Diagnostics.Process]::Start($psi)
$content = $p.StandardOutput.ReadToEnd()
$p.WaitForExit()

[System.IO.File]::WriteAllText("scratch/original_SmartphoneUI.js", $content, [System.Text.Encoding]::UTF8)
Write-Host "Saved original SmartphoneUI.js to scratch/original_SmartphoneUI.js. Total lines: $(($content -split "`r?`n").Length)"
