@echo off
chcp 65001 >nul
title Church Display - Instalación de Dependencias

echo.
echo ========================================
echo    CHURCH DISPLAY - INSTALACIÓN
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

REM Verificar si pip está disponible
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: pip no está disponible
    echo.
    echo Para instalar pip:
    echo 1. Descarga get-pip.py desde https://bootstrap.pypa.io/get-pip.py
    echo 2. Ejecuta: python get-pip.py
    echo.
    pause
    exit /b 1
)

echo ✅ pip encontrado
echo.

echo 🚀 Instalando dependencias de Flask-SocketIO...
echo.

REM Instalar dependencias
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Error al instalar las dependencias
    echo.
    echo Intenta instalar manualmente:
    echo pip install Flask Flask-SocketIO python-socketio python-engineio
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Dependencias instaladas correctamente
echo.
echo 🎉 ¡Instalación completada!
echo.
echo Para iniciar el servidor:
echo python app.py
echo.
echo O usa el script automático:
echo python iniciar_servidor.py
echo.
pause 