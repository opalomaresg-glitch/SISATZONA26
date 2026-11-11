param([switch]$NoAbrir)
# Abre la app de la carpeta "sitio" en http://localhost:8080 para verla en tu computadora.
# Deja esta ventana abierta mientras la uses; al cerrarla, el sitio deja de estar disponible.
$Root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'sitio'))
$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.webmanifest'='application/manifest+json'; '.json'='application/json'; '.svg'='image/svg+xml'; '.png'='image/png'; '.css'='text/css; charset=utf-8' }
$l = $null; $Port = 0
foreach ($p in 8080..8085) {
  try { $t = New-Object System.Net.HttpListener; $t.Prefixes.Add("http://localhost:$p/"); $t.Start(); $l = $t; $Port = $p; break } catch { }
}
if (-not $l) { Write-Output 'No se pudo abrir un puerto local (8080 a 8085 ocupados).'; exit 1 }
Write-Output "Sitio disponible en http://localhost:$Port/  (cierre esta ventana para detenerlo)"
if (-not $NoAbrir) { Start-Process "http://localhost:$Port/" }
while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    $p = [System.Uri]::UnescapeDataString($c.Request.Url.AbsolutePath)
    if ($p.EndsWith('/')) { $p += 'index.html' }
    $f = [System.IO.Path]::GetFullPath((Join-Path $Root ($p.TrimStart('/') -replace '/', '\')))
    if ($f.StartsWith($Root) -and (Test-Path -LiteralPath $f -PathType Leaf)) {
      $b = [System.IO.File]::ReadAllBytes($f)
      $ext = [System.IO.Path]::GetExtension($f).ToLower()
      $c.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $c.Response.ContentLength64 = $b.Length
      $c.Response.OutputStream.Write($b, 0, $b.Length)
    } else { $c.Response.StatusCode = 404 }
  } catch { $c.Response.StatusCode = 500 }
  $c.Response.Close()
}
