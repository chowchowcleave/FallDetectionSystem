import sqlite3
from datetime import datetime
from pathlib import Path
import hashlib

# Database path
DB_PATH = Path(__file__).parent / "fall_detection.db"

def init_database():
    """Initialize the database and create tables if they don't exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create detections table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            detection_type TEXT NOT NULL,
            confidence REAL NOT NULL,
            camera_source TEXT,
            image_data TEXT,
            notes TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"✅ Database initialized at: {DB_PATH}")

def init_users_table():
    """Create users table if it doesn't exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"✅ Users table initialized")

def create_default_admin():
    """Create default admin user if no users exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if any users exist
    cursor.execute('SELECT COUNT(*) FROM users')
    count = cursor.fetchone()[0]
    
    if count == 0:
        # Create default admin
        password_hash = hashlib.sha256("admin123".encode()).hexdigest()
        cursor.execute('''
            INSERT INTO users (username, password_hash, role, created_at)
            VALUES (?, ?, ?, ?)
        ''', ("admin", password_hash, "admin", datetime.now().isoformat()))
        conn.commit()
        print(f"✅ Default admin created (username: admin, password: admin123)")
    
    conn.close()

def save_detection(detection_type, confidence, camera_source="live", image_data=None, notes=None):
    """Save a detection event to the database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    timestamp = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO detections (timestamp, detection_type, confidence, camera_source, image_data, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (timestamp, detection_type, confidence, camera_source, image_data, notes))
    
    conn.commit()
    detection_id = cursor.lastrowid
    conn.close()
    
    return detection_id

def get_all_detections(limit=100):
    """Get all detections from database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, timestamp, detection_type, confidence, camera_source, notes
        FROM detections
        ORDER BY timestamp DESC
        LIMIT ?
    ''', (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    # Convert to list of dicts
    detections = [dict(row) for row in rows]
    return detections

def get_detection_stats():
    """Get statistics for analytics"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Total detections
    cursor.execute('SELECT COUNT(*) as total FROM detections')
    total = cursor.fetchone()[0]
    
    # Falls only
    cursor.execute('SELECT COUNT(*) as falls FROM detections WHERE detection_type = "fall"')
    falls = cursor.fetchone()[0]
    
    # Detections by type
    cursor.execute('''
        SELECT detection_type, COUNT(*) as count
        FROM detections
        GROUP BY detection_type
    ''')
    by_type = dict(cursor.fetchall())
    
    # Recent detections (last 24 hours)
    cursor.execute('''
        SELECT COUNT(*) as recent
        FROM detections
        WHERE datetime(timestamp) > datetime('now', '-1 day')
    ''')
    recent_24h = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        'total_detections': total,
        'total_falls': falls,
        'by_type': by_type,
        'recent_24h': recent_24h
    }

def delete_all_detections():
    """Delete all detections (for testing)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM detections')
    conn.commit()
    conn.close()

# ==================== USER AUTHENTICATION FUNCTIONS ====================

def create_user(username, password, role='user'):
    """Create a new user with hashed password"""
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (username, password_hash, role, created_at)
            VALUES (?, ?, ?, ?)
        ''', (username, password_hash, role, datetime.now().isoformat()))
        
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return user_id
    except sqlite3.IntegrityError:
        conn.close()
        return None  # Username already exists

def verify_user(username, password):
    """Verify username and password, return user info if valid"""
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, username, role
        FROM users
        WHERE username = ? AND password_hash = ?
    ''', (username, password_hash))
    
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return dict(user)
    return None

def get_user_by_username(username):
    """Get user info by username"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, username, role, created_at
        FROM users
        WHERE username = ?
    ''', (username,))
    
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return dict(user)
    return None

def get_all_users():
    """Get all users (admin only)"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, username, role, created_at
        FROM users
        ORDER BY created_at DESC
    ''')
    
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return users

def delete_user(user_id):
    """Delete a user by ID"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
    
    conn.commit()
    conn.close()

# Initialize database when module is imported
init_database()
init_users_table()
create_default_admin()