@echo off
chcp 65001 >nul
title Church Display - Servidor Flask

echo.
echo ========================================
echo    CHURCH DISPLAY - SERVIDOR FLASK
echo ========================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python no está instalado o no está en el PATH
    echo.
    echo Para instalar Python:
    echo 1. Ve a https://www.python.org/downloads/
    echo 2. Descarga e instala Python 3.x
    echo 3. Asegúrate de marcar "Add Python to PATH" durante la instalación
    echo.
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo.

REM Verificar que estamos en el directorio correcto
if not exist "app.py" (
    echo ❌ Error: No se encontró app.py
    echo Asegúrate de ejecutar este script desde el directorio del proyecto
    echo.
    pause
    exit /b 1
)

echo 🚀 Iniciando servidor Flask-SocketIO para Church Display...
echo.
echo 📱 Panel de control: http://localhost:8080/
echo 🖥️  Ventana de proyección: http://localhost:8080/proyector
echo.
echo 📱 Para acceder desde tu celular:
echo    - Conecta tu celular a la misma red WiFi
echo    - Abre el navegador y ve a la URL que aparecerá abajo
echo.
echo ⏹️  Presiona Ctrl+C para detener el servidor
echo.
echo ========================================
echo.

REM Ejecutar el servidor Flask
python app.py

echo.
echo 🛑 Servidor detenido
pause 