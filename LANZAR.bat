@echo off
setlocal

:: ============================================================================
:: 0. CERRAR INSTANCIAS PREVIAS Y VERIFICAR DEPENDENCIAS
:: ============================================================================
echo Cerrando instancias previas de la aplicacion...
taskkill /f /im python.exe /fi "WINDOWTITLE eq Python App" >nul 2>nul
taskkill /f /im python.exe /fi "COMMANDLINE eq *app.py*" >nul 2>nul
timeout /t 2 /nobreak >nul

:: Verificar que Python esté instalado
set "PYTHON_CMD=python"
python --version >nul 2>nul
if %errorlevel% neq 0 (
    :: Intentar con la ruta específica de Python 3.12
    if exist "C:\Python312\python.exe" (
        set "PYTHON_CMD=C:\Python312\python.exe"
    ) else (
        echo ❌ ERROR: Python no esta instalado o no esta en el PATH
        echo Por favor, instala Python desde https://python.org
        pause
        exit /b 1
    )
)

:: Verificar que las dependencias estén instaladas
echo Verificando dependencias...
if not exist "requirements.txt" (
    echo ❌ ERROR: No se encuentra requirements.txt
    pause
    exit /b 1
)

:: Intentar instalar dependencias si no están
%PYTHON_CMD% -c "import flask, flask_socketio, qrcode" >nul 2>nul
if %errorlevel% neq 0 (
    echo Instalando dependencias faltantes...
    %PYTHON_CMD% -m pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ❌ ERROR: No se pudieron instalar las dependencias
        pause
        exit /b 1
    )
)

:: ============================================================================
:: 1. INICIAR LA APLICACIÓN PYTHON
:: ============================================================================
echo Iniciando la aplicacion Python...
start "Python App" %PYTHON_CMD% app.py

:: Esperar un tiempo fijo para que la aplicación se inicie
echo Esperando a que la aplicacion se inicie...
echo (Esto puede tomar unos segundos...)
timeout /t 5 /nobreak >nul
echo ✅ Aplicacion iniciada!


:: ============================================================================
:: 2. DETECCIÓN DE IP Y PREPARACIÓN DE VARIABLES
:: ============================================================================
echo.
echo Detectando direccion IP de la red Wi-Fi para acceso externo...

for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command ^
    "Get-NetAdapter -InterfaceType 71 | Where-Object { $_.Status -eq 'Up' } | Get-NetIPAddress -AddressFamily IPv4 | Select-Object -ExpandProperty IPAddress -First 1" ^
`) do (
    set "WIFI_IP=%%i"
)

REM Preparamos las variables con valores por defecto (caso de fallo)
set "URL=http://localhost:8080"
set "COLOR_CODE=0E"
set "MSG_TITLE=ADVERTENCIA: No se pudo detectar una IP de Wi-Fi"
set "MSG_DETAIL=Accesible solo desde ESTA COMPUTADORA en: %URL%"

REM Si se encontró la IP, sobrescribimos las variables con los valores de éxito
if defined WIFI_IP (
    set "URL=http://%WIFI_IP%:8080"
    set "COLOR_CODE=0A"
    set "MSG_TITLE=IP LOCAL Wi-Fi DETECTADA: %WIFI_IP%"
    set "MSG_DETAIL=Accede desde otros dispositivos a: %URL%"
)

:: ============================================================================
:: 3. MOSTRAR EL ESTADO
:: ============================================================================
cls
color %COLOR_CODE%
echo ========================================================
echo   %MSG_TITLE%
echo ========================================================
echo.
echo La aplicacion esta corriendo.
echo %MSG_DETAIL%
echo.


:: ============================================================================
:: 4. LANZAMIENTO DEL NAVEGADOR
:: ============================================================================
echo Abriendo la aplicacion en el navegador: %URL%
echo.

set "CHROME_PATH_PROGRAMFILES=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME_PATH_X86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"

where chrome >nul 2>nul
if %errorlevel%==0 (
    start "Chrome" chrome --new-window --start-maximized %URL%
    goto :fin
)
if exist "%CHROME_PATH_PROGRAMFILES%" (
    start "Chrome" "%CHROME_PATH_PROGRAMFILES%" --new-window --start-maximized %URL%
    goto :fin
)
if exist "%CHROME_PATH_X86%" (
    start "Chrome" "%CHROME_PATH_X86%" --new-window --start-maximized %URL%
    goto :fin
)

set "EDGE_PATH_PROGRAMFILES=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "EDGE_PATH_X86=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

where msedge >nul 2>nul
if %errorlevel%==0 (
    start "Edge" msedge --new-window --start-maximized %URL%
    goto :fin
)
if exist "%EDGE_PATH_PROGRAMFILES%" (
    start "Edge" "%EDGE_PATH_PROGRAMFILES%" --new-window --start-maximized %URL%
    goto :fin
)
if exist "%EDGE_PATH_X86%" (
    start "Edge" "%EDGE_PATH_X86%" --new-window --start-maximized %URL%
    goto :fin
)

set "FIREFOX_PATH_PROGRAMFILES=%ProgramFiles%\Mozilla Firefox\firefox.exe"
set "FIREFOX_PATH_X86=%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe"

where firefox >nul 2>nul
if %errorlevel%==0 (
    rem Firefox no tiene un parametro 'start-maximized', se abre en una ventana nueva.
    start "Firefox" firefox --new-window %URL%
    goto :fin
)
if exist "%FIREFOX_PATH_PROGRAMFILES%" (
    start "Firefox" "%FIREFOX_PATH_PROGRAMFILES%" --new-window %URL%
    goto :fin
)
if exist "%FIREFOX_PATH_X86%" (
    start "Firefox" "%FIREFOX_PATH_X86%" --new-window %URL%
    goto :fin
)

echo No se encontro un navegador compatible. Abriendo con el predeterminado...
start %URL%

:fin
echo.
echo Script finalizado.
endlocal