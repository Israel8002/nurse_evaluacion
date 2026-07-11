@echo off
title Sistema de Control de Personal - Enfermería (Portable)
chcp 65001 >nul

echo =====================================================================
echo    INICIANDO SISTEMA PORTABLE DE EVALUACIÓN DE ENFERMERÍA
echo =====================================================================
echo.

:: Obtener la ruta del directorio del script actual (dentro de nurse_evaluacion)
set "BASE_DIR=%~dp0"

echo [1/3] Iniciando Base de Datos MongoDB (Portable)...
if not exist "%BASE_DIR%..\mongodb-portable\data" (
    mkdir "%BASE_DIR%..\mongodb-portable\data"
)
start "Servicio de Base de Datos" /min "%BASE_DIR%..\mongodb-portable\mongodb-win32-x86_64-windows-7.0.12\bin\mongod.exe" --dbpath "%BASE_DIR%..\mongodb-portable\data" --port 27017

echo [2/3] Configurando entorno Node.js...
set "PATH=%BASE_DIR%..\node-portable\node-v20.17.0-win-x64;%PATH%"

echo [3/3] Iniciando servidor web de la aplicación...
cd /d "%BASE_DIR%"
start "Servidor Web Next.js" /min cmd /c "yarn dev:no-reload"

echo.
echo Esperando a que los servicios inicien (5 segundos)...
timeout /t 5 >nul

echo Abriendo navegador en http://localhost:3000...
start http://localhost:3000

echo.
echo =====================================================================
echo    ¡EL SISTEMA SE ESTÁ EJECUTANDO CORRECTAMENTE!
echo =====================================================================
echo.
echo    * La aplicación web se ha abierto en: http://localhost:3000
echo    * Si se inicia en una computadora nueva, solicitará el registro
echo      inicial del Jefe de Enfermería (Administrador).
echo.
echo    -----------------------------------------------------------------
echo    ¡IMPORTANTE!:
echo    No cierres esta ventana mientras uses el sistema.
echo    Cuando termines de trabajar, presiona cualquier tecla AQUÍ para
echo    apagar los servidores de forma limpia y segura.
echo    -----------------------------------------------------------------
echo.
pause

echo.
echo Apagando servidores y deteniendo procesos...
taskkill /f /im mongod.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
echo.
echo =====================================================================
echo    Sistema apagado. ¡Hasta luego!
echo =====================================================================
timeout /t 3 >nul
