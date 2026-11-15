import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'lifelink-secret-key-emergency-matching-system-2026')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')

    # Cloud Database URL support (Render, Railway, Heroku, Aiven, etc.)
    RAW_DB_URL = os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL') or os.getenv('JAWSDB_URL') or os.getenv('CLEARDB_DATABASE_URL')

    if RAW_DB_URL:
        # Normalize protocol for SQLAlchemy + PyMySQL / psycopg
        if RAW_DB_URL.startswith('mysql://'):
            MYSQL_URI = RAW_DB_URL.replace('mysql://', 'mysql+pymysql://', 1)
        elif RAW_DB_URL.startswith('postgres://'):
            MYSQL_URI = RAW_DB_URL.replace('postgres://', 'postgresql://', 1)
        else:
            MYSQL_URI = RAW_DB_URL
        MYSQL_HOST = 'cloud-managed'
        MYSQL_PORT = 3306
        MYSQL_USER = 'cloud-user'
        MYSQL_DB = 'cloud-db'
    else:
        # Standard individual credentials
        MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
        MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
        MYSQL_USER = os.getenv('MYSQL_USER', 'root')
        MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'root')
        MYSQL_DB = os.getenv('MYSQL_DB', 'lifelink_db')
        MYSQL_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"

    # SQLite fallback connection string
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    if os.getenv('VERCEL') or os.getenv('AWS_LAMBDA_FUNCTION_NAME'):
        tmp_db = '/tmp/lifelink.db'
        src_db = os.path.join(BASE_DIR, 'lifelink.db')
        if not os.path.exists(tmp_db) and os.path.exists(src_db):
            import shutil
            try:
                shutil.copy2(src_db, tmp_db)
            except Exception:
                pass
        SQLITE_URI = f"sqlite:///{tmp_db}"
    else:
        SQLITE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'lifelink.db')}"

    # Target engine mode: 'auto' (tries MySQL/cloud DB first, falls back to SQLite)
    DB_MODE = os.getenv('DB_MODE', 'auto')
