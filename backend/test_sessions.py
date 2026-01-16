import requests

url = "http://localhost:8000/api/sessions"

try:
    response = requests.get(url)
    print(f"Status: {response.status_code}")
    data = response.json()
    sessions = data.get("sessions", [])
    print(f"Found {len(sessions)} sessions.")
    
    for s in sessions:
        print(f"ID: {s.get('id')}, Type: {s.get('session_type')}, Filename: {s.get('filename')}, Title: {s.get('title')}")

except Exception as e:
    print(f"Error: {e}")
