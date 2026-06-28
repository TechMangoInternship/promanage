@echo off
setlocal enabledelayedexpansion

echo ===================================
echo  Installing dependencies for all Grid Projects
echo ===================================
echo.
echo NOTE: Frontend projects with Material UI (@mui) may take
echo       3-5 minutes each to download and build.
echo       Total install time: ~15-20 minutes.
echo.
echo Starting installation...
echo.

set STEP=0

call :install_step "projectGrid backend" "%~dp0projectGrid\backend"
call :install_step "projectGrid frontend" "%~dp0projectGrid\frontend"
call :install_step "technicalStack backend" "%~dp0technicalStack\backend"
call :install_step "technicalStack frontend" "%~dp0technicalStack\frontend"
call :install_step "QueriesResponsesGrid backend" "%~dp0QueriesResponsesGrid\backend"
call :install_step "QueriesResponsesGrid frontend" "%~dp0QueriesResponsesGrid\frontend"
call :install_step "resourceGrid backend" "%~dp0resourceGrid\backend"
call :install_step "resourceGrid frontend" "%~dp0resourceGrid\frontend"
call :install_step "assumption-grid backend" "%~dp0assumption-grid"
call :install_step "assumption-grid frontend" "%~dp0assumption-grid\frontend"
call :install_step "dependency-grid backend" "%~dp0dependency-grid"
call :install_step "dependency-grid frontend" "%~dp0dependency-grid\frontend"
call :install_step "features-grid backend" "%~dp0features-grid"
call :install_step "features-grid frontend" "%~dp0features-grid\frontend"
call :install_step "streams-grid backend" "%~dp0streams-grid"
call :install_step "streams-grid frontend" "%~dp0streams-grid\frontend"

echo.
echo ===================================
echo  All dependencies installed!
echo  Now run start-all.bat to start the servers.
echo ===================================
pause
exit /b

:install_step
set /a STEP=STEP+1
set PROJECT_NAME=%~1
set PROJECT_DIR=%~2
echo [%STEP%/16] Installing %PROJECT_NAME%...
echo   Directory: %PROJECT_DIR%
echo   Starting at: !TIME!
cd /d "%PROJECT_DIR%" && npm install
if !errorlevel! neq 0 (
    echo   [ERROR] npm install failed for %PROJECT_NAME%!
    pause
    exit /b
)
echo   Finished at: !TIME!
echo.
exit /b
