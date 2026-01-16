# LangChain Implementation Details

In this project, **LangChain** serves as the foundational framework that connects the application logic to the AI model (Google Gemini) and data sources (Database/CSV).

Instead of using pre-built "black box" agents (like `create_sql_agent`), this project implements a **Custom Agentic Workflow** using LangChain's primitives. This approach provides finer control over the output, error handling, and state management.

## 1. The "Brain": Model Abstraction
The most direct use of LangChain is the `ChatGoogleGenerativeAI` class.

*   **Component:** `langchain_google_genai.ChatGoogleGenerativeAI`
*   **Function:** It wraps the Google Gemini API into a standard LangChain interface.
*   **Benefit:** This abstraction decouples the application logic from the specific LLM provider. Instantiating `llm = ChatGoogleGenerativeAI(...)` allows for standard `llm.invoke()` calls. Switching to another provider (e.g., OpenAI, Anthropic) would only require changing the instantiation line, without rewriting the core logic.

## 2. The "Hands": Database Tools
In the SQL Agent (`agent.py`), the project utilizes `langchain_community.utilities.SQLDatabase`.

*   **Component:** `langchain_community.utilities.SQLDatabase`
*   **Schema Inspection:** The `db.get_table_info()` method automatically reads the PostgreSQL database schema and converts table structures (CREATE TABLE statements) into a string format optimized for LLM consumption. This is critical for the "Planner" stage to understand the data model.
*   **Query Execution:** The `db.run(query)` method provides a safe interface to execute the generated SQL against the database and return results as a string.

## 3. The "Architecture": Custom Chain-of-Thought
The project implements a **3-Stage Agentic Workflow**. While it avoids the opaque `AgentExecutor` class, it strictly follows the core LangChain agent design pattern:

### Stage A: The Planner (Reasoning)
*   **Input:** User Question + DB Schema (from `SQLDatabase`).
*   **LangChain Role:** Constructs a prompt defining the persona ("You are a SQL Expert...") and context, then calls `llm.invoke()`.
*   **Output:** A structured JSON plan containing the SQL query to be executed.

### Stage B: The Executor (Action)
*   **Input:** The SQL query from the Planner.
*   **LangChain Role:** Utilizes the `SQLDatabase` tool to execute the query against the live database.
*   **Output:** Raw data rows (e.g., `[('Student A', 95), ('Student B', 88)]`).

### Stage C: The Responder (Synthesis)
*   **Input:** User Question + Raw Data (from Executor).
*   **LangChain Role:** Calls `llm.invoke()` with a synthesis prompt ("Summarize these results...").
*   **Output:** A natural language answer derived from the data (e.g., "Student A has the highest marks with 95.").

## Summary
The project utilizes LangChain as a **Library of Primitives** rather than a **Framework of Constraints**.

1.  **Wrappers:** Used to standardize LLM interaction (`ChatGoogleGenerativeAI`).
2.  **Utilities:** Used to abstract database interactions (`SQLDatabase`).
3.  **Logic:** The "Chain" logic (Planner -> Executor -> Responder) is implemented as explicit Python functions. This "code-as-chain" approach is often superior for production applications compared to declarative chains, offering better debuggability and customization.
