import requests
import os
import time

BASE_URL = "http://127.0.0.1:8080"

def test_api():
    print("Testing GET /api/jobs...")
    r = requests.get(f"{BASE_URL}/api/jobs")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    jobs = r.json()
    print(f"Jobs in database: {[job['title'] for job in jobs]}")
    
    print("\nEnsuring clean state by deleting existing test job if present...")
    requests.delete(f"{BASE_URL}/api/jobs/QA%20Automation%20Engineer")

    print("\nTesting POST /api/jobs (create job)...")
    job_payload = {
        "title": "QA Automation Engineer",
        "dept": "Quality Assurance",
        "loc": "Remote, IN",
        "type": "Full-time",
        "exp": "2+ years",
        "reqSkills": ["Selenium", "Python", "pytest", "Git"],
        "prefSkills": ["Docker", "FastAPI"],
        "desc": "Verify web app backend and frontend features."
    }
    r = requests.post(f"{BASE_URL}/api/jobs", json=job_payload)
    if r.status_code == 400 and "already exists" in r.text:
        print("Job already exists in SQLite, skipping creation.")
    else:
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        print("Job created successfully!")
        
    print("\nTesting GET /api/jobs/QA Automation Engineer/candidates (initial)...")
    r = requests.get(f"{BASE_URL}/api/jobs/QA%20Automation%20Engineer/candidates")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    candidates = r.json()
    print(f"Initial candidates: {len(candidates)}")
    
    print("\nTesting POST /api/jobs/QA Automation Engineer/upload...")
    resume_path = "test_resumes/Rahul_Kumar_Resume.pdf"
    if not os.path.exists(resume_path):
        os.makedirs("test_resumes", exist_ok=True)
        with open(resume_path, "wb") as f:
            f.write(b"%PDF-1.4 ... dummy text ...")
            
    with open(resume_path, "rb") as f:
        files = {"files": ("Rahul_Kumar_Resume.pdf", f, "application/pdf")}
        r = requests.post(f"{BASE_URL}/api/jobs/QA%20Automation%20Engineer/upload", files=files)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    resp_data = r.json()
    print(f"Upload response: {resp_data}")
    candidate_id = resp_data["candidate_ids"][0]
    print(f"Uploaded candidate ID: {candidate_id}")
    
    r = requests.get(f"{BASE_URL}/api/jobs/QA%20Automation%20Engineer/candidates")
    candidates = r.json()
    print(f"Candidates list count after upload: {len(candidates)}")
    assert len(candidates) > 0, "No candidates found after upload"
    assert candidates[0]["screening_status"] == "Queued", f"Expected 'Queued', got {candidates[0]['screening_status']}"
    
    print("\nTesting POST /api/jobs/QA Automation Engineer/screen...")
    r = requests.post(f"{BASE_URL}/api/jobs/QA%20Automation%20Engineer/screen")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    print(f"Screening response: {r.json()}")
    
    print("Waiting for background AI screening to process the resume...")
    for _ in range(10):
        time.sleep(1)
        r = requests.get(f"{BASE_URL}/api/jobs/QA%20Automation%20Engineer/candidates")
        candidates = r.json()
        if candidates[0]["screening_status"] not in ["Queued", "Processing"]:
            break
            
    print(f"Candidate screen status: {candidates[0]['screening_status']}")
    print(f"Candidate matched score: {candidates[0]['match']}%")
    print(f"Candidate strengths: {candidates[0]['strengths']}")
    print(f"Candidate gaps: {candidates[0]['gaps']}")
    print(f"Candidate AI explanation: {candidates[0]['explanation'][:200]}...")
    
    print("\nTesting PATCH /api/candidates/status...")
    r = requests.patch(f"{BASE_URL}/api/candidates/{candidate_id}/status", json={"status": "Shortlisted"})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    
    r = requests.get(f"{BASE_URL}/api/jobs/QA%20Automation%20Engineer/candidates")
    candidates = r.json()
    print(f"Candidate status after update: {candidates[0]['status']}")
    assert candidates[0]["status"] == "Shortlisted", "Candidate status was not updated"
    
    print("\nTesting GET /api/candidates/{candidate_id}/resume...")
    r = requests.get(f"{BASE_URL}/api/candidates/{candidate_id}/resume")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    assert r.headers.get("content-type") == "application/pdf", f"Expected application/pdf content type"
    print("Resume PDF endpoint working cleanly!")

    print("\nTesting DELETE /api/candidates/{candidate_id}...")
    r = requests.delete(f"{BASE_URL}/api/candidates/{candidate_id}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    print("Candidate deleted successfully!")

    print("\nTesting DELETE /api/jobs/{job_title}...")
    r = requests.delete(f"{BASE_URL}/api/jobs/QA%20Automation%20Engineer")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    print("Job position deleted successfully!")

    print("\nALL API ENDPOINTS TESTED AND VALIDATED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api()
