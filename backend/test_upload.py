import requests

url = "http://localhost:8000/api/upload_csv"
file_path = "../data.csv"

try:
    with open(file_path, "rb") as f:
        files = {"file": f}
        print(f"Uploading {file_path} to {url}...")
        response = requests.post(url, files=files)
        
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        filename = data['filename']
        original_filename = data['original_filename']
        
        session_url = "http://localhost:8000/api/sessions"
        payload = {
            "title": f"Test Analysis: {original_filename}",
            "session_type": "eda",
            "filename": filename
        }
        print(f"Creating session with payload: {payload}")
        session_res = requests.post(session_url, json=payload)
        print(f"Session Creation Status: {session_res.status_code}")
        print(f"Session Response: {session_res.text}")

except Exception as e:
    print(f"Error: {e}")
