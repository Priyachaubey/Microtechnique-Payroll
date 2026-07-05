============================================================
  PAYROLL MICROTECHNIQUE — LOGIN FIX + DATABASE SETUP
  YAHAN SE SHURU KAREIN / START HERE
============================================================

Aapko sirf EK step karna hai. Docker Desktop pehle se installed
aur RUNNING honi chahiye (system tray mein Docker whale icon
dikhna chahiye).

--------------------------------------------------------------
AGAR WINDOWS use kar rahe hain:
--------------------------------------------------------------
  1. "COMPLETE_LOGIN_FIX.bat" par DOUBLE-CLICK karein
     (ya cmd/PowerShell mein: COMPLETE_LOGIN_FIX.bat)

--------------------------------------------------------------
AGAR Mac / Linux / Git Bash / WSL use kar rahe hain:
--------------------------------------------------------------
  1. Terminal kholen is folder mein
  2. Yeh 2 commands chalayein:
       chmod +x COMPLETE_LOGIN_FIX.sh
       ./COMPLETE_LOGIN_FIX.sh

--------------------------------------------------------------
Yeh script khud hi karega:
--------------------------------------------------------------
  1. PostgreSQL database Docker container mein start karega
  2. Poora schema (28 tables) + guaranteed login accounts seed karega
  3. Verify karega ki accounts create ho gaye
  4. Agar dotnet installed hai to Backend build bhi kar dega

--------------------------------------------------------------
Uske baad backend chalayein:
--------------------------------------------------------------
  cd Backend
  dotnet run

Backend chalega: http://localhost:5125

--------------------------------------------------------------
Frontend chalayein (dusri terminal window mein):
--------------------------------------------------------------
  cd Frontend\react-crud     (Windows)
  cd Frontend/react-crud     (Mac/Linux)
  npm install
  npm start

--------------------------------------------------------------
GUARANTEED LOGIN CREDENTIALS (already tested/verified):
--------------------------------------------------------------
  Admin login:
    Email:    admin@microtechnique.local
    Password: Admin@12345

  Employee login:
    Email:    employee@microtechnique.local
    Password: Employee@12345

Agar in credentials se bhi login fail hota hai, toh screenshot
ya exact error message (terminal ka output) bhejein — us case
mein masla ab password/database ka nahi, kuch aur hoga (jaise
Docker na chalna, ya port already kisi aur cheez se use ho raha
hona) aur uska exact pata terminal ke output se chal jayega.

--------------------------------------------------------------
Is folder mein files:
--------------------------------------------------------------
  COMPLETE_LOGIN_FIX.bat        <- Windows: yeh chalayein
  COMPLETE_LOGIN_FIX.sh         <- Mac/Linux/Git Bash: yeh chalayein
  COMPLETE_SCHEMA_AND_SEED.sql  <- (in dono scripts ke through use hoti hai)
  Backend/                      <- Fixed .NET backend (AuthController.cs mein fixes)
  Frontend/                     <- Fixed React frontend (AuthContext.js mein fixes)
  init.sql                      <- Original schema file (ab isme bhi seed accounts hain)
  diagnose_login.sql            <- Extra diagnostic script (optional, agar detail check karni ho)
