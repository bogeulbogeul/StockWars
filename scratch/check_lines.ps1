$files = @(
    'web/js/engine/timeOfDayService.js',
    'web/js/components/sky/SkyBackground.js',
    'web/js/components/office/OfficeSvgTemplate.js',
    'web/js/components/OfficeStage.js',
    'web/js/components/TownStage.js',
    'web/js/components/TopDemoBar.js',
    'web/js/components/MainHUD.js',
    'web/js/main.js',
    'web/css/modules/sky-background.css'
)

foreach ($item in $files) {
    if (Test-Path $item) {
        $cnt = (Get-Content $item).Count
        Write-Output "$item -> $cnt lines"
    } else {
        Write-Output "$item -> NOT FOUND"
    }
}
