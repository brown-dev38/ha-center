#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Fix IIS reverse proxy for /system-rls → http://127.0.0.1:3003/system-rls

.DESCRIPTION
  Run this ON the production server (svr-ha-uph / 10.160.21.104)
  in elevated PowerShell:

    cd C:\ha-center
    Set-ExecutionPolicy -Scope Process Bypass
    .\deploy\fix-iis-system-rls-proxy.ps1

  What it does:
  1) Verify system-rls listens on :3003
  2) Enable ARR proxy
  3) Ensure web.config proxy rules exist on the IIS site physical path
  4) iisreset + smoke tests
#>

$ErrorActionPreference = 'Stop'
$appcmd = Join-Path $env:windir 'System32\inetsrv\appcmd.exe'
$sourceWebConfig = Join-Path $PSScriptRoot '..\web.config' | Resolve-Path -ErrorAction SilentlyContinue

if (-not (Test-Path $appcmd)) {
  throw "IIS appcmd not found. Install IIS + URL Rewrite + ARR on this server."
}

Write-Host "=== Host ===" -ForegroundColor Cyan
hostname
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -like '10.*' } |
  ForEach-Object { "IP: $($_.IPAddress)" }

Write-Host "`n=== Check ports ===" -ForegroundColor Cyan
$listen = netstat -ano | Select-String 'LISTENING' | Select-String ':3000|:3003|:80 '
$listen
if (-not ($listen | Select-String ':3003')) {
  Write-Warning "Nothing listening on :3003 — start system-rls first (pm2 start)."
}

Write-Host "`n=== Enable ARR proxy ===" -ForegroundColor Cyan
& $appcmd set config -section:system.webServer/proxy /enabled:true /commit:apphost
& $appcmd set config -section:system.webServer/proxy /preserveHostHeader:true /commit:apphost
Write-Host "ARR proxy enabled."

Write-Host "`n=== IIS sites / vdirs ===" -ForegroundColor Cyan
& $appcmd list site
& $appcmd list vdir

# Prefer site whose physical path contains ha-center, else Default Web Site /
$vdirXml = & $appcmd list vdir /xml
$paths = @()
if ($vdirXml) {
  try {
    [xml]$xml = $vdirXml
    foreach ($n in $xml.SelectNodes('//VDIR')) {
      $paths += [pscustomobject]@{
        Path = $n.GetAttribute('path')
        PhysicalPath = $n.GetAttribute('physicalPath')
      }
    }
  } catch {
    # fallback parse text
  }
}

$targetRoot = $null
$preferred = $paths | Where-Object { $_.PhysicalPath -match 'ha-center' } | Select-Object -First 1
if ($preferred) {
  $targetRoot = $preferred.PhysicalPath
} elseif (Test-Path 'C:\ha-center') {
  $targetRoot = 'C:\ha-center'
} else {
  $rootVdir = $paths | Where-Object { $_.Path -eq '/' -or $_.Path -like '*/' } | Select-Object -First 1
  if ($rootVdir) { $targetRoot = $rootVdir.PhysicalPath }
}

if (-not $targetRoot) {
  throw "Cannot detect IIS physical path. Set site Physical Path to C:\ha-center manually."
}

Write-Host "`n=== Target IIS physical path: $targetRoot ===" -ForegroundColor Cyan

$webConfigBody = @'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="PatientBed_Proxy" stopProcessing="true">
          <match url="^patient-bed(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:3002/patient-bed{R:1}" appendQueryString="true" />
        </rule>
        <rule name="SystemRLS_Proxy" stopProcessing="true">
          <match url="^system-rls(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:3003/system-rls{R:1}" appendQueryString="true" />
        </rule>
        <rule name="HA_Proxy" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:3000/{R:1}" appendQueryString="true" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
'@

$destConfig = Join-Path $targetRoot 'web.config'
$backup = Join-Path $targetRoot ("web.config.bak-{0:yyyyMMdd-HHmmss}" -f (Get-Date))
if (Test-Path $destConfig) {
  Copy-Item $destConfig $backup -Force
  Write-Host "Backed up existing web.config -> $backup"
}

# If C:\ha-center\web.config exists and target is different, still write the known-good config to target
Set-Content -Path $destConfig -Value $webConfigBody -Encoding UTF8
Write-Host "Wrote proxy web.config -> $destConfig"

# Also sync C:\ha-center\web.config if folder exists
if ((Test-Path 'C:\ha-center') -and ($targetRoot -ne 'C:\ha-center')) {
  Set-Content -Path 'C:\ha-center\web.config' -Value $webConfigBody -Encoding UTF8
  Write-Host "Also synced C:\ha-center\web.config"
}

Write-Host "`n=== iisreset ===" -ForegroundColor Cyan
iisreset

Start-Sleep -Seconds 2

Write-Host "`n=== Smoke tests ===" -ForegroundColor Cyan
function Show-Head($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -TimeoutSec 10 -MaximumRedirection 0
    "{0} => {1}" -f $url, [int]$r.StatusCode
  } catch {
    $code = 0
    try { $code = [int]$_.Exception.Response.StatusCode } catch {}
    if ($code -gt 0) { "{0} => {1}" -f $url, $code }
    else { "{0} => FAIL {1}" -f $url, $_.Exception.Message }
  }
}

Show-Head 'http://127.0.0.1:3003/system-rls'
Show-Head 'http://127.0.0.1/system-rls'
Show-Head 'https://hacenter.uph.up.ac.th/system-rls'

Write-Host "`nDone." -ForegroundColor Green
Write-Host "Open: https://hacenter.uph.up.ac.th/system-rls"
Write-Host "If still IIS 404: IIS Manager -> site Physical Path must be: $targetRoot"
Write-Host "And confirm URL Rewrite + ARR modules are installed."
