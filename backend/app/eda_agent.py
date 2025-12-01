from langchain_google_genai import ChatGoogleGenerativeAI
import pandas as pd
import os
import json
import sys
import io
import contextlib
import matplotlib.pyplot as plt
import uuid
import traceback

# --- STAGE 1: PLANNER ---
def planner_stage(llm, user_query, df_info, history=[]):
    """
    Generates Python code to answer the user query based on the dataframe info.
    """
    history_context = ""
    if history:
        history_context = "Previous conversation history:\n"
        for msg in history:
            role = "User" if msg['role'] == 'user' else "Assistant"
            history_context += f"{role}: {msg['content']}\n"

    prompt = f"""
    You are a Python Data Analysis Expert.
    
    User Goal: {user_query}
    
    {history_context}
    
    Dataframe Info:
    {df_info}
    
    The dataframe is loaded in the variable `df`.
    
    Your task is to generate Python code to analyze this data and fulfill the user's goal.
    
    Rules:
    1. Use 'df' as the dataframe variable.
    2. You can use pandas (pd), matplotlib.pyplot (plt), seaborn (sns), and numpy (np).
    3. If the user asks for a plot or if a visualization helps answer the question:
       - Create the plot using matplotlib/seaborn.
       - DO NOT use plt.show().
       - Save the plot to a file using `plt.savefig('plot_name.png')`. 
       - If generating multiple plots, use unique names like 'plot_1.png', 'plot_2.png', etc.
       - Clear the figure after saving using `plt.clf()` to avoid overlapping plots.
    4. Print any textual answer or summary using `print()`.
    5. Return ONLY the raw Python code. No markdown formatting, no code blocks (```python ... ```).
    6. When using seaborn plots with a 'palette', you MUST assign the 'x' or 'y' variable to 'hue' and set 'legend=False' to avoid FutureWarnings.
    
    Example Output:
    print(df.describe())
    plt.figure()
    sns.histplot(df['column'])
    plt.savefig('hist.png')
    plt.clf()
    """
    
    response = llm.invoke(prompt)
    content = response.content.strip()
    
    # Clean up markdown code blocks if present
    if content.startswith("```python"):
        content = content[9:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
        
    return content

# --- STAGE 2: EXECUTOR ---
def executor_stage(code, df):
    """
    Executes the generated Python code in a temporary directory.
    Captures stdout and any saved plots.
    """
    import tempfile
    import shutil
    
    # Create a buffer to capture stdout
    output_buffer = io.StringIO()
    
    # Directory to save final plots
    final_plot_dir = os.path.abspath("backend/static/plots")
    os.makedirs(final_plot_dir, exist_ok=True)
    
    results = {
        "stdout": "",
        "error": None,
        "plots": []
    }
    
    # Create a temporary directory for execution
    with tempfile.TemporaryDirectory() as temp_dir:
        # Save current CWD
        original_cwd = os.getcwd()
        
        try:
            # Change to temp dir
            os.chdir(temp_dir)
            
            # Redirect stdout
            with contextlib.redirect_stdout(output_buffer):
                # Execute code in a restricted namespace
                local_vars = {
                    "df": df,
                    "pd": pd,
                    "plt": plt,
                    "print": print,
                    "sns": __import__("seaborn"),
                    "np": __import__("numpy")
                }
                
                # Execute the code
                exec(code, {}, local_vars)
                
            results["stdout"] = output_buffer.getvalue()
            
            # Scan temp dir for any PNG files generated
            for filename in os.listdir(temp_dir):
                if filename.lower().endswith('.png'):
                    # Generate unique name for permanent storage
                    unique_name = f"plot_{uuid.uuid4()}.png"
                    dest_path = os.path.join(final_plot_dir, unique_name)
                    
                    # Move file from temp dir to static/plots
                    shutil.move(os.path.join(temp_dir, filename), dest_path)
                    
                    # Add web-accessible path to results
                    results["plots"].append(f"/static/plots/{unique_name}")

        except Exception as e:
            results["error"] = f"{str(e)}\n{traceback.format_exc()}"
        finally:
            # Always restore CWD
            os.chdir(original_cwd)
        
    return results

# --- STAGE 3: RESPONDER ---
def responder_stage(llm, user_query, execution_results):
    """
    Synthesizes the execution results into a natural language response.
    """
    prompt = f"""
    You are a helpful Data Assistant.
    
    User Question: {user_query}
    
    Analysis Results (Code Output):
    {execution_results['stdout']}
    
    Errors (if any):
    {execution_results['error']}
    
    Plots Generated: {len(execution_results['plots'])}
    
    Based on these results, provide a helpful, natural language answer to the user.
    - Interpret the numbers/text output.
    - If a plot was generated, mention that it is displayed below.
    - If an error occurred, explain it and suggest what might have gone wrong.
    """
    
    response = llm.invoke(prompt)
    return response.content

def get_eda_response(message: str, filename: str, google_api_key: str, history: list = []) -> dict:
    # Initialize LLM
    llm = ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
        google_api_key=google_api_key,
        temperature=0
    )
    
    # Load Dataframe
    file_path = f"backend/uploads/{filename}"
    if not os.path.exists(file_path):
        return {
            "answer": "Error: File not found. Please upload the file again.",
            "plots": [],
            "code": ""
        }
        
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        return {
            "answer": f"Error loading CSV: {str(e)}",
            "plots": [],
            "code": ""
        }
        
    # Get DF Info for Planner
    buffer = io.StringIO()
    df.info(buf=buffer)
    df_info = f"Columns: {list(df.columns)}\n\nShape: {df.shape}\n\nInfo:\n{buffer.getvalue()}\n\nHead:\n{df.head().to_string()}"
    
    # --- STAGE 1: PLANNER ---
    try:
        code = planner_stage(llm, message, df_info, history)
    except Exception as e:
        return {
            "answer": f"Planning stage failed: {str(e)}",
            "plots": [],
            "code": ""
        }
        
    # --- STAGE 2: EXECUTOR ---
    try:
        exec_results = executor_stage(code, df)
    except Exception as e:
        return {
            "answer": f"Execution stage failed: {str(e)}",
            "plots": [],
            "code": code
        }
        
    # --- STAGE 3: RESPONDER ---
    try:
        final_answer = responder_stage(llm, message, exec_results)
    except Exception as e:
        final_answer = f"Responder stage failed: {str(e)}"
        
    return {
        "answer": final_answer,
        "plots": exec_results["plots"],
        "code": code,
        "stdout": exec_results["stdout"],
        "error": exec_results["error"]
    }
