$files = Get-ChildItem -Recurse -Filter *.js web/js
foreach ($f in $files) {
    $content = [System.IO.File]::ReadAllText($f.FullName)
    
    # Count braces
    $openCurly = ($content.ToCharArray() | Where-Object { $_ -eq '{' }).Count
    $closeCurly = ($content.ToCharArray() | Where-Object { $_ -eq '}' }).Count
    if ($openCurly -ne $closeCurly) {
        Write-Host "MISMATCH CURLY ($openCurly vs $closeCurly): $($f.FullName)"
    }
    
    $openParen = ($content.ToCharArray() | Where-Object { $_ -eq '(' }).Count
    $closeParen = ($content.ToCharArray() | Where-Object { $_ -eq ')' }).Count
    if ($openParen -ne $closeParen) {
        Write-Host "MISMATCH PAREN ($openParen vs $closeParen): $($f.FullName)"
    }

    $openSquare = ($content.ToCharArray() | Where-Object { $_ -eq '[' }).Count
    $closeSquare = ($content.ToCharArray() | Where-Object { $_ -eq ']' }).Count
    if ($openSquare -ne $closeSquare) {
        Write-Host "MISMATCH SQUARE ($openSquare vs $closeSquare): $($f.FullName)"
    }
}
