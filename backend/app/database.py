from sqlalchemy import create_engine, text
from datetime import datetime
import os

def get_database_url():
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "password")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "postgres")
    return f"postgresql://{user}:{password}@{host}:{port}/{name}"

def init_db(db_uri: str):
    engine = create_engine(db_uri)
    
    with engine.connect() as connection:
        # Create tables
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50),
                class VARCHAR(50),
                section VARCHAR(10),
                marks INTEGER
            )
        """))
        
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))

        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
                role VARCHAR(20),
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Check if data exists
        result = connection.execute(text("SELECT COUNT(*) FROM students"))
        count = result.scalar()
        
        if count == 0:
            # Seed data
            data = [
                ('Jainam', 'Data Science', 'A', 90),
                ('Jackie', 'Data Science', 'B', 100),
                ('Gadot', 'Data Science', 'A', 86),
                ('Jacob', 'DevOps', 'A', 50),
                ('Dikshita', 'DevOps', 'A', 35),
                ('Saurabh', 'AI Engineering', 'A', 95),
                ('Alex', 'Web Dev', 'B', 88)
            ]
            
            for name, cls, sec, marks in data:
                connection.execute(text(
                    "INSERT INTO students (name, class, section, marks) VALUES (:name, :cls, :sec, :marks)"
                ), {"name": name, "cls": cls, "sec": sec, "marks": marks})
                
            connection.commit()
            print("Database seeded successfully.")
        else:
            print("Database already contains data.")
            connection.commit()

def create_session(db_uri: str, title: str = "New Chat"):
    engine = create_engine(db_uri)
    with engine.connect() as conn:
        # Check current session count
        result = conn.execute(text("SELECT id FROM chat_sessions ORDER BY created_at ASC"))
        sessions = [row[0] for row in result]
        
        # If we have 5 or more sessions, delete the oldest ones until we have 4
        # so that adding the new one brings us to 5.
        if len(sessions) >= 5:
            # Calculate how many to delete
            num_to_delete = len(sessions) - 4
            ids_to_delete = sessions[:num_to_delete]
            
            # Delete them
            conn.execute(text(
                "DELETE FROM chat_sessions WHERE id IN :ids"
            ), {"ids": tuple(ids_to_delete)})
            
        # Create new session
        result = conn.execute(text(
            "INSERT INTO chat_sessions (title) VALUES (:title) RETURNING id"
        ), {"title": title})
        session_id = result.scalar()
        conn.commit()
        return session_id

def get_sessions(db_uri: str):
    engine = create_engine(db_uri)
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT id, title, created_at FROM chat_sessions ORDER BY created_at DESC"
        ))
        return [dict(row._mapping) for row in result]

def add_message(db_uri: str, session_id: int, role: str, content: str):
    engine = create_engine(db_uri)
    with engine.connect() as conn:
        conn.execute(text(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (:session_id, :role, :content)"
        ), {"session_id": session_id, "role": role, "content": content})
        conn.commit()

def get_chat_history(db_uri: str, session_id: int):
    engine = create_engine(db_uri)
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT role, content FROM chat_messages WHERE session_id = :session_id ORDER BY created_at ASC"
        ), {"session_id": session_id})
        return [dict(row._mapping) for row in result]

def delete_all_sessions(db_uri: str):
    engine = create_engine(db_uri)
    with engine.connect() as conn:
        # Cascading delete will handle messages
        conn.execute(text("TRUNCATE TABLE chat_sessions CASCADE"))
        conn.commit()

