@echo off
REM เรียกจาก Task Scheduler หลัง server รีสตาร์ท — เปิด ha-center ด้วย PM2
cd /d C:\ha-center\web

set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"

REM รอ MySQL / network พร้อม (ปรับวินาทีได้ถ้าจำเป็น)
timeout /t 30 /nobreak >nul

pm2 resurrect
if errorlevel 1 (
  pm2 start ecosystem.config.cjs
  pm2 save
)

exit /b 0
