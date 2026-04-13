@echo off
title Controle Financeiro Web
cd /d "%~dp0"

:: Detectar IP local via PowerShell (exclui loopback e link-local)
for /f %%a in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' } | Sort-Object InterfaceIndex | Select-Object -First 1 -ExpandProperty IPAddress)"') do set LOCAL_IP=%%a

:: Gravar .env.local com o IP atual (tem prioridade sobre .env no Vite)
echo VITE_API_URL=http://%LOCAL_IP%:3001/api/v1> apps\web\.env.local

echo.
echo  ============================================================
echo   Controle Financeiro Web — iniciando...
echo  ============================================================
echo   IP detectado : %LOCAL_IP%
echo  ============================================================
echo.

start "Controle Financeiro - Servidor" cmd /k "npm run dev"

echo  Aguardando API (porta 3001)...
:check_api
timeout /t 3 /nobreak >nul
curl -s --max-time 2 http://localhost:3001/health >nul 2>&1
if errorlevel 1 goto check_api

echo  API pronta! Aguardando frontend (porta 5173)...
:check_web
timeout /t 2 /nobreak >nul
curl -s --max-time 2 http://localhost:5173 >nul 2>&1
if errorlevel 1 goto check_web

echo.
echo  ============================================================
echo   PRONTO — acesse pelo navegador:
echo.
echo   Desktop : http://localhost:5173
echo   Celular : http://%LOCAL_IP%:5173
echo  ============================================================
echo.

start "" "http://localhost:5173"
exit
