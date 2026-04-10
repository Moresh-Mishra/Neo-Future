"""
Shared Database Utilities - Centralized MySQL Connection Setup
Eliminates code redundancy across exercise_recommend.py, exercise_list.py, generalize_exercise.py
"""

import os
import sys
import mysql.connector
from dotenv import load_dotenv

# Load environment variables once
load_dotenv()


def get_mysql_connection():
    """
    Get MySQL database connection with standardized configuration
    Returns tuple: (connection, cursor)
    Exits on connection failure
    """
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_USER = os.getenv("MYSQL_USER")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
    MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")

    # Validate environment variables
    if not MYSQL_USER or not MYSQL_PASSWORD or not MYSQL_DATABASE:
        print("❌ Error: Missing MySQL credentials in .env file")
        print("Required: MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE")
        sys.exit(1)

    try:
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE
        )
        cursor = conn.cursor(dictionary=True)
        print("✓ Connected to MySQL")
        return conn, cursor
    except mysql.connector.Error as e:
        print(f"❌ MySQL Connection Error: {e}")
        print(f"Host: {MYSQL_HOST}, User: {MYSQL_USER}, Database: {MYSQL_DATABASE}")
        sys.exit(1)


def close_connections(conn, cursor):
    """Close database connections safely"""
    if cursor:
        cursor.close()
    if conn:
        conn.close()
    print("✓ Database connections closed")
