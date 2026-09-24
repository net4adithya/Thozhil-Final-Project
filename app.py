import os
import re
import uuid
import sqlite3
import json
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import io
import html
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pypdf
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from ai_screener_engine import screen_resume_pipeline

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ThozhilScreener")

# Initialize FastAPI
app = FastAPI(title="Thozhil AI Resume Screener API")

# Enable CORS for local testing/development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "database.db"
UPLOAD_DIR = "uploads"
TEST_RESUMES_DIR = "test_resumes"
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}

os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─── DATABASE HELPERS ────────────────────────────────────────────────────────


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create jobs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        title TEXT PRIMARY KEY,
        dept TEXT NOT NULL,
        loc TEXT NOT NULL,
        type TEXT NOT NULL,
        exp TEXT NOT NULL,
        req_skills TEXT NOT NULL,
        pref_skills TEXT NOT NULL,
        desc TEXT NOT NULL
    )
    """)

    # Create candidates table (with matched_skills and missing_skills columns)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        job_title TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT NOT NULL,
        roleText TEXT NOT NULL,
        applied TEXT NOT NULL,
        match INTEGER NOT NULL,
        skills INTEGER NOT NULL,
        experience INTEGER NOT NULL,
        projects INTEGER NOT NULL,
        education INTEGER NOT NULL,
        requirements INTEGER NOT NULL,
        recommend TEXT NOT NULL,
        status TEXT NOT NULL,
        expText TEXT NOT NULL,
        eduText TEXT NOT NULL,
        locText TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        currentRole TEXT NOT NULL,
        strengths TEXT NOT NULL,
        gaps TEXT NOT NULL,
        explanation TEXT NOT NULL,
        resume_filename TEXT NOT NULL,
        screening_status TEXT NOT NULL DEFAULT 'Done',
        matched_skills TEXT NOT NULL DEFAULT '[]',
        missing_skills TEXT NOT NULL DEFAULT '[]',
        FOREIGN KEY (job_title) REFERENCES jobs (title) ON DELETE CASCADE
    )
    """)

    # Add columns to existing databases that may not have them
    try:
        cursor.execute("ALTER TABLE candidates ADD COLUMN matched_skills TEXT NOT NULL DEFAULT '[]'")
    except sqlite3.OperationalError:
        pass  # Column already exists
    try:
        cursor.execute("ALTER TABLE candidates ADD COLUMN missing_skills TEXT NOT NULL DEFAULT '[]'")
    except sqlite3.OperationalError:
        pass

    conn.commit()

    # Seed default data if jobs table is empty
    cursor.execute("SELECT COUNT(*) FROM jobs")
    if cursor.fetchone()[0] == 0:
        logger.info("Seeding default jobs and candidates database...")

        # Default Jobs
        default_jobs = [
            (
                "Software Engineer", "Engineering", "Chennai", "Full-time", "2–4 years",
                json.dumps(["Python", "FastAPI", "PostgreSQL", "REST APIs", "Docker", "AWS"]),
                json.dumps(["Kubernetes", "Redis", "CI/CD"]),
                "We are looking for a Python Software Engineer to design, develop, and maintain secure Relational API microservices. You will work closely with frontend and deployment teams to scale backend clusters."
            ),
            (
                "Backend Developer", "Engineering", "Bengaluru", "Full-time", "3–5 years",
                json.dumps(["Java", "Spring Boot", "MySQL", "REST APIs", "Docker", "Git"]),
                json.dumps(["AWS", "Kafka", "Microservices"]),
                "Seeking a Java Backend Engineer with strong expertise in building enterprise-grade REST APIs, relational schemas (MySQL), and managing container deployments."
            ),
            (
                "Frontend Developer", "Product", "Chennai", "Full-time", "2–4 years",
                json.dumps(["React", "JavaScript", "HTML5", "CSS3", "TailwindCSS", "Git"]),
                json.dumps(["Next.js", "TypeScript", "Redux"]),
                "Design and implement modern, responsive user interfaces. You will work with TailwindCSS utility configurations and coordinate dashboard component libraries."
            ),
            (
                "ML Engineer", "Data Science", "Bengaluru", "Full-time", "3–5 years",
                json.dumps(["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "SQL"]),
                json.dumps(["Docker", "MLOps", "Kubernetes"]),
                "Develop, evaluate, and deploy machine learning models. Optimize neural networks and scale training pipelines."
            ),
            (
                "Data Analyst", "Analytics", "Chennai", "Full-time", "1–3 years",
                json.dumps(["SQL", "Python", "Excel", "Tableau", "PowerBI"]),
                json.dumps(["Statistics", "R"]),
                "Analyze business metrics, build interactive dashboards, and deliver data-driven intelligence to our business partners and client pools."
            )
        ]
        cursor.executemany("""
        INSERT INTO jobs (title, dept, loc, type, exp, req_skills, pref_skills, desc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, default_jobs)

        # Default Candidates (seeded from test_resumes directory)
        default_candidates = [
            # Software Engineer Candidates
            (
                "se-1", "Software Engineer", "Rahul Kumar", "RK", "Backend Engineer", "Applied 2d ago",
                92, 95, 90, 88, 100, 91, "SHORTLIST", "Shortlisted",
                "2.8 years", "B.E. Computer Science, Anna University", "Chennai, IN",
                "rahul.kumar.dev@example.com", "+91 98765 43210", "Software Engineer at TechOps Solutions",
                json.dumps([
                    "Strong backend development experience with FastAPI",
                    "Direct FastAPI experience in 2 commercial web applications",
                    "Good PostgreSQL query optimization & schema design knowledge",
                    "Relevant REST API projects with structured data modeling"
                ]),
                json.dumps([
                    "No demonstrated AWS cloud infrastructure experience",
                    "Limited Kubernetes container orchestration exposure"
                ]),
                "The candidate exhibits a robust foundation in backend engineering, directly aligning with the core requirements of the specified role. Their tenure of 2.8 years demonstrates sustained professional engagement in server-side logic and database architecture. A critical advantage is their extensive, hands-on experience with FastAPI and Python, which form the backbone of our target stack. The AI analysis of their recent projects indicates a high proficiency in structuring RESTful APIs and optimizing endpoint performance. Furthermore, their demonstrated knowledge of PostgreSQL suggests capability in handling complex relational data schemas. However, there are notable gaps regarding cloud infrastructure. The resume lacks explicit mentions of AWS services (EC2, S3, RDS), which is a preferred requirement. Similarly, container orchestration via Kubernetes appears limited in scope.",
                "Rahul_Kumar_Resume.pdf", "Done",
                json.dumps(["Python", "FastAPI", "PostgreSQL", "REST APIs", "Docker"]),
                json.dumps(["AWS", "Kubernetes", "Redis", "CI/CD"])
            ),
            (
                "se-2", "Software Engineer", "Priya Sharma", "PS", "Software Developer", "Applied 3d ago",
                88, 91, 84, 90, 100, 86, "SHORTLIST", "In Review",
                "3.2 years", "B.Tech Information Technology, VIT", "Bengaluru, IN",
                "priya.sharma@example.com", "+91 87654 32109", "Software Engineer at CloudScale Inc.",
                json.dumps([
                    "Strong Python programming and Flask development experience",
                    "Excellent SQL query structures and data normalization",
                    "Demonstrated REST API lifecycle management"
                ]),
                json.dumps([
                    "No direct FastAPI application experience (though has Flask background)",
                    "Lacks Kubernetes container scaling experience"
                ]),
                "Priya Sharma is a highly capable software developer with over 3 years of hands-on experience in python-based stacks. Although her experience with FastAPI is minimal, her depth in Flask web APIs translates exceptionally well to our pipeline. She possesses strong SQL skills and has successfully integrated relational databases in multiple backend projects. Her education from VIT is highly relevant. Her main limitations are a lack of direct FastAPI experience and minimal exposure to container orchestration tools like Kubernetes.",
                "Priya_Sharma_Resume.pdf", "Done",
                json.dumps(["Python", "PostgreSQL", "REST APIs", "Docker"]),
                json.dumps(["FastAPI", "Kubernetes", "Redis", "AWS", "CI/CD"])
            ),
            (
                "se-3", "Software Engineer", "Arjun Patel", "AP", "Junior Backend Developer", "Applied 1d ago",
                81, 82, 80, 78, 90, 84, "REVIEW", "New",
                "2.1 years", "B.C.A. SRM University", "Chennai, IN",
                "arjun.patel.dev@example.com", "+91 76543 21098", "Junior Developer at AppStudio Solutions",
                json.dumps([
                    "Solid Python script construction and automation",
                    "Has built functional REST APIs using Django framework",
                    "Basic Docker containerization familiarity"
                ]),
                json.dumps([
                    "Relatively short professional experience history (2 years)",
                    "Lacks advanced PostgreSQL index optimization details",
                    "No AWS cloud deployment experience"
                ]),
                "Arjun Patel is a solid mid-level candidate who matches the core backend requirements reasonably well. He has built REST APIs using Django and Python. He has basic familiarity with Docker containers, which is positive. The main drawbacks are his relatively short experience profile (2.1 years) and a lack of depth in relational database design (PostgreSQL) and cloud infrastructure. He is recommended for a review call to gauge his technical depth.",
                "Arjun_Patel_Resume.pdf", "Done",
                json.dumps(["Python", "REST APIs", "Docker"]),
                json.dumps(["FastAPI", "PostgreSQL", "AWS", "Kubernetes", "Redis", "CI/CD"])
            ),
            (
                "se-4", "Software Engineer", "Karthik Raman", "KR", "Python Scripting Associate", "Applied 4d ago",
                76, 78, 74, 70, 85, 78, "REVIEW", "New",
                "2.5 years", "B.Sc Computer Science, Madras Christian College", "Chennai, IN",
                "karthik.raman@example.com", "+91 95432 10987", "Associate Developer at Infoline",
                json.dumps([
                    "Proficient script-writer in Python and core data formats",
                    "Good comprehension of HTTP REST standards",
                    "Active Git pipeline version management"
                ]),
                json.dumps([
                    "No exposure to modern API web servers (FastAPI/Django)",
                    "No relational database indexing experience"
                ]),
                "Karthik Raman is an associate developer with solid Python scripting skills. He has worked with REST APIs and understands version control pipelines well. However, he lacks direct FastAPI or database optimization experience, making him a moderate match. A technical screening is advised to check his adaptability.",
                "Karthik_Raman_Resume.pdf", "Done",
                json.dumps(["Python", "REST APIs"]),
                json.dumps(["FastAPI", "PostgreSQL", "Docker", "AWS", "Kubernetes", "CI/CD", "Redis"])
            ),
            (
                "se-5", "Software Engineer", "Ananya Iyer", "AI", "System Engineer Analyst", "Applied 5d ago",
                65, 60, 68, 65, 80, 62, "REJECT", "Rejected",
                "1.5 years", "B.Tech ECE, SSN College of Engineering", "Chennai, IN",
                "ananya.iyer@example.com", "+91 94321 09876", "Systems Engineer at Infosys",
                json.dumps([
                    "Foundational programming in Python",
                    "Clear verbal communication style"
                ]),
                json.dumps([
                    "Lacks structural web API development training",
                    "Minimal knowledge of relational DB servers",
                    "Under 2 years professional programming history"
                ]),
                "Ananya Iyer is a junior engineer with a background in electronics. While she has basic Python scripting knowledge, she does not demonstrate sufficient familiarity with backend frameworks (FastAPI/Django), REST APIs, or SQL databases. Her overall experience level is also below the requested range. She is not recommended for this role.",
                "Ananya_Iyer_Resume.pdf", "Done",
                json.dumps(["Python"]),
                json.dumps(["FastAPI", "PostgreSQL", "REST APIs", "Docker", "AWS", "Kubernetes", "Redis", "CI/CD"])
            ),
            (
                "se-6", "Software Engineer", "Siddharth Mehta", "SM", "Python API Lead", "Applied Yesterday",
                89, 92, 86, 88, 90, 88, "SHORTLIST", "Shortlisted",
                "4.0 years", "B.E. Computer Science, PSG Tech", "Coimbatore, IN",
                "sid.mehta@example.com", "+91 93210 98765", "Backend Lead at CoreTech Platforms",
                json.dumps([
                    "Strong Python development with FastAPI framework focus",
                    "Well-versed in Docker containerizing and Kubernetes configs",
                    "Expertise in relational database schema indexing and query analysis"
                ]),
                json.dumps([
                    "Lacks AWS stack knowledge (worked with Google Cloud GCP instead)"
                ]),
                "Siddharth Mehta is an excellent candidate with 4 years of backend experience, specializing in Python and FastAPI. He has practical container orchestration experience using Kubernetes and Docker. Although he has worked with GCP rather than AWS, his cloud skills are highly transferable. He is a strong match for the team.",
                "Siddharth_Mehta_Resume.pdf", "Done",
                json.dumps(["Python", "FastAPI", "PostgreSQL", "REST APIs", "Docker", "Kubernetes"]),
                json.dumps(["AWS", "Redis", "CI/CD"])
            ),

            # Backend Developer Candidates
            (
                "bd-1", "Backend Developer", "Vikram Singh", "VS", "Java Backend Engineer", "Applied 2d ago",
                91, 93, 90, 88, 95, 90, "SHORTLIST", "Shortlisted",
                "4.2 years", "B.Tech Computer Science, NIT Trichy", "Bengaluru, IN",
                "vikram.singh@example.com", "+91 82345 67890", "Software Engineer at JavaForge",
                json.dumps(["Strong Spring Boot experience", "Expert in SQL query writing", "Excellent Git management"]),
                json.dumps(["No AWS experience (GCP only)"]),
                "Vikram has a strong software foundation in Java and Spring Boot. He has designed relational SQL databases for scale.",
                "Vikram_Singh_Resume.pdf", "Done",
                json.dumps(["Java", "Spring Boot", "MySQL", "REST APIs", "Docker", "Git"]),
                json.dumps(["AWS", "Kafka", "Microservices"])
            ),
            (
                "bd-2", "Backend Developer", "Deepa Pillai", "DP", "Software Engineer", "Applied 3d ago",
                83, 85, 80, 82, 90, 84, "REVIEW", "In Review",
                "3.5 years", "B.Tech IT, Anna University", "Chennai, IN",
                "deepa.p@example.com", "+91 91234 56789", "Java Developer at WebCreations",
                json.dumps(["Good Java and Hibernate knowledge", "Understands containerization well"]),
                json.dumps(["No direct experience with Spring Boot", "Lacks microservice deployment projects"]),
                "Deepa has solid programming experience but needs training on Spring microservice architectures.",
                "Deepa_Pillai_Resume.pdf", "Done",
                json.dumps(["Java", "MySQL", "REST APIs", "Docker", "Git"]),
                json.dumps(["Spring Boot", "AWS", "Kafka", "Microservices"])
            ),

            # Frontend Developer Candidates
            (
                "fd-1", "Frontend Developer", "Rohan Das", "RD", "React Architect", "Applied 1d ago",
                94, 96, 92, 95, 90, 93, "SHORTLIST", "Shortlisted",
                "3.8 years", "B.E. Computer Science, SRM", "Chennai, IN",
                "rohan.das@example.com", "+91 74321 09876", "UI Architect at Frontend Labs",
                json.dumps(["Expert React hooks & state design", "Tailwind CSS styling master", "Excellent typescript support"]),
                json.dumps(["No Next.js experience"]),
                "Rohan is an exceptionally skilled React component designer. He has built visual systems using utility styles.",
                "Rohan_Das_Resume.pdf", "Done",
                json.dumps(["React", "JavaScript", "HTML5", "CSS3", "TailwindCSS", "Git"]),
                json.dumps(["Next.js", "TypeScript", "Redux"])
            )
        ]
        cursor.executemany("""
        INSERT INTO candidates (
            id, job_title, name, avatar, roleText, applied, match, skills, experience, projects, education, requirements,
            recommend, status, expText, eduText, locText, email, phone, currentRole, strengths, gaps, explanation,
            resume_filename, screening_status, matched_skills, missing_skills
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_candidates)

        conn.commit()
    conn.close()


# Start database initialization
init_db()


# ─── FILE PARSERS ─────────────────────────────────────────────────────────────


def extract_text_from_pdf(file_path: str) -> str:
    """Extract plain text from a PDF file using pypdf."""
    try:
        reader = pypdf.PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        logger.error(f"Error parsing PDF file {file_path}: {e}")
        return ""


def extract_text_from_docx(file_path: str) -> str:
    """Extract plain text from a DOCX file using python-docx."""
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = []
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text.strip())
        # Also extract text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        paragraphs.append(cell.text.strip())
        return "\n".join(paragraphs)
    except Exception as e:
        logger.error(f"Error parsing DOCX file {file_path}: {e}")
        return ""


def extract_text_from_file(file_path: str) -> str:
    """Dispatch file to the appropriate text extractor based on extension."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    else:
        logger.warning(f"Unsupported file extension for text extraction: {ext}")
        return ""


# ─── BACKGROUND SCREENING WORKER ──────────────────────────────────────────────


def background_screen_task(candidate_id: str, file_path: str, job_title: str):
    """
    Background task that processes a single resume:
    1. Load job requirements from DB
    2. Extract text from resume (PDF or DOCX)
    3. Run AI/NLP screening pipeline
    4. Update candidate record in DB with results
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get Job requirements
        cursor.execute("SELECT * FROM jobs WHERE title = ?", (job_title,))
        job_row = cursor.fetchone()
        if not job_row:
            logger.error(f"Background task failed: Job '{job_title}' not found")
            cursor.execute("UPDATE candidates SET screening_status = 'Failed' WHERE id = ?", (candidate_id,))
            conn.commit()
            return

        job = dict(job_row)

        # Update status to processing
        cursor.execute("UPDATE candidates SET screening_status = 'Processing' WHERE id = ?", (candidate_id,))
        conn.commit()

        # Extract text based on file type
        resume_text = extract_text_from_file(file_path)
        filename = os.path.basename(file_path)

        if not resume_text or len(resume_text.strip()) < 50:
            logger.warning(f"Very short or empty text extracted from {filename}. Proceeding with filename-based analysis.")

        # Screen candidate with AI Engine
        screened_cand = screen_resume_pipeline(resume_text, filename, job)

        # Update candidate in DB with full screening results
        cursor.execute("""
        UPDATE candidates
        SET name = ?, avatar = ?, roleText = ?, match = ?, skills = ?, experience = ?, projects = ?,
            education = ?, requirements = ?, recommend = ?, expText = ?, eduText = ?, locText = ?,
            email = ?, phone = ?, currentRole = ?, strengths = ?, gaps = ?, explanation = ?,
            matched_skills = ?, missing_skills = ?, screening_status = 'Done'
        WHERE id = ?
        """, (
            screened_cand["name"], screened_cand["avatar"], screened_cand["roleText"],
            screened_cand["match"], screened_cand["skills"], screened_cand["experience"],
            screened_cand["projects"], screened_cand["education"], screened_cand["requirements"],
            screened_cand["recommend"], screened_cand["expText"], screened_cand["eduText"],
            screened_cand["locText"], screened_cand["email"], screened_cand["phone"],
            screened_cand["currentRole"], screened_cand["strengths"], screened_cand["gaps"],
            screened_cand["explanation"],
            screened_cand.get("matched_skills", "[]"),
            screened_cand.get("missing_skills", "[]"),
            candidate_id
        ))
        conn.commit()
        logger.info(f"Screening complete for candidate ID: {candidate_id} (name: {screened_cand['name']})")

    except Exception as e:
        logger.error(f"Background screening error for candidate {candidate_id}: {e}")
        try:
            cursor.execute("UPDATE candidates SET screening_status = 'Failed' WHERE id = ?", (candidate_id,))
            conn.commit()
        except Exception as db_err:
            logger.error(f"Failed to mark candidate as failed: {db_err}")
    finally:
        conn.close()


# ─── API ROUTES ───────────────────────────────────────────────────────────────


@app.get("/api/jobs")
def get_jobs():
    """Get all job profiles."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs")
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        job = dict(row)
        job['reqSkills'] = json.loads(job['req_skills'])
        job['prefSkills'] = json.loads(job['pref_skills'])
        del job['req_skills']
        del job['pref_skills']
        result.append(job)
    return result


class JobCreate(BaseModel):
    title: str
    dept: str
    loc: str
    type: str
    exp: str
    reqSkills: List[str]
    prefSkills: List[str]
    desc: str


@app.post("/api/jobs")
def create_job(job_in: JobCreate):
    """Create a new job profile."""
    if not job_in.title.strip():
        raise HTTPException(status_code=400, detail="Job title cannot be empty")
    if not job_in.reqSkills:
        raise HTTPException(status_code=400, detail="At least one required skill must be specified")

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO jobs (title, dept, loc, type, exp, req_skills, pref_skills, desc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_in.title.strip(), job_in.dept.strip(), job_in.loc.strip(),
            job_in.type, job_in.exp.strip(),
            json.dumps(job_in.reqSkills), json.dumps(job_in.prefSkills), job_in.desc.strip()
        ))
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail=f"Job title '{job_in.title}' already exists")
    finally:
        conn.close()
    return {"status": "success", "title": job_in.title}


@app.get("/api/jobs/{job_title}/candidates")
def get_candidates(job_title: str):
    """Get all candidates for a specific job, sorted by match score."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM candidates WHERE job_title = ?", (job_title,))
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        cand = dict(row)
        # Deserialize JSON fields
        cand['strengths'] = json.loads(cand['strengths']) if cand['strengths'] else []
        cand['gaps'] = json.loads(cand['gaps']) if cand['gaps'] else []
        cand['matched_skills'] = json.loads(cand.get('matched_skills', '[]'))
        cand['missing_skills'] = json.loads(cand.get('missing_skills', '[]'))
        result.append(cand)

    # Sort by match score descending
    result.sort(key=lambda x: x['match'], reverse=True)
    return result


@app.post("/api/jobs/{job_title}/upload")
async def upload_resumes(job_title: str, files: List[UploadFile] = File(...)):
    """
    Upload one or more resume files (PDF or DOCX) for a specific job.
    - Validates file extension and MIME type
    - Enforces 5MB size limit
    - Saves file to /uploads/ directory
    - Creates a placeholder candidate record in DB with screening_status='Queued'
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if job exists
    cursor.execute("SELECT COUNT(*) FROM jobs WHERE title = ?", (job_title,))
    if cursor.fetchone()[0] == 0:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Job profile '{job_title}' not found")

    uploaded_cand_ids = []
    errors = []

    for file in files:
        # Validate file extension
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            errors.append(f"'{file.filename}': Unsupported format. Only PDF and DOCX are allowed.")
            continue

        # Read file content
        content = await file.read()

        # Validate file size
        if len(content) > MAX_FILE_SIZE_BYTES:
            size_mb = len(content) / (1024 * 1024)
            errors.append(f"'{file.filename}': File too large ({size_mb:.1f} MB). Maximum is 5 MB.")
            continue

        # Validate MIME type
        if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
            # Some browsers send application/octet-stream for docx — allow if extension is valid
            if not (file.content_type == "application/octet-stream" and ext in ALLOWED_EXTENSIONS):
                errors.append(f"'{file.filename}': Invalid file type '{file.content_type}'.")
                continue

        # Generate unique candidate ID and safe filename
        candidate_id = f"cand-{uuid.uuid4().hex[:8]}"
        safe_original = re.sub(r'[^\w\.\-]', '_', file.filename or "resume")
        filename = f"{candidate_id}_{safe_original}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(content)

        # Build human-readable size string
        size_bytes = len(content)
        size_str = f"{size_bytes // 1024} KB" if size_bytes < 1024 * 1024 else f"{size_bytes / (1024 * 1024):.1f} MB"

        # Build placeholder candidate profile (will be updated after screening)
        name_from_file = os.path.splitext(safe_original)[0].replace("_", " ").replace("-", " ").strip()
        avatar_initials = "".join([p[0] for p in name_from_file.split()[:2]]).upper() or "CN"

        cursor.execute("""
        INSERT INTO candidates (
            id, job_title, name, avatar, roleText, applied, match, skills, experience, projects, education, requirements,
            recommend, status, expText, eduText, locText, email, phone, currentRole, strengths, gaps, explanation,
            resume_filename, screening_status, matched_skills, missing_skills
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            candidate_id, job_title, name_from_file, avatar_initials, "Queued Candidate", "Applied Just Now",
            0, 0, 0, 0, 0, 0, "REVIEW", "New", "Pending...", "Pending...", "Pending...",
            "pending@example.com", "N/A", "N/A", json.dumps([]), json.dumps([]),
            "Screening analysis is queued and will load shortly.",
            filename, "Queued", json.dumps([]), json.dumps([])
        ))
        uploaded_cand_ids.append(candidate_id)

    conn.commit()
    conn.close()

    if not uploaded_cand_ids and errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))

    response = {"status": "success", "candidate_ids": uploaded_cand_ids}
    if errors:
        response["warnings"] = errors
    return response


