$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "git.exe"
$psi.Arguments = "show f1df968:web/css/modules/town-stage.css"
$psi.RedirectStandardOutput = $true
$psi.UseShellExecute = $false
$psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8

$p = [System.Diagnostics.Process]::Start($psi)
$content = $p.StandardOutput.ReadToEnd()
$p.WaitForExit()

[System.IO.File]::WriteAllText("scratch/git_orig_town_stage.css", $content, [System.Text.Encoding]::UTF8)
Write-Host "Saved git orig town-stage.css. Total lines: $(($content -split "`r?`n").Length)"
