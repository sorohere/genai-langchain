from app.database import init_db, get_database_url
from dotenv import load_dotenv

load_dotenv()

db_uri = get_database_url()
print(f"Initializing database at: {db_uri}")

try:
    init_db(db_uri)
    print("Database initialized successfully!")
except Exception as e:
    print(f"Initialization failed: {e}")
