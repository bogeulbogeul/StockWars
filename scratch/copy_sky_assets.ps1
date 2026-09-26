$srcDir = "C:\Users\Administrator\.gemini\antigravity-ide\brain\55929f9f-455c-4f12-8b4c-3002acd2c56d\.user_uploaded"
$destDir = "c:\Users\Administrator\Documents\GitHub\StockWars\web\assets\sky"

if (!(Test-Path -Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

Copy-Item -Path "$srcDir\media_1790355383215.png" -Destination "$destDir\sky_dawn.png" -Force
Copy-Item -Path "$srcDir\media_1790355439402.png" -Destination "$destDir\sky_day.png" -Force
Copy-Item -Path "$srcDir\media_1790355383148.png" -Destination "$destDir\sky_sunset.png" -Force
Copy-Item -Path "$srcDir\media_1790355383413.png" -Destination "$destDir\sky_night.png" -Force

Get-ChildItem -Path $destDir | Select-Object Name, Length
