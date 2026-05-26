# split_rumors.ps1
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$docsDir = "c:\Users\Administrator\Documents\GitHub\StockWars\Docs"

# Helper function to extract full and short sector names from the original header line
function Get-SectorNames($line) {
    # e.g., "## 📑 1. IT 섹터 (Information Technology)" -> "IT 섹터 (Information Technology)"
    $fullName = $line -replace '^##\s+\S+\s+\d+\.\s+', ''
    # Short name (remove everything starting with parenthesis) -> "IT 섹터"
    $shortName = $fullName -replace '\s*\(.*$', ''
    return @{ Full = $fullName; Short = $shortName }
}

# ----------------- MOD_GDD_19 Split -----------------
$file19 = Join-Path $docsDir "MOD_GDD_19_IPORumorLibrary.md"
$lines19 = Get-Content -Path $file19 -Encoding utf8

$headers19 = @()
for ($i=0; $i -lt $lines19.Count; $i++) {
    if ($lines19[$i] -match "^##\s+\S+\s+\d+\.\s+") {
        $headers19 += [PSCustomObject]@{
            Index = $i
            Line = $lines19[$i]
        }
    }
}

$sectorNames19 = @(
    "IT", "Mobility", "Distribution", "Energy", "Finance", "Bio", "Infrastructure", "MediaArts"
)

for ($j=0; $j -lt $headers19.Count; $j++) {
    $start = $headers19[$j].Index
    $end = if ($j -eq $headers19.Count - 1) { $lines19.Count } else { $headers19[$j+1].Index }
    
    $sectorLines = $lines19[$start..($end-1)]
    $sectorText = $sectorLines -join "`r`n"
    
    $sectorNum = $j + 1
    $sectorCode = $sectorNames19[$j]
    $outFileName = "MOD_GDD_19_${sectorNum}_IPORumor_${sectorCode}.md"
    $outPath = Join-Path $docsDir $outFileName
    
    $originalHeaderLine = $headers19[$j].Line
    $sectorNames = Get-SectorNames $originalHeaderLine
    $shortName = $sectorNames.Short
    $fullName = $sectorNames.Full
    
    $headerText = @"
# StockWars GDD: [MOD_GDD_19_${sectorNum}] IPO 찌라시 - ${shortName}

**문서 번호:** MOD_GDD_19_${sectorNum}  
**상위 기획:** [MOD_GDD_19_0: IPO 종목 찌라시 라이브러리 인덱스](MOD_GDD_19_0_IPORumorIndex.md)  
**대상 섹터:** ${fullName}

---

"@
    
    $finalContent = $headerText + $sectorText
    [System.IO.File]::WriteAllText($outPath, $finalContent, [System.Text.Encoding]::UTF8)
    Write-Host "Created IPO sector file: $outFileName"
}

# ----------------- MOD_GDD_04 Split -----------------
$file04 = Join-Path $docsDir "MOD_GDD_04_RumorLibrary.md"
$lines04 = Get-Content -Path $file04 -Encoding utf8

$ranges04 = @(
    @{ Start = 22; End = 116; Name = "IT"; Num = 1 },
    @{ Start = 116; End = 210; Name = "Entertainment"; Num = 2 },
    @{ Start = 210; End = 304; Name = "Infrastructure"; Num = 3 },
    @{ Start = 304; End = 398; Name = "Bio"; Num = 4 },
    @{ Start = 398; End = 504; Name = "Aerospace"; Num = 5 },
    @{ Start = 504; End = 600; Name = "Distribution"; Num = 6 },
    @{ Start = 600; End = 654; Name = "Energy"; Num = 7 },
    @{ Start = 654; End = $lines04.Count + 1; Name = "Finance"; Num = 8 }
)

foreach ($range in $ranges04) {
    $startIdx = $range.Start - 1
    $endIdx = $range.End - 2
    
    $sectorLines = $lines04[$startIdx..$endIdx]
    $sectorText = $sectorLines -join "`r`n"
    
    $sectorNum = $range.Num
    $sectorCode = $range.Name
    $outFileName = "MOD_GDD_04_${sectorNum}_Rumor_${sectorCode}.md"
    $outPath = Join-Path $docsDir $outFileName
    
    $originalHeaderLine = $sectorLines[0]
    $sectorNames = Get-SectorNames $originalHeaderLine
    $shortName = $sectorNames.Short
    $fullName = $sectorNames.Full
    
    $headerText = @"
# StockWars GDD: [MOD_GDD_04_${sectorNum}] 유니버설 찌라시 - ${shortName}

**문서 번호:** MOD_GDD_04_${sectorNum}  
**상위 기획:** [MOD_GDD_04_0: 유니버설 찌라시 라이브러리 인덱스](MOD_GDD_04_0_RumorIndex.md)  
**대상 섹터:** ${fullName}

---

"@
    
    $finalContent = $headerText + $sectorText
    [System.IO.File]::WriteAllText($outPath, $finalContent, [System.Text.Encoding]::UTF8)
    Write-Host "Created Universal sector file: $outFileName"
}
