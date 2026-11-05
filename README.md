# LifeLink — Smart Emergency Blood Availability & Matching System

A centralized emergency healthcare platform connecting hospitals, accredited blood banks, and verified voluntary blood donors to streamline emergency blood search and eliminate critical delays during life-threatening medical emergencies.

---

## 🚀 Key Modifications Implemented
1. **Full Python Backend Added**: Built using Python 3 & **Flask RESTful API** to handle data persistence, requisition lifecycles, and algorithmic decision matching.
2. **MySQL Relational Database Integrated**:
   - Complete `schema.sql` database script with tables for users, hospitals, blood banks, inventories, donors, blood requests, and emergency notifications.
   - Intelligent dual-engine architecture: Automatically connects to **MySQL** (configured via `.env`), with a seamless fallback to **SQLite** (`lifelink.db`) if MySQL is not yet active.
   - CLI setup tool `init_mysql.py` to initialize, migrate, and seed MySQL tables with a single command.
3. **Removed College & Academic Details**:
   - Removed all references to *Seshadri Rao Gudlavalleru Engineering College* (SRGEC), student names, roll numbers, and guide information.
   - Removed college seals and academic project tags in favor of clean, professional healthcare network branding.
4. **Clean Navigation Bar**:
   - Removed **CSP Report** and **Feedback** links from the navbar and footer.
   - Clean, professional navigation:
     - **Home**: Hero banner, live platform metrics, implementation plan, 8-step system flow, and problem-solution matrix.
     - **Request Blood**: Emergency requisition form with clinical indications, blood components, and urgency tiers.
     - **Blood Banks**: Directory with filters, stock inspection modals, and direct requisition routing.
     - **Donors**: Searchable directory of voluntary donors and direct donor registration form.
     - **Smart Matcher**: Algorithmic decision-support console with compatibility breakdowns, composite scoring, and Leaflet map radar.
     - **Hospital Portal**: Real-time requisition status tracker (`Pending` → `Matched` → `Fulfilled`).
     - **Blood Bank Portal**: Interactive blood inventory editor with direct database persistence.
     - **Test Scenarios**: Pre-configured test cases demonstrating optimal match, shortage pooling, and universal donor logic.
     - **About**: Architecture, clinical compatibility rules, algorithm formulas, and system specifications.

---

## 🛠️ Technology Stack
- **Backend**: Python 3.11, Flask, Flask-CORS, SQLAlchemy ORM, PyMySQL
- **Database**: MySQL 8.0 / 5.7 (MariaDB compatible), with SQLite fallback
- **Frontend**: HTML5, Vanilla JavaScript (ES6+), CSS3 Healthcare Theme, Leaflet.js

---

## 📂 Project Structure
```
lifelink-system/
├── app.py                  # Main Flask application & REST API routes
├── config.py               # Database and server configuration
├── database.py             # SQLAlchemy models & DB connection engine
├── matching_engine.py      # Python smart blood matching algorithm
├── seed_data.py            # Initial seed data for facilities, inventory, donors
├── init_mysql.py           # Helper script to create & seed MySQL database
├── schema.sql              # Pure MySQL SQL script with DDL & DML
├── requirements.txt        # Python package dependencies
├── .env                    # Environment configuration file
├── .env.example            # Environment template
├── run.bat                 # One-click Windows runner batch script
├── templates/
│   └── index.html          # Clean HTML UI (No college details, no CSP/feedback)
└── static/
    ├── css/
    │   └── style.css       # Clean healthcare styles
    └── js/
        ├── algorithm.js    # Client-side matcher & fallback calculations
        ├── app.js          # REST API connected application controller
        └── data.js         # Clinical compatibility matrices & defaults
```

---

## ⚙️ Installation & Running

### Step 1: Open Terminal in Project Directory
```powershell
cd C:\Users\MEGHANA\.gemini\antigravity\scratch\lifelink-system
```

### Step 2: Activate Virtual Environment
```powershell
.\.venv\Scripts\activate
```
*(Or if creating a fresh environment: `python -m venv .venv` followed by `pip install -r requirements.txt`)*

### Step 3 (Optional): Configure MySQL
If you have MySQL running (via XAMPP, MySQL Workbench, or Windows Service):
1. Open `.env` and verify your credentials:
   ```ini
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DB=lifelink_db
   ```
2. Initialize the MySQL database and tables:
   ```powershell
   python init_mysql.py
   ```
   *(Alternatively, you can import `schema.sql` directly into phpMyAdmin or MySQL CLI)*

> **Note**: If MySQL is not running on your machine, the system will **automatically fall back to SQLite** (`lifelink.db`) so the application runs immediately with zero setup hurdles!

### Step 4: Start the Server
```powershell
python app.py
```
Or simply double-click `run.bat`!

### Step 5: Open in Browser
Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

---

## 🧪 Testing the Core Features

1. **Submit Emergency Requisition**:
   - Go to **Request Blood** tab.
   - Choose hospital, blood group (e.g. `O+`), component (e.g. `PRBC`), units (`2`), urgency (`Critical`).
   - Click **Execute Smart Match & Dispatch Requirement**.
   - The system calculates Haversine distance, compatibility, and stock scores, persisting the request into the database.
2. **Inspect & Update Blood Bank Inventory**:
   - Go to **Blood Bank Portal** tab.
   - Adjust unit numbers in the stock editor grid and click **Save Stock Changes**.
   - The changes are immediately written to MySQL / SQLite.
3. **Register Voluntary Blood Donor**:
   - Go to **Donors** tab.
   - Click **+ Register as a Blood Donor**, enter details, and submit.
   - The new donor is stored in the database and visible in emergency matching searches.
4. **Test Edge Scenarios**:
   - Go to **Test Scenarios** tab.
   - Run **Scenario 2 (Shortage Pooling)** to see multi-source knapsack allocation across multiple blood banks.