@app.post("/api/jobs/{job_title}/screen")
def start_screening(job_title: str, background_tasks: BackgroundTasks):
    """
    Initiate background screening for all queued candidates under a job.
    Returns immediately; screening runs asynchronously in background tasks.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, resume_filename FROM candidates WHERE job_title = ? AND screening_status = 'Queued'", (job_title,))
    rows = cursor.fetchall()

    if not rows:
        conn.close()
        return {"status": "no_files_queued", "message": "No new resumes in queue to screen."}

    for row in rows:
        candidate_id = row['id']
        filename = row['resume_filename']
        file_path = os.path.join(UPLOAD_DIR, filename)

        if not os.path.exists(file_path):
            logger.warning(f"File not found for candidate {candidate_id}: {file_path}")
            cursor.execute("UPDATE candidates SET screening_status = 'Failed' WHERE id = ?", (candidate_id,))
            continue

        background_tasks.add_task(background_screen_task, candidate_id, file_path, job_title)

    conn.commit()
    conn.close()
    return {"status": "processing", "message": f"Screening initiated for {len(rows)} resume(s)."}


@app.post("/api/candidates/{candidate_id}/retry")
def retry_screening(candidate_id: str, background_tasks: BackgroundTasks):
    """Retry screening for a candidate whose screening status is 'Failed'."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,))
    cand = cursor.fetchone()
    if not cand:
        conn.close()
        raise HTTPException(status_code=404, detail="Candidate not found")

    cand = dict(cand)
    if cand['screening_status'] not in ('Failed', 'Queued'):
        conn.close()
        return {"status": "skipped", "message": f"Candidate screening status is '{cand['screening_status']}', not retryable."}

    file_path = os.path.join(UPLOAD_DIR, cand['resume_filename'])
    if not os.path.exists(file_path):
        conn.close()
        raise HTTPException(status_code=404, detail="Resume file not found on disk. Cannot retry.")

    # Reset to queued state
    cursor.execute("UPDATE candidates SET screening_status = 'Queued' WHERE id = ?", (candidate_id,))
    conn.commit()
    conn.close()

    background_tasks.add_task(background_screen_task, candidate_id, file_path, cand['job_title'])
    return {"status": "retrying", "message": "Screening retry initiated."}


