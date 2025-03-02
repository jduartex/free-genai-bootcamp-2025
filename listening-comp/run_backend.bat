@echo off

REM Load environment variables
if exist .env (
    for /F "tokens=*" %%i in (.env) do set %%i
)

REM Make sure the database is initialized
echo Initializing database...
python backend\init_db.py

REM Start the backend API server
echo Starting backend API server...
python backend\api.py
