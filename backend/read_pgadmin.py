import sqlite3

conn = sqlite3.connect(r'C:\Users\laiva\AppData\Roaming\pgadmin\pgadmin4.db')
c = conn.cursor()

tables = c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("TABLES:", tables)

for (t,) in tables:
    if 'server' in t or 'pass' in t or 'key' in t or 'user' in t:
        try:
            rows = c.execute(f"SELECT * FROM {t}").fetchall()
            print(f"--- TABLE {t} ---")
            print(rows)
        except Exception as e:
            print(f"Error {t}: {e}")
