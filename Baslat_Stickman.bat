@echo off
title Stickman Workout - Emulator & Metro
color 0A
echo ========================================================
echo       STICKMAN WORKOUT EMULATOR & METRO BASLATILIYOR
echo ========================================================
echo.
echo 1) Android Emulator aciliyor...
start "" "C:\Users\yasin\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd Pixel10_test_cihazi
echo.
echo 2) Metro Dev Server aciliyor...
start "Stickman Metro" cmd /k "cd /d %~dp0 && npx react-native start"
echo.
echo 3) Uygulama kurulup aciliyor...
timeout /t 10
cd /d %~dp0
call npx react-native run-android --no-packager
echo.
echo Islem tamam!
pause