class StatusUpdate(BaseModel):
    status: str


@app.patch("/api/candidates/{candidate_id}/status")
def update_candidate_status(candidate_id: str, update_in: StatusUpdate):
    """Update recruiter decision status for a candidate (Shortlisted/In Review/Rejected/New)."""
    allowed_statuses = {"Shortlisted", "In Review", "New", "Rejected"}
    if update_in.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {', '.join(allowed_statuses)}")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,))
    cand = cursor.fetchone()
    if not cand:
        conn.close()
        raise HTTPException(status_code=404, detail="Candidate not found")

    new_status = update_in.status
    # Sync AI recommendation with recruiter status where logical
    recommend = dict(cand)['recommend']
    if new_status == "Shortlisted":
        recommend = "SHORTLIST"
    elif new_status == "Rejected":
        recommend = "REJECT"
    elif new_status == "In Review":
        recommend = "REVIEW"

    cursor.execute("""
    UPDATE candidates
    SET status = ?, recommend = ?
    WHERE id = ?
    """, (new_status, recommend, candidate_id))
    conn.commit()
    conn.close()
    return {"status": "success", "new_status": new_status}


@app.delete("/api/candidates/{candidate_id}")
def delete_candidate(candidate_id: str):
    """Delete a candidate profile and its uploaded resume file."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT resume_filename FROM candidates WHERE id = ?", (candidate_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    filename = row['resume_filename']
    cursor.execute("DELETE FROM candidates WHERE id = ?", (candidate_id,))
    conn.commit()
    conn.close()

    # Delete uploaded file (only if it was actually uploaded, not a seed file)
    if filename and filename.startswith("cand-"):
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Failed to remove resume file {file_path}: {e}")

    return {"status": "success", "message": "Candidate deleted successfully"}


@app.delete("/api/jobs/{job_title}")
def delete_job(job_title: str):
    """Delete a job and all associated candidates and their uploaded resume files."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM jobs WHERE title = ?", (job_title,))
    if cursor.fetchone()[0] == 0:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Job '{job_title}' not found")

    # Get all uploaded files for cleanup
    cursor.execute("SELECT resume_filename FROM candidates WHERE job_title = ? AND resume_filename LIKE 'cand-%'", (job_title,))
    files_to_delete = [row['resume_filename'] for row in cursor.fetchall()]

    cursor.execute("DELETE FROM candidates WHERE job_title = ?", (job_title,))
    cursor.execute("DELETE FROM jobs WHERE title = ?", (job_title,))
    conn.commit()
    conn.close()

    # Clean up uploaded files
    for fname in files_to_delete:
        file_path = os.path.join(UPLOAD_DIR, fname)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Failed to remove file {file_path}: {e}")

    return {"status": "success", "message": f"Job '{job_title}' and all candidates deleted."}


