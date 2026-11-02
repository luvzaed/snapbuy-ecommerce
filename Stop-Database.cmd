@echo off
"C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" -D "%~dp0.local\postgres" -m fast -w stop
pause
