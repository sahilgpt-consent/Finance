# Tiny static web server for local testing (no Python or Node needed).
# Run:  powershell -ExecutionPolicy Bypass -File serve.ps1      then open http://localhost:8080/
param([int]$Port = 8080)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mime = @{ '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8';
           '.json' = 'application/json'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.ico' = 'image/x-icon'; '.txt' = 'text/plain' }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/  (Ctrl+C to stop)"
try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
        if ($path -eq '' -or $path.EndsWith('/')) { $path += 'index.html' }
        $file = [IO.Path]::GetFullPath((Join-Path $root $path))
        if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
            $ctx.Response.StatusCode = 404
            $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
        } else {
            $bytes = [IO.File]::ReadAllBytes($file)
            $ext = [IO.Path]::GetExtension($file).ToLower()
            if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] } else { $ctx.Response.ContentType = 'application/octet-stream' }
        }
        try {
            $ctx.Response.Headers.Add('Cache-Control', 'no-store')
            $ctx.Response.ContentLength64 = $bytes.Length
            if ($ctx.Request.HttpMethod -ne 'HEAD') { $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length) }
            Write-Host "$($ctx.Response.StatusCode) $($ctx.Request.HttpMethod) /$path"
        } catch {
            Write-Host "Request failed: $($_.Exception.Message)"
        } finally {
            try { $ctx.Response.Close() } catch {}
        }
    }
} finally { $listener.Stop() }
