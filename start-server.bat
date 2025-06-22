@echo off
echo Uruchamianie English Flashcards...
echo Wybierz opcje:
echo 1. Python 3
echo 2. Python 2
echo 3. Node.js http-server
set /p choice="Wybierz (1-3): "

if "%choice%"=="1" python -m http.server 8000
if "%choice%"=="2" python -m SimpleHTTPServer 8000
if "%choice%"=="3" http-server -p 8000 -c-1

echo.
echo Aplikacja: http://localhost:8000
pause