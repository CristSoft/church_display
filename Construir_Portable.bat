@echo off
chcp 65001 >nul
title Church Display - Constructor Portable

echo.
echo ========================================
echo    CHURCH DISPLAY - CONSTRUCTOR
echo ========================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python no está instalado
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

echo 🚀 Iniciando construcción de aplicación portable...
echo.

REM Instalar PyInstaller si no está disponible
python -c "import PyInstaller" >nul 2>&1
if errorlevel 1 (
    echo 📦 Instalando PyInstaller...
    pip install pyinstaller
    if errorlevel 1 (
        echo ❌ Error al instalar PyInstaller
        pause
        exit /b 1
    )
    echo ✅ PyInstaller instalado
    echo.
)

REM Ejecutar script de construcción
python build_portable.py

if errorlevel 1 (
    echo ❌ Error en la construcción
    echo.
    echo Verifica que todas las dependencias estén instaladas:
    echo pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo.
echo 🎉 ¡Construcción completada exitosamente!
echo.
echo 📁 El paquete portable está en: ChurchDisplay_Portable/
echo.
echo 💡 Para usar en otra PC:
echo 1. Copia la carpeta ChurchDisplay_Portable
echo 2. Haz doble clic en Iniciar_ChurchDisplay.bat
echo 3. ¡No necesitas instalar nada más!
echo.
pause 