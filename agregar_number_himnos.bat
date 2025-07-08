@echo off
chcp 65001 >nul
echo 🎵 Ejecutando agregado de etiqueta 'number' a himnos...
echo.

powershell -ExecutionPolicy Bypass -File "agregar_number_himnos.ps1"

echo.
echo Presiona cualquier tecla para salir...
pause >nul 