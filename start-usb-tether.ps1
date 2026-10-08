# RoadBump - Android USB Tethering & ADB Reverse Port Forwarding Utility
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "         ROADBUMP - ANDROID USB TETHERING & ADB BRIDGE              " -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan

# Locate ADB
$adbPath = "adb"
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    $sdkAdb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
    if (Test-Path $sdkAdb) {
        $adbPath = $sdkAdb
        Write-Host "✔ Found Android SDK ADB at: $adbPath" -ForegroundColor Green
    } else {
        Write-Host "⚠ ADB executable not found in PATH or Android SDK folder." -ForegroundColor Yellow
    }
}

# 1. Check Connected Devices
Write-Host "`n[1/3] Checking connected Android devices via ADB..." -ForegroundColor Cyan
try {
    $devicesOutput = & $adbPath devices
    $devicesOutput | Out-String | Write-Host -ForegroundColor Gray
    
    $hasDevice = ($devicesOutput | Select-String -Pattern "device$")
    if ($hasDevice) {
        Write-Host "✔ Android device detected!" -ForegroundColor Green
        
        Write-Host "`n[2/3] Setting up ADB Reverse Port Forwarding..." -ForegroundColor Cyan
        & $adbPath reverse tcp:3000 tcp:3000
        Write-Host "  ✔ tcp:3000 -> tcp:3000 (React Frontend)" -ForegroundColor Green
        & $adbPath reverse tcp:5000 tcp:5000
        Write-Host "  ✔ tcp:5000 -> tcp:5000 (Express Backend API)" -ForegroundColor Green
    } else {
        Write-Host "ℹ No device currently detected via ADB." -ForegroundColor Yellow
        Write-Host "  Connect your phone with a USB cable and ensure 'USB Debugging' is enabled." -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠ Could not execute ADB: $_" -ForegroundColor Red
}

# 2. Query Network Interfaces for USB Tethering RNDIS IP
Write-Host "`n[3/3] Active Network & USB Tethering IPv4 Interfaces:" -ForegroundColor Cyan
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" 
}

foreach ($item in $ips) {
    Write-Host ("  [{0}] IP: http://{1}:3000" -f $item.InterfaceAlias, $item.IPAddress) -ForegroundColor Green
}

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "HOW TO CONNECT ON YOUR ANDROID PHONE:" -ForegroundColor Yellow
Write-Host "METHOD A (ADB Reverse - Fastest & Zero Config):" -ForegroundColor White
Write-Host "  1. Connect phone with USB cable, allow USB debugging." -ForegroundColor Gray
Write-Host "  2. Open Chrome on Android and visit: http://localhost:3000" -ForegroundColor Green

Write-Host "`nMETHOD B (Android USB Tethering):" -ForegroundColor White
Write-Host "  1. On phone: Settings -> Network/Hotspot -> Turn ON 'USB Tethering'." -ForegroundColor Gray
Write-Host "  2. Open Chrome on Android and browse to your IP address above:" -ForegroundColor Gray
if ($ips) {
    Write-Host ("     http://{0}:3000" -f $ips[0].IPAddress) -ForegroundColor Green
} else {
    Write-Host "     http://<TETHER_IP>:3000" -ForegroundColor Green
}
Write-Host "=====================================================================" -ForegroundColor Cyan
