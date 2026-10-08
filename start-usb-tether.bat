@echo off
title RoadBump - Android USB Tethering ^& ADB Bridge
color 0B

echo =====================================================================
echo           ROADBUMP - ANDROID USB TETHERING ^& ADB BRIDGE
echo =====================================================================
echo.

:: Detect ADB path
set "ADB_EXE=adb"
where adb >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
        set "ADB_EXE=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
    ) else (
        echo [!] ADB not found in PATH or standard Android SDK location.
        echo     You can still use standard USB Tethering via IP address.
    )
)

echo [1/3] Checking connected Android devices via ADB...
"%ADB_EXE%" devices
echo.

echo [2/3] Setting up ADB Reverse Port Forwarding for Android...
echo       Forwarding Frontend  (Phone localhost:3000 -> PC localhost:3000)
"%ADB_EXE%" reverse tcp:3000 tcp:3000
echo       Forwarding Backend API (Phone localhost:5000 -> PC localhost:5000)
"%ADB_EXE%" reverse tcp:5000 tcp:5000
echo.

echo =====================================================================
echo [3/3] ACTIVE NETWORK ^& USB TETHERING IP ADDRESSES:
echo =====================================================================
powershell -NoProfile -Command ^
    "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | ForEach-Object { Write-Host ('  Interface: ' + $_.InterfaceAlias.PadRight(25) + ' IP: http://' + $_.IPAddress + ':3000') -ForegroundColor Green }"
echo.

echo =====================================================================
echo HOW TO OPEN ON YOUR ANDROID PHONE:
echo =====================================================================
echo METHOD A (Recommended - via USB Debugging Cable):
echo   1. Keep phone connected via USB cable with 'USB Debugging' ON.
echo   2. Open Chrome on your Android phone and navigate to:
echo        http://localhost:3000
echo.
echo METHOD B (via Android USB Tethering / Wi-Fi Hotspot):
echo   1. On Android: Settings -^> Network / Hotspot -^> Turn ON 'USB Tethering'.
echo   2. Open Chrome on your Android phone and browse to one of the IPs listed above:
echo        http://^<IP_ADDRESS^>:3000
echo =====================================================================
echo.
echo Press any key to re-check and re-run ADB port forward...
pause >nul
goto :top
