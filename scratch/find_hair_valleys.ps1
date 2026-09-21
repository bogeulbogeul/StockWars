Add-Type -AssemblyName System.Drawing
$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\0415e4d4-6a74-4c66-aab6-731ecd9b95d7\.user_uploaded"

$files = @(
    @{ id="bob"; file="media_1789463644338.png" },
    @{ id="long"; file="media_1789463644394.png" },
    @{ id="ponytail"; file="media_1789463644478.png" },
    @{ id="short"; file="media_1789463644510.png" }
)

foreach ($f in $files) {
    $bmp = New-Object System.Drawing.Bitmap((Join-Path $srcDir $f.file))
    Write-Host "`n================================================="
    Write-Host "Analyzing Alpha Profile for $($f.id) ($($f.file)) - Width: $($bmp.Width), Height: $($bmp.Height)"
    
    $colAlphas = @()
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $count = 0
        for ($y = 0; $y -lt $bmp.Height; $y++) {
            if ($bmp.GetPixel($x, $y).A -gt 15) { $count++ }
        }
        $colAlphas += $count
    }

    # Find connected components / segments where $colAlphas > 0
    $inSeg = $false
    $segStart = 0
    $segments = @()
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        if ($colAlphas[$x] -gt 0 -and -not $inSeg) {
            $inSeg = $true
            $segStart = $x
        } elseif ($colAlphas[$x] -eq 0 -and $inSeg) {
            $inSeg = $false
            $segments += @{ Start=$segStart; End=($x - 1); Width=($x - $segStart) }
        }
    }
    if ($inSeg) {
        $segments += @{ Start=$segStart; End=($bmp.Width - 1); Width=($bmp.Width - $segStart) }
    }

    Write-Host "Found $($segments.Count) segments with gap=0:"
    for ($i = 0; $i -lt $segments.Count; $i++) {
        $s = $segments[$i]
        Write-Host "  Segment ${i}: Start=$($s.Start), End=$($s.End), Width=$($s.Width)"
    }

    # If < 4 segments, check local minima valleys
    if ($segments.Count -lt 4) {
        Write-Host "Checking local minima valleys around X=256, 512, 768:"
        for ($target = 256; $target -le 768; $target += 256) {
            $minVal = 9999
            $minX = $target
            for ($x = [Math]::Max(0, $target - 60); $x -le [Math]::Min($bmp.Width - 1, $target + 60); $x++) {
                if ($colAlphas[$x] -lt $minVal) {
                    $minVal = $colAlphas[$x]
                    $minX = $x
                }
            }
            Write-Host "  Near X=$target -> Minimum at X=$minX (alpha count = $minVal)"
        }
    }

    $bmp.Dispose()
}
