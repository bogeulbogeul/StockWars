Add-Type -AssemblyName System.Drawing

$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"
$femaleFile = "media_1789449863748.png"
$testOutDir = "c:\Users\Administrator\Documents\GitHub\StockWars\scratch\test_female_skins"
if (-not (Test-Path $testOutDir)) { New-Item -ItemType Directory -Path $testOutDir -Force }

$srcPath = Join-Path $srcDir $femaleFile
$srcBmp = New-Object System.Drawing.Bitmap($srcPath)
$w = $srcBmp.Width
$h = $srcBmp.Height

# We define the 5 target skin tone color transfer profiles
# Each profile defines how input relative luminance (0.0=shadows/lines -> 1.0=pure highlights) maps to RGB
$profiles = @{
    "pale" = @{
        # Base/highlights
        high = @(253, 243, 238)
        mid  = @(245, 222, 216)
        low  = @(220, 182, 175)
        line = @(130, 85, 80)
    }
    "fair" = @{
        high = @(254, 237, 225)
        mid  = @(246, 212, 194)
        low  = @(222, 172, 150)
        line = @(125, 75, 65)
    }
    "natural" = @{
        high = @(247, 213, 185)
        mid  = @(234, 186, 150)
        low  = @(202, 142, 106)
        line = @(108, 62, 42)
    }
    "tan" = @{
        high = @(231, 184, 144)
        mid  = @(212, 154, 110)
        low  = @(174, 112, 70)
        line = @(90, 48, 28)
    }
    "deep" = @{
        high = @(162, 106, 78)
        mid  = @(138, 84, 56)
        low  = @(105, 58, 36)
        line = @(58, 28, 16)
    }
}

function Interpolate-Color($val, $p) {
    # val is 0.0 to 1.0 (relative luminance in skin range)
    # val >= 0.8: between mid and high
    # val >= 0.4: between low and mid
    # val < 0.4: between line and low
    $r = 0; $g = 0; $b = 0
    if ($val -ge 0.8) {
        $t = ($val - 0.8) / 0.2
        $r = $p.mid[0] + ($p.high[0] - $p.mid[0]) * $t
        $g = $p.mid[1] + ($p.high[1] - $p.mid[1]) * $t
        $b = $p.mid[2] + ($p.high[2] - $p.mid[2]) * $t
    } elseif ($val -ge 0.35) {
        $t = ($val - 0.35) / 0.45
        $r = $p.low[0] + ($p.mid[0] - $p.low[0]) * $t
        $g = $p.low[1] + ($p.mid[1] - $p.low[1]) * $t
        $b = $p.low[2] + ($p.mid[2] - $p.low[2]) * $t
    } else {
        $t = $val / 0.35
        $r = $p.line[0] + ($p.low[0] - $p.line[0]) * $t
        $g = $p.line[1] + ($p.low[1] - $p.line[1]) * $t
        $b = $p.line[2] + ($p.low[2] - $p.line[2]) * $t
    }
    
    return [System.Drawing.Color]::FromArgb(
        [Math]::Min(255, [Math]::Max(0, [int]$r)),
        [Math]::Min(255, [Math]::Max(0, [int]$g)),
        [Math]::Min(255, [Math]::Max(0, [int]$b))
    )
}

foreach ($skinKey in @("pale", "fair", "natural", "tan", "deep")) {
    $p = $profiles[$skinKey]
    $outBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $orig = $srcBmp.GetPixel($x, $y)
            $r = $orig.R; $g = $orig.G; $b = $orig.B
            
            $minVal = [Math]::Min($r, [Math]::Min($g, $b))
            $maxVal = [Math]::Max($r, [Math]::Max($g, $b))
            $diff = $maxVal - $minVal
            
            # Is background? (Near pure white)
            $isBg = ($minVal -gt 248) -and ($diff -lt 8)
            
            # Is underwear? (Neutral grayish/white, diff is small, in torso area)
            # Underwear has very low saturation ($diff <= 10) even when shaded (grayish 210-245)
            $isUnderwear = ($diff -le 10) -and ($minVal -ge 190) -and -not $isBg
            
            if ($isBg) {
                # Keep background white
                $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
            } elseif ($isUnderwear) {
                # Keep underwear pristine white/neutral
                $outBmp.SetPixel($x, $y, $orig)
            } else {
                # This is skin or skin-linework!
                # Calculate normalized brightness of original skin pixel
                # Original pale skin ranges roughly from 120 (darkest line) to 253 (brightest highlight)
                $lum = ($r * 0.299 + $g * 0.587 + $b * 0.114)
                $normLum = ($lum - 100.0) / (253.0 - 100.0)
                if ($normLum -lt 0.0) { $normLum = 0.0 }
                if ($normLum -gt 1.0) { $normLum = 1.0 }
                
                $newColor = Interpolate-Color $normLum $p
                $outBmp.SetPixel($x, $y, $newColor)
            }
        }
    }
    
    $dstPath = Join-Path $testOutDir "female_sheet_$skinKey.png"
    $outBmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Generated test sheet: $dstPath"
    $outBmp.Dispose()
}

$srcBmp.Dispose()
Write-Host "All test sheets generated!"
