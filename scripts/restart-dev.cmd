@echo off
chcp 65001 >nul
cd /d "%~dp0.."

echo ปิด process ที่พอร์ต 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1

cd /d "%~dp0..\apps\web"
if exist .next rmdir /s /q .next

cd /d "%~dp0.."
echo เริ่ม dev server ใหม่...
call scripts\dev-web.cmd
