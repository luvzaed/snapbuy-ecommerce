@echo off
cd /d "%~dp0"
echo Snapbuy local database setup and Supabase import
echo Please keep this window open.
powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run-Import.ps1"
pause
