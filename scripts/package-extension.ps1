$ErrorActionPreference = 'Stop'
npm run build
$zip = Join-Path (Get-Location) 'SubtitleFlow-extension.zip'
if (Test-Path $zip) { Remove-Item -Force $zip }
Compress-Archive -Path 'dist\*' -DestinationPath $zip -CompressionLevel Optimal
Write-Output "Created $zip"