def generate_pdf_from_candidate_profile(cand: dict) -> bytes:
    """Generate a clean, high-quality resume PDF on the fly using ReportLab."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    styles = getSampleStyleSheet()

    header_title = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#007BFF'),
        fontName='Helvetica-Bold'
    )
    header_subtitle = ParagraphStyle(
        'HeaderSubtitle',
        parent=styles['Normal'],
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#414754'),
        fontName='Helvetica-Bold'
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#191C1D'),
        fontName='Helvetica-Bold',
        spaceBefore=10,
        spaceAfter=4
    )
    body = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#333333'),
        fontName='Helvetica'
    )
    bullet = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#333333'),
        fontName='Helvetica',
        leftIndent=12,
        firstLineIndent=-8
    )

    story = []

    name = cand.get('name', 'Candidate Resume')
    story.append(Paragraph(html.escape(name), header_title))

    role_info = f"{cand.get('roleText', 'Applicant')} &bull; {cand.get('expText', 'N/A')} Experience &bull; {cand.get('locText', 'N/A')}"
    story.append(Paragraph(role_info, header_subtitle))

    contact = f"Email: {cand.get('email', 'N/A')} | Phone: {cand.get('phone', 'N/A')} | Current: {cand.get('currentRole', 'N/A')}"
    story.append(Paragraph(html.escape(contact), body))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width='100%', thickness=1.5, color=colors.HexColor('#007BFF'), spaceBefore=2, spaceAfter=8))

    # Summary
    story.append(Paragraph('Professional Summary & Evaluation', section_heading))
    story.append(Paragraph(html.escape(cand.get('explanation', '') or cand.get('roleText', '')), body))
    story.append(Spacer(1, 6))

    # Skills
    matched = cand.get('matched_skills', [])
    if isinstance(matched, str):
        try:
            matched = json.loads(matched)
        except Exception:
            matched = []
    missing = cand.get('missing_skills', [])
    if isinstance(missing, str):
        try:
            missing = json.loads(missing)
        except Exception:
            missing = []
    all_skills = matched + missing
    if all_skills:
        story.append(Paragraph('Core Competencies & Skills', section_heading))
        skills_str = ' &bull; '.join([html.escape(s) for s in all_skills])
        story.append(Paragraph(skills_str, body))
        story.append(Spacer(1, 6))

    # Strengths
    strengths = cand.get('strengths', [])
    if isinstance(strengths, str):
        try:
            strengths = json.loads(strengths)
        except Exception:
            strengths = []
    if strengths:
        story.append(Paragraph('Key Strengths & Highlights', section_heading))
        for s in strengths:
            story.append(Paragraph(f'&bull; {html.escape(s)}', bullet))
        story.append(Spacer(1, 6))

    # Education
    story.append(Paragraph('Education & Qualifications', section_heading))
    story.append(Paragraph(html.escape(cand.get('eduText', 'Relevant Degree / Certification')), body))

    doc.build(story)
    return buf.getvalue()


def convert_docx_to_pdf(file_path: str, candidate_name: str = "Candidate") -> Optional[bytes]:
    """Extract paragraphs and tables from docx and render into a clean PDF."""
    try:
        from docx import Document
        doc = Document(file_path)
        buf = io.BytesIO()
        pdf_doc = SimpleDocTemplate(
            buf,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'DocxTitle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#007BFF'),
            fontName='Helvetica-Bold',
            spaceAfter=4
        )
        heading_style = ParagraphStyle(
            'DocxHeading',
            parent=styles['Heading2'],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#191C1D'),
            fontName='Helvetica-Bold',
            spaceBefore=6,
            spaceAfter=2
        )
        body_style = ParagraphStyle(
            'DocxBody',
            parent=styles['Normal'],
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#333333'),
            fontName='Helvetica'
        )

        story = []
        for i, p in enumerate(doc.paragraphs):
            txt = p.text.strip()
            if not txt:
                continue
            escaped = html.escape(txt)
            if i == 0:
                story.append(Paragraph(escaped, title_style))
                story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#007BFF'), spaceBefore=2, spaceAfter=6))
            elif txt.isupper() and len(txt) < 35:
                story.append(Paragraph(escaped, heading_style))
            else:
                story.append(Paragraph(escaped, body_style))
            story.append(Spacer(1, 2))

        # Also add text from tables
        for table in doc.tables:
            for row in table.rows:
                cells_text = [c.text.strip() for c in row.cells if c.text.strip()]
                if cells_text:
                    escaped_table_line = " | ".join(html.escape(c) for c in cells_text)
                    story.append(Paragraph(escaped_table_line, body_style))
                    story.append(Spacer(1, 2))

        if not story:
            story.append(Paragraph(html.escape(f"Resume Document: {candidate_name}"), title_style))
            story.append(Paragraph("Document contains no readable text content.", body_style))

        pdf_doc.build(story)
        return buf.getvalue()
    except Exception as e:
        logger.error(f"Error converting DOCX to PDF for {file_path}: {e}")
        return None


@app.get("/api/candidates/{candidate_id}/resume")
def get_candidate_resume(candidate_id: str, download: bool = False, format: Optional[str] = None):
    """
    Serve the resume file for a given candidate.
    - If format='raw' and download=True: returns the original file (e.g. DOCX).
    - If the file is PDF: serves with inline header (or attachment if download=True).
    - If the file is DOCX: auto-converts to PDF on the fly so it can be viewed in browser/iframe!
    - If the file is missing: dynamically generates a clean PDF from candidate profile data.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Candidate not found")

    cand = dict(row)
    filename = cand['resume_filename']
    disp_type = "attachment" if download else "inline"

    # Locate candidate file on disk
    file_path = None
    if os.path.exists(os.path.join(UPLOAD_DIR, filename)):
        file_path = os.path.join(UPLOAD_DIR, filename)
    elif os.path.exists(os.path.join(TEST_RESUMES_DIR, filename)):
        file_path = os.path.join(TEST_RESUMES_DIR, filename)

    # 1. If file exists on disk
    if file_path:
        is_docx = filename.lower().endswith(".docx")

        # If user explicitly requested raw download of original DOCX
        if is_docx and (format == "raw" or (download and format != "pdf")):
            return FileResponse(
                file_path,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                content_disposition_type=disp_type,
                filename=filename
            )

        # If it's a PDF
        if not is_docx:
            return FileResponse(
                file_path,
                media_type="application/pdf",
                content_disposition_type=disp_type,
                filename=filename
            )

        # If it's DOCX and user wants to view or download as PDF
        pdf_bytes = convert_docx_to_pdf(file_path, cand['name'])
        if pdf_bytes:
            pdf_filename = f"{os.path.splitext(filename)[0]}.pdf"
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'{disp_type}; filename="{pdf_filename}"'
                }
            )

    # 2. Fallback: Generate PDF on the fly from database candidate record
    pdf_bytes = generate_pdf_from_candidate_profile(cand)
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', cand['name'])
    pdf_filename = f"{safe_name}_Resume.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'{disp_type}; filename="{pdf_filename}"'
        }
    )


