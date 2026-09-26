$categories = @{
    "Town System JS" = "web/js/components/town/*.js", "web/js/components/TownStage.js", "web/js/data/townWorldData.js"
    "Town System CSS" = "web/css/modules/town/*.css", "web/css/modules/town-stage.css"
    "Smartphone HTS JS" = "web/js/components/smartphone/*.js", "web/js/components/SmartphoneUI.js"
    "Stock Market CSS" = "web/css/modules/market/*.css", "web/css/modules/stock-market.css"
    "Logistics Game JS" = "web/js/components/logistics/*.js", "web/js/components/LogisticsMiniGame.js"
    "Logistics Game CSS" = "web/css/modules/logistics/*.css", "web/css/modules/logistics-game.css"
    "Character System JS" = "web/js/components/character/*.js", "web/js/components/CharacterCreation.js"
    "Character System CSS" = "web/css/modules/character/*.css", "web/css/modules/character-creation.css"
    "Office Stage JS" = "web/js/components/office/*.js", "web/js/components/OfficeStage.js"
    "Trade Modal JS" = "web/js/components/trade/*.js", "web/js/components/TradeModal.js"
}

foreach ($cat in $categories.Keys) {
    Write-Host "`n=== $cat ===" -ForegroundColor Cyan
    foreach ($pattern in $categories[$cat]) {
        Get-ChildItem -Path $pattern | ForEach-Object {
            $lines = [System.IO.File]::ReadAllLines($_.FullName).Length
            Write-Host ("{0,-45} : {1,4} lines" -f $_.Name, $lines)
        }
    }
}
