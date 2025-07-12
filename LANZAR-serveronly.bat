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
:: 3. MOSTRAR EL ESTADO DEL SERVIDOR
:: ============================================================================
cls
color %COLOR_CODE%
echo ========================================================
echo   %MSG_TITLE%
echo ========================================================
echo.
echo ✅ Servidor iniciado correctamente
echo %MSG_DETAIL%
echo.
echo El servidor esta ejecutandose en segundo plano.
echo Para acceder a la aplicacion, abre tu navegador y ve a:
echo   %URL%
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul

endlocal 