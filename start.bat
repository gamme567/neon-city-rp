@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title NEON CITY RP - Oyun Sunucusu
where py >nul 2>nul
if not errorlevel 1 (
  py -3 server.py
  if not errorlevel 1 goto end
)
where python >nul 2>nul
if not errorlevel 1 (
  python server.py
  goto end
)
echo.
echo Python 3 bulunamadi. Python 3 kurup tekrar deneyin.
echo Kurulum: https://www.python.org/downloads/
echo Python kurulumunda "Add Python to PATH" secenegini isaretleyin.
echo.
pause
:end
pause
