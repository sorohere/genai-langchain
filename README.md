# SQL AI Query Bot

A modern, agentic AI application that allows users to interact with their SQL database using natural language. Built with a React frontend and a FastAPI backend powered by Google Gemini.

## Features

-   **Natural Language to SQL**: Ask questions in plain English, and the AI converts them to SQL queries.
-   **3-Stage Agent Architecture**:
    -   **Planner**: Analyzes requests and plans SQL queries based on the schema.
    -   **Executor**: Safely executes queries against the database, skipping unsafe operations on system tables.
    -   **Responder**: Synthesizes execution results into a clear, natural language explanation.
-   **Modern "Boxed" UI**: A premium, centered, glassmorphism-inspired interface with dark mode and smooth animations.
-   **Chat History**: Persistent chat sessions with automatic management (rolling window of 5 sessions).
-   **Safety**: Protected system tables (`chat_sessions`, `chat_messages`) to prevent accidental data loss.

## Prerequisites

-   **Python** 3.10+
-   **Node.js** 16+
-   **PostgreSQL** (or a compatible SQL database)
-   **Google Gemini API Key**

## Setup Instructions

### 1. Backend

The backend is built with FastAPI and LangChain.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Set up environment variables:
    Create a `.env` file in the `backend` directory with the following:
    ```env
    GOOGLE_API_KEY=your_gemini_api_key
    GEMINI_MODEL=gemini-1.5-flash
    
    # Database Configuration
    DB_USER=postgres
    DB_PASSWORD=your_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=your_db_name
    ```

5.  Run the server:
    ```bash
    uvicorn app.main:app --reload
    ```
    The backend will start at `http://localhost:8000`.

### 2. Frontend

The frontend is built with React, Vite, and Tailwind CSS.

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```
    The frontend will start at `http://localhost:5173` (or similar).

## Usage

1.  Open the frontend URL in your browser.
2.  Use the **New Chat** button to start a session.
3.  Type your question (e.g., *"Show me all students"* or *"Create a table for employees"*).
4.  View the generated **SQL**, the **Results Table**, and the **AI's Explanation**.
5.  Use the **History** sidebar to switch between past conversations.

## Project Structure

-   `backend/app/agent.py`: Core logic for the 3-stage agent (Planner, Executor, Responder).
-   `backend/app/main.py`: FastAPI endpoints for chat and session management.
-   `frontend/src/components`: React components (ChatWindow, Sidebar, InputArea, etc.).
