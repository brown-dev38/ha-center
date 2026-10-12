@echo off
chcp 65001 >nul
cd /d "%~dp0..\apps\web"

set "NEXT_BIN=%~dp0..\apps\web\node_modules\next\dist\bin\next"
if not exist "%NEXT_BIN%" (
  echo [ERROR] ไม่พบ next — รันจากรากโปรเจกต์: npm install --ignore-scripts
  exit /b 1
)

echo เริ่มเร็ว ^(ไม่ kill port^) ที่ http://localhost:3000
node "%NEXT_BIN%" dev -p 3000
