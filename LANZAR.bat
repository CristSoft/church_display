@echo off
setlocal enabledelayedexpansion

REM Obtener la IP del adaptador Wi-Fi usando PowerShell
for /f "usebackq tokens=*" %%i in (`powershell -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like '*Wi-Fi*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -ExpandProperty IPAddress"`) do set wifi_ip=%%i

if defined wifi_ip (
    cls
    color 0A
    echo =============================================
    echo   IP LOCAL Wi-Fi DETECTADA: %wifi_ip%
    echo =============================================
    echo Accede desde otros dispositivos a:
    echo   http://%wifi_ip%:8080
    echo Iniciando la aplicacion...
    start py app.py
    timeout /t 3 /nobreak >nul
    echo Abriendo navegador...
    start http://%wifi_ip%:8080
) else (
    color 0C
    echo No se pudo detectar la IP del adaptador Wi-Fi.
    echo Asegurate de estar conectado a una red Wi-Fi.
    pause
)
endlocal