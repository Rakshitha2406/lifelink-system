"""
LifeLink - MySQL Database Initializer & Migration Tool
Run this script to initialize or reset your local MySQL database.
Usage:
    python init_mysql.py
"""

import sys
import pymysql
from config import Config

def init_mysql():
    print("=" * 65)
    print(" LifeLink Emergency Blood Matching System - MySQL Database Setup")
    print("=" * 65)
    print(f"Target Host:     {Config.MYSQL_HOST}:{Config.MYSQL_PORT}")
    print(f"Target Database: {Config.MYSQL_DB}")
    print(f"User:            {Config.MYSQL_USER}")
    print("-" * 65)

    try:
        # 1. Connect to MySQL server without selecting database first
        conn = pymysql.connect(
            host=Config.MYSQL_HOST,
            port=Config.MYSQL_PORT,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        print("[✓] Successfully connected to MySQL Server!")

        with conn.cursor() as cursor:
            # 2. Create database
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print(f"[✓] Database '{Config.MYSQL_DB}' confirmed/created.")

            # 3. Select database
            cursor.execute(f"USE `{Config.MYSQL_DB}`;")

            # 4. Read schema.sql
            with open('schema.sql', 'r', encoding='utf-8') as f:
                sql_content = f.read()

            # Execute commands
            commands = sql_content.split(';')
            executed = 0
            for cmd in commands:
                cmd_clean = cmd.strip()
                # Skip comments or empty commands
                if not cmd_clean or cmd_clean.startswith('--'):
                    continue
                cursor.execute(cmd_clean)
                executed += 1

            conn.commit()
            print(f"[✓] Executed {executed} SQL commands from schema.sql successfully!")

            # 5. Query counts to verify
            cursor.execute("SELECT COUNT(*) as count FROM hospitals;")
            hosp_count = cursor.fetchone()['count']
            cursor.execute("SELECT COUNT(*) as count FROM blood_banks;")
            bb_count = cursor.fetchone()['count']
            cursor.execute("SELECT COUNT(*) as count FROM donors;")
            donor_count = cursor.fetchone()['count']
            cursor.execute("SELECT COUNT(*) as count FROM blood_inventory;")
            inv_count = cursor.fetchone()['count']

            print("-" * 65)
            print(" Database Initialized Successfully:")
            print(f" • Registered Hospitals:        {hosp_count}")
            print(f" • Registered Blood Banks:      {bb_count}")
            print(f" • Blood Inventory Records:     {inv_count}")
            print(f" • Voluntary Donors:            {donor_count}")
            print("=" * 65)
            print("You can now start the application with: python app.py")
            return True

    except pymysql.err.OperationalError as e:
        print(f"[✗] MySQL Connection Failed: {e}")
        print("\nTroubleshooting tips:")
        print("1. Ensure MySQL Server is running (e.g. through XAMPP, MySQL Service, or Docker).")
        print("2. Check credentials in config.py or create a .env file with:")
        print("   MYSQL_HOST=localhost")
        print("   MYSQL_PORT=3306")
        print("   MYSQL_USER=root")
        print("   MYSQL_PASSWORD=your_password")
        print("   MYSQL_DB=lifelink_db")
        return False
    except Exception as e:
        print(f"[✗] An unexpected error occurred: {e}")
        return False
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == '__main__':
    success = init_mysql()
    sys.exit(0 if success else 1)
