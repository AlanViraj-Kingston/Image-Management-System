#!/usr/bin/env python3
"""
Migration script to add appointment_id column to medical_tests table
Run this script to update the database schema
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Load environment variables
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable is not set.")
    sys.exit(1)

# Parse DATABASE_URL
# Format: postgresql://user:password@host:port/database
try:
    # Remove postgresql:// prefix
    db_url = DATABASE_URL.replace("postgresql://", "")
    # Split into parts
    if "@" in db_url:
        auth_part, host_part = db_url.split("@")
        user, password = auth_part.split(":")
        host, db_part = host_part.split("/")
        if ":" in host:
            host, port = host.split(":")
        else:
            port = "5432"
        database = db_part.split("?")[0]  # Remove query parameters if any
    else:
        raise ValueError("Invalid DATABASE_URL format")
except Exception as e:
    print(f"ERROR: Could not parse DATABASE_URL: {e}")
    sys.exit(1)

print(f"Connecting to database: {database} on {host}:{port}")

try:
    # Connect to database
    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Read and execute migration SQL
    migration_file = Path(__file__).parent / "add_appointment_id_to_tests.sql"
    with open(migration_file, 'r') as f:
        migration_sql = f.read()
    
    print("Executing migration...")
    cursor.execute(migration_sql)
    print("✓ Migration completed successfully!")
    print("✓ Added appointment_id column to medical_tests table")
    print("✓ Created index on appointment_id")
    
    cursor.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"ERROR: Database error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

