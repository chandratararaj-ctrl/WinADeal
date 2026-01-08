@echo off
echo ========================================
echo  WinADeal Backend - Prisma Regeneration
echo ========================================
echo.

echo [1/3] Stopping any running backend processes...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *backend*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Regenerating Prisma Client...
cd /d "%~dp0"
call npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Prisma generation failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo [3/3] Starting backend server...
start "WinADeal Backend" cmd /k "npm run dev"

echo.
echo ========================================
echo  Done! Backend server is starting...
echo ========================================
echo.
echo Check the new window for server logs.
echo Press any key to close this window...
pause >nul
