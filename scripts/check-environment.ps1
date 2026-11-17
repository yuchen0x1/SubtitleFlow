$ErrorActionPreference = 'Continue'
Write-Output "Node: $(node --version)"
Write-Output "npm: $(npm --version)"
Write-Output "Python: $(python --version 2>&1)"
Write-Output "Workspace: $(Get-Location)"
if (Test-Path 'node_modules') { Write-Output 'node_modules: present' } else { Write-Output 'node_modules: missing' }
if (Test-Path 'apps\local-service\requirements.txt') { Write-Output 'Local service requirements: present' }
