param([string]$ProxyUrl = '', [string]$NodePath = 'node')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$nodeExecutable = (Get-Command $NodePath -ErrorAction Stop).Source
if (Get-NetTCPConnection -LocalPort 3005 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 3005 is occupied. Stop the existing project preview before starting another.' }
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot '.next\BUILD_ID'))) { throw 'Run npm run build first.' }
if ($ProxyUrl) {
  $parsedProxy = [Uri]$ProxyUrl
  if ($parsedProxy.Scheme -notin @('http','https') -or $parsedProxy.UserInfo) { throw 'Use an HTTP(S) proxy URL without credentials.' }
  $env:HTTPS_PROXY = $ProxyUrl
  $env:HTTP_PROXY = $ProxyUrl
  $env:NO_PROXY = 'localhost,127.0.0.1,::1'
}
$nodeArguments = @()
if ($env:HTTPS_PROXY -or $env:HTTP_PROXY) {
  if ((& $nodeExecutable --version) -notmatch '^v(2[4-9]|[3-9][0-9])\.') { throw 'Proxy mode requires Node.js 24.5 or newer; this project was checked with Node 24.16.' }
  $nodeArguments += '--use-env-proxy'
}
$workDirectory = Join-Path $projectRoot 'work'
New-Item -ItemType Directory -Force -Path $workDirectory | Out-Null
$nextScript = Join-Path $projectRoot 'node_modules\next\dist\bin\next'
$nodeArguments += @(('"{0}"' -f $nextScript), 'start','--hostname','127.0.0.1','--port','3005')
$preview = Start-Process -FilePath $nodeExecutable -ArgumentList $nodeArguments -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $workDirectory 'europe-preview.stdout.log') -RedirectStandardError (Join-Path $workDirectory 'europe-preview.stderr.log') -PassThru
$preview.Id | Set-Content (Join-Path $workDirectory 'europe-preview.pid')
Write-Output "Preview process started: PID $($preview.Id), http://127.0.0.1:3005. Check work/europe-preview.stderr.log if unavailable."