@app.get("/api/candidates/{candidate_id}/resume-info")
def get_candidate_resume_info(candidate_id: str):
    """
    Get detailed resume metadata, view/download URLs, and extracted text for candidate.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Candidate not found")

    cand = dict(row)
    filename = cand['resume_filename']
    is_docx = filename.lower().endswith(".docx")

    # Check disk existence and read text
    file_path = None
    if os.path.exists(os.path.join(UPLOAD_DIR, filename)):
        file_path = os.path.join(UPLOAD_DIR, filename)
    elif os.path.exists(os.path.join(TEST_RESUMES_DIR, filename)):
        file_path = os.path.join(TEST_RESUMES_DIR, filename)

    extracted_text = ""
    file_size_bytes = 0
    if file_path:
        file_size_bytes = os.path.getsize(file_path)
        extracted_text = extract_text_from_file(file_path)
    else:
        extracted_text = f"{cand['name']}\n{cand['roleText']}\n{cand['expText']} | {cand['locText']}\n{cand['email']} | {cand['phone']}\n\nSummary:\n{cand['explanation']}"

    size_formatted = f"{file_size_bytes // 1024} KB" if file_size_bytes < 1024 * 1024 else f"{file_size_bytes / (1024 * 1024):.1f} MB"

    matched = json.loads(cand['matched_skills']) if cand.get('matched_skills') else []
    missing = json.loads(cand['missing_skills']) if cand.get('missing_skills') else []
    strengths = json.loads(cand['strengths']) if cand.get('strengths') else []
    gaps = json.loads(cand['gaps']) if cand.get('gaps') else []

    return {
        "id": cand["id"],
        "name": cand["name"],
        "roleText": cand["roleText"],
        "job_title": cand["job_title"],
        "match": cand["match"],
        "filename": filename,
        "is_docx": is_docx,
        "file_type": "DOCX" if is_docx else "PDF",
        "file_size": size_formatted,
        "view_url": f"/api/candidates/{candidate_id}/resume",
        "download_pdf_url": f"/api/candidates/{candidate_id}/resume?download=true",
        "download_raw_url": f"/api/candidates/{candidate_id}/resume?download=true&format=raw" if is_docx else f"/api/candidates/{candidate_id}/resume?download=true",
        "extracted_text": extracted_text,
        "matched_skills": matched,
        "missing_skills": missing,
        "strengths": strengths,
        "gaps": gaps,
        "explanation": cand["explanation"],
        "status": cand["status"],
        "recommend": cand["recommend"]
    }


@app.get("/api/jobs/{job_title}/analytics")
def get_analytics(job_title: str):
    """
    Return analytics metrics for a specific job:
    - Total candidates
    - Screened count (screening_status = 'Done')
    - Shortlisted count
    - Average match score
    - Score distribution buckets (as percentages)
    - Top skill frequencies
    - Hiring funnel data
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT match, status, screening_status, strengths, matched_skills
        FROM candidates WHERE job_title = ?
    """, (job_title,))
    rows = cursor.fetchall()
    conn.close()

    total = len(rows)
    if total == 0:
        return {
            "total": 0, "screened": 0, "shortlisted": 0, "rejected": 0,
            "average_score": "0%",
            "distribution": {"90": 0, "80": 0, "70": 0, "60": 0, "below": 0},
            "funnel": {"applied": 0, "screened": 0, "shortlisted": 0},
            "skills": []
        }

    screened = sum(1 for r in rows if r['screening_status'] == 'Done')
    shortlisted = sum(1 for r in rows if r['status'] == 'Shortlisted')
    rejected = sum(1 for r in rows if r['status'] == 'Rejected')
    
    # Only include screened candidates in average score
    screened_matches = [r['match'] for r in rows if r['screening_status'] == 'Done' and r['match'] > 0]
    average = sum(screened_matches) / len(screened_matches) if screened_matches else 0

    # Score distribution
    dist = {"90": 0, "80": 0, "70": 0, "60": 0, "below": 0}
    for r in rows:
        if r['screening_status'] != 'Done':
            continue
        score = r['match']
        if score >= 90:
            dist["90"] += 1
        elif score >= 80:
            dist["80"] += 1
        elif score >= 70:
            dist["70"] += 1
        elif score >= 60:
            dist["60"] += 1
        else:
            dist["below"] += 1

    # Convert distribution to percentages (based on screened count)
    dist_pct = {k: int((v / screened * 100)) if screened else 0 for k, v in dist.items()}

    # Skills frequency from matched_skills field
    skill_counts: Dict[str, int] = {}
    for r in rows:
        if r['screening_status'] != 'Done':
            continue
        matched = json.loads(r['matched_skills']) if r['matched_skills'] else []
        for skill in matched:
            if skill:
                skill_counts[skill] = skill_counts.get(skill, 0) + 1

    # Format skills to sorted list
    skills_list = [{"name": k, "count": v, "percentage": int((v / screened) * 100) if screened else 0}
                   for k, v in skill_counts.items()]
    skills_list.sort(key=lambda x: x['count'], reverse=True)

    return {
        "total": total,
        "screened": screened,
        "shortlisted": shortlisted,
        "rejected": rejected,
        "average_score": f"{average:.1f}%",
        "distribution": dist_pct,
        "funnel": {
            "applied": total,
            "screened": screened,
            "shortlisted": shortlisted
        },
        "skills": skills_list[:8]  # top 8 most common skills
    }


# ─── STATIC PAGES SERVER ROUTES ───────────────────────────────────────────────


@app.get("/")
def get_root():
    return FileResponse("index.html")


@app.get("/index.html")
def get_index_html():
    return FileResponse("index.html")


@app.get("/index.css")
def get_css():
    return FileResponse("index.css")


# Mount uploads directory as static (for direct file access if needed)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/{path:path}")
def serve_frontend(path: str = ""):
    # Don't serve /api/* as frontend — they should have been handled above
    if path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    if path and os.path.exists(path):
        return FileResponse(path)
    return FileResponse("index.html")
