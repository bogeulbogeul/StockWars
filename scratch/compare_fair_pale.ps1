Add-Type -AssemblyName System.Drawing

$baseDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\dbc93132-94f3-4940-836f-bddd85e738d0\.user_uploaded"
$pale = New-Object System.Drawing.Bitmap((Join-Path $baseDir "media_1789453620742.png"))
$fair = New-Object System.Drawing.Bitmap((Join-Path $baseDir "media_1789453620850.png"))

# Sample the top underwear in column 0 (around x: 128, y: 320 in Fair vs Pale)
Write-Host "Underwear top col 0: Fair=$($fair.GetPixel(128, 320)) | Pale=$($pale.GetPixel(128, 320))"
Write-Host "Forehead col 0: Fair=$($fair.GetPixel(128, 160)) | Pale=$($pale.GetPixel(128, 160))"
Write-Host "Arm col 0: Fair=$($fair.GetPixel(60, 360)) | Pale=$($pale.GetPixel(60, 360))"

$pale.Dispose()
$fair.Dispose()
