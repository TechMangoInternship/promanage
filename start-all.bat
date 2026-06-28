@echo off
echo ===================================
echo  Starting all Grid Projects
echo ===================================
echo.
echo Make sure MongoDB is running first!
echo.
echo Opening each project in separate windows...
echo.

REM ====== Project Grid (Main - port 3000, backend 5001) ======
start "ProjectGrid Backend" cmd /c "cd /d %~dp0projectGrid\backend && npm run dev"
timeout /t 3 /nobreak >nul
start "ProjectGrid Frontend" cmd /c "cd /d %~dp0projectGrid\frontend && npm start"

REM ====== Technical Stack (port 5173, backend 5000) ======
start "TechStack Backend" cmd /c "cd /d %~dp0technicalStack\backend && node server.js"
timeout /t 2 /nobreak >nul
start "TechStack Frontend" cmd /c "cd /d %~dp0technicalStack\frontend && npm run dev"

REM ====== Queries & Responses (port 5174, backend 5002) ======
start "Queries Backend" cmd /c "cd /d %~dp0QueriesResponsesGrid\backend && npm run dev"
timeout /t 2 /nobreak >nul
start "Queries Frontend" cmd /c "cd /d %~dp0QueriesResponsesGrid\frontend && npm run dev"

REM ====== Resource Grid (port 3001, backend 5003) ======
start "ResourceGrid Backend" cmd /c "cd /d %~dp0resourceGrid\backend && npm start"
timeout /t 2 /nobreak >nul
start "ResourceGrid Frontend" cmd /c "cd /d %~dp0resourceGrid\frontend && npm start"

REM ====== Open Project Grid Frontend in Chrome ======
timeout /t 5 /nobreak >nul
start chrome http://localhost:3000

REM ====== Assumption Grid (port 5175, backend 5004) ======
start "Assumption Backend" cmd /c "cd /d %~dp0assumption-grid\backend && node server.js"
timeout /t 2 /nobreak >nul
start "Assumption Frontend" cmd /c "cd /d %~dp0assumption-grid\frontend && npm run dev"

REM ====== Dependency Grid (port 3002, backend 5005) ======
start "Dependency Backend" cmd /c "cd /d %~dp0dependency-grid\backend && node server.js"
timeout /t 2 /nobreak >nul
start "Dependency Frontend" cmd /c "cd /d %~dp0dependency-grid\frontend && npm run dev"

REM ====== Features Grid (port 3003, backend 5006) ======
start "Features Backend" cmd /c "cd /d %~dp0features-grid\backend && node server.js"
timeout /t 2 /nobreak >nul
start "Features Frontend" cmd /c "cd /d %~dp0features-grid\frontend && npm run dev"

REM ====== Streams Grid (port 3004, backend 5007) ======
start "Streams Backend" cmd /c "cd /d %~dp0streams-grid\backend && node server.js"
timeout /t 2 /nobreak >nul
start "Streams Frontend" cmd /c "cd /d %~dp0streams-grid\frontend && npm run dev"

echo.
echo ===================================
echo  All servers starting up!
echo  Project Grid:     http://localhost:3000
echo  Resource Grid:    http://localhost:3001
echo  Technical Stack:  http://localhost:5173
echo  Queries:         http://localhost:5174
echo  Assumptions:     http://localhost:5175
echo  Dependencies:    http://localhost:3002
echo  Features Grid:   http://localhost:3003
echo  Streams Grid:    http://localhost:3004
echo ===================================
pause
