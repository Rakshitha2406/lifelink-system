@echo off
setlocal enabledelayedexpansion

echo =========================================================================
echo  LifeLink - Push to GitHub Repository
echo =========================================================================
echo.

set GIT_PATH=C:\Users\MEGHANA\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe
cd /d "%~dp0"

echo [1/3] Checking Git status...
"%GIT_PATH%" status --short
echo.

set /p REPO_URL="Enter your GitHub Repository URL (e.g. https://github.com/username/lifelink-system.git): "

if "%REPO_URL%"=="" (
    echo [!] No URL entered. Aborting.
    pause
    exit /b 1
)

echo.
echo [2/3] Adding remote origin: %REPO_URL%
"%GIT_PATH%" remote remove origin 2>nul
"%GIT_PATH%" remote add origin %REPO_URL%
"%GIT_PATH%" branch -M main

echo.
echo [3/3] Pushing code to GitHub main branch...
echo (A GitHub login window or prompt will appear if not already signed in)
"%GIT_PATH%" push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================================================
    echo  [SUCCESS] All files pushed to GitHub successfully!
    echo =========================================================================
) else (
    echo.
    echo [!] Push encountered an issue. Please verify your repository URL and permissions.
)

pause
