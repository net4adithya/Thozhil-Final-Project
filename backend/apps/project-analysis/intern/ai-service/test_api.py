"""
test_api.py – Manual integration test client for Module 3: AI Reviewer Engine.

Sends a sample review request with multiple program files and prints the
structured response. Run this after starting the uvicorn server:

    uvicorn app:app --reload
    python test_api.py
"""

import json
import urllib.request
import urllib.error

URL = "http://127.0.0.1:8000/review"

# ---------------------------------------------------------------------------
# Sample multi-file submission (simulating a JWT authentication project)
# ---------------------------------------------------------------------------

data = {
    "work_description": (
        "Build a JWT Authentication System with the following requirements:\n"
        "- User signup with email and password\n"
        "- User login returning a signed JWT token\n"
        "- Password hashing using bcrypt\n"
        "- A protected route that requires a valid JWT to access\n"
        "- Basic input validation on signup and login\n"
        "- Unit tests for the authentication flow"
    ),
    "program_files": [
        {
            "filename": "auth.py",
            "language": "python",
            "content": (
                "from flask import Flask, request, jsonify\n"
                "import jwt\n"
                "import datetime\n\n"
                "app = Flask(__name__)\n"
                "SECRET_KEY = 'mysecretkey'\n\n"
                "users = {}\n\n"
                "def login():\n"
                "    data = request.json\n"
                "    username = data.get('username')\n"
                "    password = data.get('password')\n"
                "    if users.get(username) == password:\n"
                "        token = jwt.encode(\n"
                "            {'user': username, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)},\n"
                "            SECRET_KEY\n"
                "        )\n"
                "        return jsonify({'token': token})\n"
                "    return jsonify({'error': 'Invalid credentials'}), 401\n\n"
                "def signup():\n"
                "    data = request.json\n"
                "    username = data['username']\n"
                "    password = data['password']\n"
                "    users[username] = password\n"
                "    return jsonify({'message': 'User created'})\n"
            ),
        },
        {
            "filename": "routes.py",
            "language": "python",
            "content": (
                "from flask import Blueprint\n"
                "from auth import login, signup\n\n"
                "auth_bp = Blueprint('auth', __name__)\n\n"
                "auth_bp.route('/login', methods=['POST'])(login)\n"
                "auth_bp.route('/signup', methods=['POST'])(signup)\n"
            ),
        },
        {
            "filename": "README.md",
            "language": "markdown",
            "content": (
                "# JWT Auth Project\n\n"
                "This is a simple JWT authentication system built with Flask.\n\n"
                "## Endpoints\n\n"
                "- POST /signup – create a new user\n"
                "- POST /login  – authenticate and receive a JWT token\n"
            ),
        },
    ],
}

# ---------------------------------------------------------------------------
# Send the request
# ---------------------------------------------------------------------------

req = urllib.request.Request(
    URL,
    data=json.dumps(data).encode("utf-8"),
    headers={"Content-Type": "application/json"},
)

print(f"Sending review request to {URL} ...")
print(f"Files submitted: {[f['filename'] for f in data['program_files']]}\n")

try:
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode("utf-8"))

        intern = result["intern_review"]
        manager = result["manager_summary"]

        print("[OK] API Request Successful!")
        print("=" * 60)

        print(f"\nSCORE: {intern['score']} / 100\n")

        print("FEEDBACK (screen):")
        print(intern["feedback"])

        print("\nSPEECH TEXT (audio-optimised):")
        print(intern.get("speech_text", "[not returned]"))
        print(f"[audio_supported: {intern.get('audio_supported', False)}]")

        print("\nSTRENGTHS:")
        for s in intern["strengths"]:
            print(f"  • {s}")

        print("\nBUGS:")
        bugs = intern.get("bugs", [])
        if bugs:
            for b in bugs:
                print(f"  ⚠ {b}")
        else:
            print("  None found")

        print("\nMISSING:")
        for m in intern["missing"]:
            print(f"  • {m}")

        print("\nSUGGESTIONS:")
        for s in intern["suggestions"]:
            print(f"  • {s}")

        print("\n" + "=" * 60)
        print("MANAGER SUMMARY")
        print(f"Overall Score : {manager['overall_score']} / 100")
        print(f"Risk Level    : {manager['risk_level'].upper()}")
        print(f"Summary       : {manager['summary']}")
        print(f"Recommendation: {manager['recommendation']}")
        print("=" * 60)

except urllib.error.HTTPError as e:
    print(f"[FAIL] API Request Failed - HTTP {e.code}")
    print(e.read().decode("utf-8"))
except Exception as e:
    print(f"[ERROR] Connection Error: {e}")
    print("Is the uvicorn server running? Try: uvicorn app:app --reload")
