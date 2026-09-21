Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"
$file = "media_1789456231270.png"
$bmp = New-Object System.Drawing.Bitmap((Join-Path $baseDir $file))

# Project all non-transparent pixels vertically to find column gaps
$colCounts = New-Object int[] $bmp.Width
for ($x = 0; $x -lt $bmp.Width; $x++) {
    $count = 0
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        if ($bmp.GetPixel($x, $y).A -gt 20) {
            $count++
        }
    }
    $colCounts[$x] = $count
}

# Print valleys (where count is near 0 or minimum)
for ($x = 0; $x -lt $bmp.Width; $x++) {
    if ($colCounts[$x] -eq 0 -or ($x % 20 -eq 0)) {
        Write-Host "X=$x : PixelCount=$($colCounts[$x])"
    }
}

$bmp.Dispose()
