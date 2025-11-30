from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.agent import get_agent_response
from app.database import init_db, create_session, get_sessions, add_message, get_chat_history, get_database_url, delete_all_sessions
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(title="LangChain SQL Chat API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    db_uri: str | None = None
    google_api_key: str | None = None
    session_id: int | None = None
    chatId: str | None = None # For compatibility with new frontend spec

class InitDbRequest(BaseModel):
    db_uri: str | None = None

class CreateSessionRequest(BaseModel):
    title: str = "New Chat"
    db_uri: str | None = None

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/sessions")
async def create_new_session(request: CreateSessionRequest):
    try:
        db_uri = request.db_uri or get_database_url()
        if not db_uri:
            raise HTTPException(status_code=400, detail="Database URI required")
        session_id = create_session(db_uri, request.title)
        return {"session_id": session_id, "title": request.title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions")
async def list_sessions(db_uri: str | None = None):
    try:
        uri = db_uri or get_database_url()
        if not uri:
             raise HTTPException(status_code=400, detail="Database URI required")
        sessions = get_sessions(uri)
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/sessions")
async def clear_all_sessions(db_uri: str | None = None):
    try:
        uri = db_uri or get_database_url()
        if not uri:
             raise HTTPException(status_code=400, detail="Database URI required")
        delete_all_sessions(uri)
        return {"status": "History cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/{session_id}/messages")
async def get_session_messages(session_id: int, db_uri: str | None = None):
    try:
        uri = db_uri or get_database_url()
        if not uri:
             raise HTTPException(status_code=400, detail="Database URI required")
        history = get_chat_history(uri, session_id)
        return {"messages": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/schema")
async def get_database_schema(db_uri: str | None = None):
    try:
        uri = db_uri or get_database_url()
        if not uri:
             raise HTTPException(status_code=400, detail="Database URI required")
        
        engine = create_engine(uri)
        inspector = inspect(engine)
        
        schema_info = {"tables": []}
        
        for table_name in inspector.get_table_names():
            columns = []
            for column in inspector.get_columns(table_name):
                columns.append({
                    "name": column["name"],
                    "type": str(column["type"])
                })
            schema_info["tables"].append({
                "name": table_name,
                "columns": columns
            })
            
        return schema_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Use provided values or fallback to environment variables
        api_key = request.google_api_key or os.getenv("GOOGLE_API_KEY")
        db_uri = request.db_uri or get_database_url()

        if not api_key:
            raise HTTPException(status_code=400, detail="Google API Key is required (provide in settings or .env)")
        if not db_uri:
            raise HTTPException(status_code=400, detail="Database URI is required (provide in settings or .env)")

        # Handle session_id or chatId
        session_id = request.session_id
        # If chatId is provided (from new frontend spec) and it's an integer, use it
        if request.chatId and request.chatId.isdigit():
             session_id = int(request.chatId)

        # Get history if session_id is provided
        history = []
        if session_id:
            history = get_chat_history(db_uri, session_id)

        # Get Agent Response (Structured)
        agent_output = get_agent_response(request.message, db_uri, api_key, history)
        
        # agent_output is now a dict: { "sql_query": ..., "results": ..., "answer": ... }

        # Save to history if session_id is provided
        if session_id:
            add_message(db_uri, session_id, "user", request.message)
            # We save the markdown answer to history for context
            add_message(db_uri, session_id, "assistant", agent_output["answer"])

        return {
            "sqlQuery": agent_output["sql_query"],
            "results": agent_output["results"],
            "answer": agent_output["answer"],
            "chatId": str(session_id) if session_id else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/init-db")
async def initialize_database(request: InitDbRequest):
    try:
        db_uri = request.db_uri or get_database_url()
        if not db_uri:
             raise HTTPException(status_code=400, detail="Database URI is required")
             
        init_db(db_uri)
        return {"status": "Database initialized and seeded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
