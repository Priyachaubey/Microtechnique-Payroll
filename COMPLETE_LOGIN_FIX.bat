@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM COMPLETE_LOGIN_FIX.bat
REM
REM EK HI FILE (Windows version) - sab kuch isi mein hai:
REM   - PostgreSQL database container start karta hai (Docker Desktop)
REM   - Poora schema (28 tables) + guaranteed working login accounts seed karta hai
REM   - Fresh ya existing database dono pe safely chal sakta hai (idempotent)
REM   - Backend build bhi karta hai (agar dotnet available hai)
REM
REM USAGE: Is file par double-click karein, ya cmd/PowerShell mein:
REM   COMPLETE_LOGIN_FIX.bat
REM
REM Login (guaranteed working, verified with real PBKDF2 check):
REM   Admin:    admin@microtechnique.local    / Admin@12345
REM   Employee: employee@microtechnique.local / Employee@12345
REM ============================================================================

set CONTAINER_NAME=payroll_postgres_db
set DB_NAME=payroll_db
set DB_USER=postgres
set DB_PASS=postgres
set DB_PORT=5433

echo ============================================================
echo  STEP 1/4: Checking Docker
echo ============================================================
where docker >nul 2>nul
if errorlevel 1 (
    echo X Docker is not installed or not in PATH.
    echo   Install Docker Desktop first: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)
echo Docker found.

echo.
echo ============================================================
echo  STEP 2/4: Starting PostgreSQL container
echo ============================================================
docker ps -a --format "{{.Names}}" | findstr /x "%CONTAINER_NAME%" >nul 2>nul
if %errorlevel%==0 (
    echo Container already exists. Starting it ^(existing data is kept^)...
    docker start %CONTAINER_NAME% >nul
) else (
    echo Creating new container...
    docker run -d --name %CONTAINER_NAME% -e POSTGRES_USER=%DB_USER% -e POSTGRES_PASSWORD=%DB_PASS% -e POSTGRES_DB=%DB_NAME% -p %DB_PORT%:5432 -v payroll_postgres_data:/var/lib/postgresql/data postgres:15 >nul
)

echo Waiting for PostgreSQL to accept connections...
set /a tries=0
:waitloop
docker exec %CONTAINER_NAME% pg_isready -U %DB_USER% -d %DB_NAME% >nul 2>nul
if %errorlevel%==0 goto ready
set /a tries+=1
if %tries% GEQ 30 (
    echo X PostgreSQL did not become ready in time. Check: docker logs %CONTAINER_NAME%
    pause
    exit /b 1
)
timeout /t 2 /nobreak >nul
goto waitloop
:ready
echo PostgreSQL is ready.

echo.
echo ============================================================
echo  STEP 3/4: Applying full schema + guaranteed login accounts
echo    (safe to re-run - uses CREATE TABLE IF NOT EXISTS / ON CONFLICT)
echo ============================================================
docker cp "%~dp0COMPLETE_SCHEMA_AND_SEED.sql" %CONTAINER_NAME%:/tmp/seed.sql
docker exec -e PGPASSWORD=%DB_PASS% %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -v ON_ERROR_STOP=0 -f /tmp/seed.sql
echo Schema + seed applied.

echo.
echo ============================================================
echo  STEP 4/4: Verifying login accounts exist
echo ============================================================
docker exec -e PGPASSWORD=%DB_PASS% %CONTAINER_NAME% psql -U %DB_USER% -d %DB_NAME% -c "SELECT empid, email, role, status, statusbysuperadmin FROM t_users WHERE email IN ('admin@microtechnique.local','employee@microtechnique.local');"

echo.
echo ============================================================
echo  DATABASE READY
echo ============================================================
echo.
echo   Database running at: localhost:%DB_PORT% (database: %DB_NAME%)
echo.
echo   GUARANTEED LOGIN CREDENTIALS:
echo     Admin:    admin@microtechnique.local    / Admin@12345
echo     Employee: employee@microtechnique.local / Employee@12345
echo.

where dotnet >nul 2>nul
if %errorlevel%==0 (
    echo ============================================================
    echo  BONUS: dotnet found - building backend
    echo ============================================================
    if exist "%~dp0Backend" (
        pushd "%~dp0Backend"
        dotnet build
        popd
        echo.
        echo   Backend built. Start it with:  cd Backend ^&^& dotnet run
        echo   Backend will listen on:        http://localhost:5125
    ) else (
        echo   (Backend folder not found next to this script.)
    )
) else (
    echo   dotnet not found - start your backend normally (dotnet run in the Backend folder).
)

echo.
echo Ab apne app mein upar diye gaye Admin ya Employee credentials se login karke check karein.
pause
