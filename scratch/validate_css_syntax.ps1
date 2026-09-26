$cssFiles = Get-ChildItem -Path web/css -Recurse -Include *.css

$errors = 0
foreach ($f in $cssFiles) {
    $text = [System.IO.File]::ReadAllText($f.FullName)
    
    # Check brace balance
    $openCount = ($text.ToCharArray() | Where-Object { $_ -eq '{' }).Count
    $closeCount = ($text.ToCharArray() | Where-Object { $_ -eq '}' }).Count
    
    # Check comment pairs
    $openComments = [regex]::Matches($text, "/\*").Count
    $closeComments = [regex]::Matches($text, "\*/").Count
    
    $rel = $f.FullName.Replace((Get-Location).Path + "\", "")
    
    if ($openCount -ne $closeCount) {
        Write-Host "ERROR in $($rel) - Open braces ($openCount) != Close braces ($closeCount)" -ForegroundColor Red
        $errors++
    }
    if ($openComments -ne $closeComments) {
        Write-Host "ERROR in $($rel) - Open comments ($openComments) != Close comments ($closeComments)" -ForegroundColor Red
        $errors++
    }
}

if ($errors -eq 0) {
    Write-Host "CSS Syntax Validation Passed for all $($cssFiles.Count) CSS files!" -ForegroundColor Green
} else {
    Write-Host "CSS Syntax Validation Failed with $errors errors." -ForegroundColor Red
}
