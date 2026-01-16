from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from app.agent import get_agent_response
from app.eda_agent import get_eda_response
from app.database import init_db, create_session, get_sessions, add_message, get_chat_history, get_database_url, delete_all_sessions
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv
import os
import shutil
import pandas as pd
import uuid
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()

# Workspace Configuration
WORKSPACE_DIR = "workspace"
UPLOADS_DIR = f"{WORKSPACE_DIR}/uploads"
PLOTS_DIR = f"{WORKSPACE_DIR}/plots"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create workspace directories
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    os.makedirs(PLOTS_DIR, exist_ok=True)
    print(f"Created workspace at {WORKSPACE_DIR}")
    yield
    # Shutdown: Clean up workspace
    # We DO NOT want to delete the workspace on shutdown because it deletes uploaded files
    # that are needed for persistent EDA sessions.
    # if os.path.exists(WORKSPACE_DIR):
    #     shutil.rmtree(WORKSPACE_DIR)
    #     print(f"Cleaned up workspace at {WORKSPACE_DIR}")
    print("Shutdown: Workspace preserved.")

app = FastAPI(title="LangChain SQL Chat API", lifespan=lifespan)

# Mount static files for plots
# We mount the plots directory specifically
# Ensure directory exists before mounting to avoid RuntimeError
os.makedirs(PLOTS_DIR, exist_ok=True)
app.mount("/static/plots", StaticFiles(directory=PLOTS_DIR), name="static_plots")

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

class EdaChatRequest(BaseModel):
    message: str
    filename: str
    google_api_key: str | None = None
    session_id: int | None = None
    history: list = []

class InitDbRequest(BaseModel):
    db_uri: str | None = None

class CreateSessionRequest(BaseModel):
    title: str = "New Chat"
    db_uri: str | None = None
    session_type: str = "sql"
    filename: str | None = None

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/upload_csv")
async def upload_csv(file: UploadFile = File(...)):
    try:
        # Ensure uploads directory exists (redundant but safe)
        os.makedirs(UPLOADS_DIR, exist_ok=True)
        
        # Generate unique filename to prevent overwrites
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = f"{UPLOADS_DIR}/{unique_filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Read CSV to get preview
        try:
            df = pd.read_csv(file_path)
            # Replace NaN and Infinity with None for JSON compatibility
            import numpy as np
            df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
            
            preview = df.head(5).to_dict(orient="records")
            columns = list(df.columns)
            
            return {
                "filename": unique_filename,
                "original_filename": file.filename,
                "columns": columns,
                "preview": preview,
                "row_count": len(df)
            }
        except Exception as e:
            # If reading fails, delete the file
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/eda_chat")
async def eda_chat(request: EdaChatRequest):
    try:
        api_key = request.google_api_key or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise HTTPException(status_code=400, detail="Google API Key is required")
            
        db_uri = get_database_url()
        history = []
        if request.session_id and db_uri:
             history = get_chat_history(db_uri, request.session_id)
        else:
             history = request.history
            
        response = get_eda_response(request.message, request.filename, api_key, history)
        
        # Save to history if session_id is provided
        if request.session_id and db_uri:
            add_message(db_uri, request.session_id, "user", request.message)
            
            # Serialize the rich response
            import json
            rich_content = {
                "answer": response["answer"],
                "code": response["code"],
                "stdout": response["stdout"],
                "plots": response["plots"],
                "error": response["error"]
            }
            add_message(db_uri, request.session_id, "assistant", json.dumps(rich_content))
            
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions")
async def create_new_session(request: CreateSessionRequest):
    try:
        db_uri = request.db_uri or get_database_url()
        if not db_uri:
            raise HTTPException(status_code=400, detail="Database URI required")
        session_id = create_session(db_uri, request.title, request.session_type, request.filename)
        return {
            "id": session_id,  # Standardize on "id" to match get_sessions
            "session_id": session_id, # Keep for backward compat if needed, but primary is id
            "title": request.title,
            "session_type": request.session_type,
            "filename": request.filename
        }
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
        
        # Set model as requested by user
        os.environ["GEMINI_MODEL"] = "gemini-2.5-flash-lite-preview-09-2025"

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
