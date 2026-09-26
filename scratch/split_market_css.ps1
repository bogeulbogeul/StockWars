$content = [System.IO.File]::ReadAllText("web/css/modules/stock-market.css", [System.Text.Encoding]::UTF8)
$lines = $content -split "`r?`n"

$outDir = "web/css/modules/market"
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

# Part 1: market-header.css (Lines 1 to 241)
$p1 = "/* Stock Market: Header, Ticker Marquee, Summary Cards & Hot Stocks */`n" + ($lines[0..240] -join "`n")
[System.IO.File]::WriteAllText("$outDir/market-header.css", $p1, [System.Text.Encoding]::UTF8)

# Part 2: market-list.css (Lines 242 to 411)
$p2 = "/* Stock Market: Search, Sector Chips, Sort Controls, Stock Rows & News Feed */`n" + ($lines[241..410] -join "`n")
[System.IO.File]::WriteAllText("$outDir/market-list.css", $p2, [System.Text.Encoding]::UTF8)

# Part 3: market-portfolio.css (Lines 412 to 637)
$p3 = "/* Stock Market: Profile, Sector Allocation Donut Chart, Portfolio List & Nav Bar */`n" + ($lines[411..($lines.Length - 1)] -join "`n")
[System.IO.File]::WriteAllText("$outDir/market-portfolio.css", $p3, [System.Text.Encoding]::UTF8)

# Router: stock-market.css
$routerContent = @"
/* ==========================================================================
   Stock Market App Router (CODE_STANDARDS 500-Line Limit Rule)
   Aggregates modularized HTS UI styling:
   - market-header.css: App header, ticker marquee, net worth summary cards, hot stocks
   - market-list.css: Search filter, sector chips, sort controls, stock rows, news feed
   - market-portfolio.css: Profile overview, donut sector allocation chart, portfolio list, bottom navigation
   ========================================================================== */

@import './market/market-header.css';
@import './market/market-list.css';
@import './market/market-portfolio.css';
"@
[System.IO.File]::WriteAllText("web/css/modules/stock-market.css", $routerContent, [System.Text.Encoding]::UTF8)

Write-Host "Generated market CSS modules successfully."
Get-ChildItem -Path $outDir | Select-Object Name, Length
