$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8080/")
$listener.Start()
Write-Host "Listening on http://127.0.0.1:8080/ ..."
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        
        # Safe decoding of local path
        $decodedPath = [System.Uri]::UnescapeDataString($urlPath)
        $filePath = Join-Path "c:\Users\Administrator\Documents\GitHub\StockWars\WebPrototype" $decodedPath.Substring(1)
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Determine content type
            $ext = [System.IO.Path]::GetExtension($filePath)
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                default { "application/octet-stream" }
            }
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errorMessage = "File not found: $decodedPath"
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes($errorMessage)
            $response.ContentType = "text/plain; charset=utf-8"
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
