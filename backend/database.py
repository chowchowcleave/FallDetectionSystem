import sqlite3
from datetime import datetime
from pathlib import Path

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

# Initialize database when module is imported
init_database()