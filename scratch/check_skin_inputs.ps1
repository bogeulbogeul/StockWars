Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"

$maleFiles = @{
    "pale"    = "media_1789449323564.png"
    "fair"    = "media_1789449332978.png"
    "natural" = "media_1789449351209.png"
    "tan"     = "media_1789449365091.png"
    "deep"    = "media_1789449387468.png"
}

$femaleFile = "media_1789449863748.png"

# Check dimensions
$fBmp = New-Object System.Drawing.Bitmap((Join-Path $baseDir $femaleFile))
Write-Host "Female image dimensions: $($fBmp.Width) x $($fBmp.Height)"
$fBmp.Dispose()

foreach ($key in $maleFiles.Keys) {
    $mBmp = New-Object System.Drawing.Bitmap((Join-Path $baseDir $maleFiles[$key]))
    Write-Host "Male $key dimensions: $($mBmp.Width) x $($mBmp.Height)"
    $mBmp.Dispose()
}
