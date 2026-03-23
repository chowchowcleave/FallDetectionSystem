import sqlite3
 
conn = sqlite3.connect('fall_detection.db')
conn.execute("UPDATE users SET role='admin' WHERE username='admin'")
conn.commit()
 
# Verify
cursor = conn.execute("SELECT username, role FROM users")
for row in cursor:
    print(f"User: {row[0]}, Role: {row[1]}")
 
conn.close()
print('Done')