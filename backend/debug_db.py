import os
from sqlalchemy import create_engine, text, inspect
from dotenv import load_dotenv
from app.database import get_database_url

load_dotenv()

db_uri = get_database_url()
print(f"Testing connection to: {db_uri}")

try:
    engine = create_engine(db_uri)
    with engine.connect() as connection:
        print("Connection successful!")
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Tables found: {tables}")
        
        if 'chat_sessions' in tables:
            print("chat_sessions table exists.")
            result = connection.execute(text("SELECT count(*) FROM chat_sessions"))
            print(f"Session count: {result.scalar()}")
        else:
            print("chat_sessions table MISSING!")

except Exception as e:
    print(f"Connection failed: {e}")
