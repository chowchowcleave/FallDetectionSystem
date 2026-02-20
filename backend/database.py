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

def change_password(username, current_password, new_password):
    """Change user password after verifying current password"""
    # Hash the current password to verify
    current_hash = hashlib.sha256(current_password.encode()).hexdigest()
    new_hash = hashlib.sha256(new_password.encode()).hexdigest()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verify current password
    cursor.execute('''
        SELECT id FROM users
        WHERE username = ? AND password_hash = ?
    ''', (username, current_hash))
    
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return False  # Current password is incorrect
    
    # Update to new password
    cursor.execute('''
        UPDATE users
        SET password_hash = ?
        WHERE username = ?
    ''', (new_hash, username))
    
    conn.commit()
    conn.close()
    
    return True  # Password changed successfully

# ==================== SETTINGS FUNCTIONS ====================

def init_settings_table():
    """Create settings table if it doesn't exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"✅ Settings table initialized")

def create_default_settings():
    """Create default settings if none exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if settings exist
    cursor.execute('SELECT COUNT(*) FROM settings')
    count = cursor.fetchone()[0]
    
    if count == 0:
        now = datetime.now().isoformat()
        
        # Default settings
        default_settings = [
            # Camera Settings
            ('camera_url', 'rtsp://chamsroom:admin123@192.168.101.13:554/stream1'),
            ('camera_username', 'chamsroom'),
            ('camera_password', 'admin123'),
            ('camera_location', 'Main Camera'),
            
            # Detection Settings
            ('confidence_threshold', '0.75'),
            ('cooldown_seconds', '30'),
            ('enable_fall_detection', 'true'),
            ('enable_fighting_detection', 'false'),
            
            # Alert Settings
            ('alert_email_enabled', 'false'),
            ('alert_email_address', 'admin@example.com'),
            ('alert_sms_enabled', 'false'),
            ('alert_phone_number', ''),
            ('alert_sound_enabled', 'true'),
            
            # System Information
            ('organization_name', 'CAIRE Healthcare'),
            ('contact_person', 'Administrator'),
            ('emergency_contact', '+63-XXX-XXX-XXXX'),
            ('system_location', 'Main Building'),
        ]
        
        for key, value in default_settings:
            cursor.execute('''
                INSERT INTO settings (setting_key, setting_value, updated_at)
                VALUES (?, ?, ?)
            ''', (key, value, now))
        
        conn.commit()
        print(f"✅ Default settings created")
    
    conn.close()

def get_setting(key, default=None):
    """Get a single setting value"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT setting_value FROM settings WHERE setting_key = ?', (key,))
    result = cursor.fetchone()
    
    conn.close()
    
    if result:
        return result[0]
    return default

def update_setting(key, value):
    """Update a setting value"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE settings 
        SET setting_value = ?, updated_at = ?
        WHERE setting_key = ?
    ''', (value, datetime.now().isoformat(), key))
    
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()
    
    return rows_affected > 0

def get_all_settings():
    """Get all settings as a dictionary"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT setting_key, setting_value FROM settings')
    rows = cursor.fetchall()
    
    conn.close()
    
    # Convert to dictionary
    settings = {row['setting_key']: row['setting_value'] for row in rows}
    return settings

def get_settings_by_category():
    """Get all settings organized by category"""
    all_settings = get_all_settings()
    
    return {
        'camera': {
            'url': all_settings.get('camera_url', ''),
            'username': all_settings.get('camera_username', ''),
            'password': all_settings.get('camera_password', ''),
            'location': all_settings.get('camera_location', ''),
        },
        'detection': {
            'confidence_threshold': float(all_settings.get('confidence_threshold', 0.75)),
            'cooldown_seconds': int(all_settings.get('cooldown_seconds', 30)),
            'enable_fall_detection': all_settings.get('enable_fall_detection', 'true') == 'true',
            'enable_fighting_detection': all_settings.get('enable_fighting_detection', 'false') == 'true',
        },
        'alerts': {
            'email_enabled': all_settings.get('alert_email_enabled', 'false') == 'true',
            'email_address': all_settings.get('alert_email_address', ''),
            'sms_enabled': all_settings.get('alert_sms_enabled', 'false') == 'true',
            'phone_number': all_settings.get('alert_phone_number', ''),
            'sound_enabled': all_settings.get('alert_sound_enabled', 'true') == 'true',
        },
        'system': {
            'organization_name': all_settings.get('organization_name', ''),
            'contact_person': all_settings.get('contact_person', ''),
            'emergency_contact': all_settings.get('emergency_contact', ''),
            'system_location': all_settings.get('system_location', ''),
        }
    }

# Initialize database when module is imported
init_database()
init_users_table()
create_default_admin()
init_settings_table()
create_default_settings()