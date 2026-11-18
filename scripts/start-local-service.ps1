param([string]$Model = 'small', [ValidateSet('cpu','cuda')][string]$Device = 'cpu')
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $taskRoot
$taskPython = Join-Path $taskRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $taskPython)) {
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        uv venv --seed --python 3.11 .venv
    } else {
        py -3.11 -m venv .venv
    }
    if ($LASTEXITCODE -ne 0) { throw '需要 Python 3.11，请先安装 Python 3.11 后重试。' }
}
& $taskPython -m pip install -r apps/local-service/requirements.txt
if ($LASTEXITCODE -ne 0) { throw '本地服务依赖安装失败' }
$env:SUBTITLEFLOW_MODEL_SIZE = $Model
$env:SUBTITLEFLOW_DEVICE = $Device
Write-Output '本地服务监听 127.0.0.1:8765。首次识别将下载并加载 Whisper 模型，扩展建议设置 120000ms 超时。'
& $taskPython -m uvicorn app.main:app --app-dir apps/local-service --host 127.0.0.1 --port 8765
