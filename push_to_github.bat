@echo off
setlocal enabledelayedexpansion

echo =========================================================================
echo  LifeLink - Push to GitHub Repository
echo =========================================================================
echo.

set GIT_PATH=C:\Users\MEGHANA\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe
cd /d "%~dp0"

echo [1/3] Staging and committing changes...
"%GIT_PATH%" add .
"%GIT_PATH%" commit -m "Update LifeLink system" 2>nul
echo.

echo [2/3] Verified remote origin:
"%GIT_PATH%" remote -v
echo.

echo [3/3] Pushing latest code to GitHub main branch...
"%GIT_PATH%" push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================================================
    echo  [SUCCESS] All files pushed to GitHub successfully!
    echo =========================================================================
) else (
    echo.
    echo [!] Push encountered an issue. Please verify your internet and GitHub permissions.
)

pause
