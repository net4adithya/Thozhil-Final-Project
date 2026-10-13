import os
import re
import json
import math
import uuid
import logging
from typing import List, Dict, Any, Tuple, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ThozhilAI")

TECH_TAXONOMY = {
    "python": "Python", "fastapi": "FastAPI", "flask": "Flask", "django": "Django",
    "postgresql": "PostgreSQL", "postgres": "PostgreSQL", "mysql": "MySQL", "sql": "SQL",
    "sqlite": "SQLite", "redis": "Redis", "mongodb": "MongoDB", "docker": "Docker",
    "kubernetes": "Kubernetes", "k8s": "Kubernetes", "aws": "AWS", "gcp": "GCP",
    "azure": "Azure", "java": "Java", "spring": "Spring Boot", "spring boot": "Spring Boot",
    "react": "React", "react.js": "React", "next.js": "Next.js", "nextjs": "Next.js",
    "typescript": "TypeScript", "javascript": "JavaScript", "js": "JavaScript",
    "html5": "HTML5", "html": "HTML5", "css3": "CSS3", "css": "CSS3",
    "tailwindcss": "TailwindCSS", "tailwind": "TailwindCSS", "redux": "Redux",
    "git": "Git", "github": "GitHub", "rest": "REST APIs", "rest apis": "REST APIs",
    "api": "REST APIs", "ci/cd": "CI/CD", "selenium": "Selenium", "pytest": "pytest",
    "pytorch": "PyTorch", "tensorflow": "TensorFlow", "scikit-learn": "Scikit-Learn",
    "scikit": "Scikit-Learn", "tableau": "Tableau", "powerbi": "PowerBI", "excel": "Excel"
}


def extract_name_from_text(text: str, filename: str) -> str:
    cleaned_filename = os.path.splitext(filename)[0]
    cleaned_filename = re.sub(r'^cand-[a-f0-9]{8}_', '', cleaned_filename, flags=re.IGNORECASE)
    cleaned_filename = cleaned_filename.replace("_", " ").replace("-", " ")
    cleaned_filename = re.sub(r'\b(Resume|resume|CV|cv)\b', '', cleaned_filename).strip()

    if len(cleaned_filename) > 2 and not cleaned_filename.isdigit():
        return cleaned_filename.title()

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for line in lines[:5]:
        if "@" not in line and not re.search(r'\d', line) and len(line.split()) <= 4:
            return line.title()

    return "Candidate Profile"


def extract_email(text: str) -> str:
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else "candidate@example.com"


def extract_phone(text: str) -> str:
    match = re.search(r'\+?[\d][\d\s\-]{8,}\d', text)
    return match.group(0).strip() if match else "+91 98765 43210"


def extract_location(text: str, default_loc: str = "Chennai") -> str:
    cities = [
        "Chennai", "Bengaluru", "Bangalore", "Hyderabad", "Mumbai", "Pune",
        "Delhi", "Coimbatore", "Kochi", "Noida", "Gurugram", "Kolkata",
        "Ahmedabad", "Jaipur", "Surat", "Lucknow"
    ]
    for city in cities:
        if re.search(r'\b' + city + r'\b', text, re.IGNORECASE):
            return f"{city}, IN"
    return f"{default_loc}, IN"


def extract_education(text: str) -> str:
    edu_patterns = [
        r'(M\.Tech[^\n,]{0,60})', r'(M\.S\.[^\n,]{0,60})', r'(MBA[^\n,]{0,60})',
        r'(B\.E\.[^\n,]{0,60})', r'(B\.Tech[^\n,]{0,60})', r'(B\.C\.A\.[^\n,]{0,60})',
        r'(B\.Sc[^\n,]{0,60})', r'(Bachelor[^\n,]{0,60})', r'(Master[^\n,]{0,60})'
    ]
    for pattern in edu_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0).strip()
    return "Bachelor's Degree in Computer Science / IT"


def extract_experience_years(text: str) -> float:
    match = re.search(r'(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)', text, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass

    match = re.search(r'(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)', text, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass

    return 2.5


def extract_skills_from_text(text: str) -> List[str]:
    text_lower = text.lower()
    found_skills = set()
    for kw, canon in TECH_TAXONOMY.items():
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.add(canon)

    extra_matches = re.findall(r'\b[A-Z][a-zA-Z0-9\+\#\.]{1,15}\b', text)
    for m in extra_matches:
        m_lower = m.lower()
        if m_lower in TECH_TAXONOMY:
            found_skills.add(TECH_TAXONOMY[m_lower])

    return list(found_skills)


def calculate_tfidf_cosine_sim(doc1: str, doc2: str) -> float:
    def tokenize(txt):
        words = re.findall(r'\b[a-zA-Z0-9\+\#\.]+\b', txt.lower())
        return [w for w in words if len(w) > 1]

    tokens1 = tokenize(doc1)
    tokens2 = tokenize(doc2)

    if not tokens1 or not tokens2:
        return 0.0

    all_vocab = set(tokens1 + tokens2)
    freq1 = {word: tokens1.count(word) for word in all_vocab}
    freq2 = {word: tokens2.count(word) for word in all_vocab}

    vec1 = [freq1[w] for w in all_vocab]
    vec2 = [freq2[w] for w in all_vocab]

    dot_product = sum(v1 * v2 for v1, v2 in zip(vec1, vec2))
    mag1 = math.sqrt(sum(v1 ** 2 for v1 in vec1))
    mag2 = math.sqrt(sum(v2 ** 2 for v2 in vec2))

    if mag1 == 0 or mag2 == 0:
        return 0.0

    return dot_product / (mag1 * mag2)


def screen_resume_with_local_ai(resume_text: str, filename: str, job: Dict[str, Any]) -> Dict[str, Any]:
    cand_name = extract_name_from_text(resume_text, filename)
    avatar = "".join([part[0] for part in cand_name.split()[:2]]).upper() or "CN"
    email = extract_email(resume_text)
    phone = extract_phone(resume_text)
    location = extract_location(resume_text, job.get("loc", "Chennai"))
    education = extract_education(resume_text)
    exp_years = extract_experience_years(resume_text)

    req_skills = job.get("req_skills", [])
    if isinstance(req_skills, str):
        try:
            req_skills = json.loads(req_skills)
        except Exception:
            req_skills = [s.strip() for s in req_skills.split(",") if s.strip()]

    pref_skills = job.get("pref_skills", [])
    if isinstance(pref_skills, str):
        try:
            pref_skills = json.loads(pref_skills)
        except Exception:
            pref_skills = [s.strip() for s in pref_skills.split(",") if s.strip()]

    extracted_skills = extract_skills_from_text(resume_text)

    matched_req = [s for s in req_skills if s.lower() in [es.lower() for es in extracted_skills]]
    missing_req = [s for s in req_skills if s.lower() not in [es.lower() for es in extracted_skills]]
    matched_pref = [s for s in pref_skills if s.lower() in [es.lower() for es in extracted_skills]]

    req_coverage = len(matched_req) / len(req_skills) if req_skills else 1.0
    pref_coverage = len(matched_pref) / len(pref_skills) if pref_skills else 0.5

    skills_score = int(min(100, max(30, (req_coverage * 70) + (pref_coverage * 30))))

    job_text = f"{job.get('title', '')} {job.get('desc', '')} {' '.join(req_skills)} {' '.join(pref_skills)}"
    tfidf_sim = calculate_tfidf_cosine_sim(resume_text, job_text)
    nlp_text_score = int(min(100, max(40, tfidf_sim * 150)))

    target_exp_str = job.get("exp", "2-4 years")
    target_exp = 3.0
    exp_match = re.search(r'(\d+)', target_exp_str)
    if exp_match:
        target_exp = float(exp_match.group(1))

    if exp_years >= target_exp:
        exp_score = int(min(100, 85 + (exp_years - target_exp) * 5))
    else:
        exp_score = int(max(40, 85 - (target_exp - exp_years) * 15))

    projects_score = int(min(95, max(50, (skills_score * 0.5) + (nlp_text_score * 0.5))))
    edu_score = 90 if ("B.Tech" in education or "B.E." in education or "M.Tech" in education or "M.S." in education) else 80
    req_score = int(min(100, req_coverage * 100))

    match_score = int((skills_score * 0.35) + (exp_score * 0.20) + (projects_score * 0.20) + (req_score * 0.15) + (edu_score * 0.10))

    if match_score >= 82:
        recommend = "SHORTLIST"
    elif match_score >= 68:
        recommend = "REVIEW"
    else:
        recommend = "REJECT"

    strengths = []
    if matched_req:
        strengths.append(f"Demonstrates core required skills: {', '.join(matched_req[:4])}")
    if exp_years >= target_exp:
        strengths.append(f"Meets professional experience target ({exp_years} years recorded)")
    strengths.append(f"Relevant academic background: {education}")

    gaps = []
    if missing_req:
        gaps.append(f"Lacks explicit documentation for required skills: {', '.join(missing_req[:4])}")
    if exp_years < target_exp:
        gaps.append(f"Professional experience ({exp_years} yrs) is below preferred target ({target_exp} yrs)")

    explanation = (
        f"{cand_name} scored {match_score}% overall for the {job.get('title', 'Target Role')} position. "
        f"The candidate holds {exp_years} years of experience with education in '{education}'. "
        f"Key matched skills include {', '.join(matched_req or extracted_skills[:3])}. "
        f"{'No critical required skill gaps detected.' if not missing_req else 'Gaps were noted in: ' + ', '.join(missing_req)}."
    )

    return {
        "id": f"cand-{uuid.uuid4().hex[:8]}",
        "name": cand_name,
        "avatar": avatar,
        "roleText": f"Candidate for {job.get('title', 'Target Role')}",
        "applied": "Applied Just Now",
        "match": match_score,
        "skills": skills_score,
        "experience": exp_score,
        "projects": projects_score,
        "education": edu_score,
        "requirements": req_score,
        "recommend": recommend,
        "status": "New",
        "expText": f"{exp_years} years",
        "eduText": education,
        "locText": location,
        "email": email,
        "phone": phone,
        "currentRole": f"Software Candidate ({education})",
        "strengths": json.dumps(strengths),
        "gaps": json.dumps(gaps),
        "explanation": explanation,
        "resume_filename": filename,
        "screening_status": "Done",
        "matched_skills": json.dumps(matched_req),
        "missing_skills": json.dumps(missing_req or ["Advanced Cloud Architecture"]),
    }


def screen_resume_pipeline(resume_text: str, filename: str, job: Dict[str, Any]) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.info("No Gemini API key found. Using Local TF-IDF NLP Screener Engine...")
        return screen_resume_with_local_ai(resume_text, filename, job)

    try:
        use_new_sdk = False
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            use_new_sdk = True
        except ImportError:
            import google.generativeai as genai_old
            genai_old.configure(api_key=api_key)

        req_skills = job.get("req_skills", [])
        if isinstance(req_skills, str):
            try:
                req_skills = json.loads(req_skills)
            except Exception:
                req_skills = [s.strip() for s in req_skills.split(",") if s.strip()]

        system_instruction = f"""You are Thozhil AI - an expert enterprise resume screener and technical interviewer.
Evaluate the raw resume text below strictly against the target job requirements.

TARGET JOB DETAILS:
Title: {job.get('title', 'Software Engineer')}
Department: {job.get('dept', 'Engineering')}
Required Skills: {json.dumps(req_skills)}
Preferred Skills: {json.dumps(job.get('pref_skills', []))}
Description: {job.get('desc', '')}

Return raw JSON only conforming to:
{{
  "name": "Candidate Full Name",
  "roleText": "Current or Target Title",
  "match": 85,
  "skills": 80,
  "experience": 90,
  "projects": 85,
  "education": 90,
  "requirements": 85,
  "recommend": "SHORTLIST",
  "expText": "3.5 years",
  "eduText": "B.Tech Computer Science",
  "locText": "Chennai, IN",
  "email": "candidate@example.com",
  "phone": "+91 98765 43210",
  "currentRole": "Software Developer",
  "strengths": ["Strength 1", "Strength 2"],
  "gaps": ["Gap 1"],
  "matched_skills": ["Python", "FastAPI"],
  "missing_skills": ["Docker"],
  "explanation": "Detailed evaluation text"
}}"""

        full_prompt = system_instruction + "\n\nRAW RESUME:\n" + resume_text

        if use_new_sdk:
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=full_prompt,
                config={"response_mime_type": "application/json"}
            )
            raw_text = response.text
        else:
            model = genai_old.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                full_prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            raw_text = response.text

        cleaned = re.sub(r'```(?:json)?\s*', '', raw_text, flags=re.IGNORECASE)
        cleaned = re.sub(r'```\s*$', '', cleaned, flags=re.IGNORECASE)
        start = cleaned.find('{')
        end = cleaned.rfind('}')
        if start != -1 and end != -1:
            cleaned = cleaned[start:end + 1]

        v = json.loads(cleaned)
        return {
            "id": f"cand-{uuid.uuid4().hex[:8]}",
            "name": v.get("name", "Candidate"),
            "avatar": "".join([p[0] for p in v.get("name", "CN").split()[:2]]).upper(),
            "roleText": v.get("roleText", job.get("title", "Candidate")),
            "applied": "Applied Just Now",
            "match": int(v.get("match", 75)),
            "skills": int(v.get("skills", 75)),
            "experience": int(v.get("experience", 75)),
            "projects": int(v.get("projects", 75)),
            "education": int(v.get("education", 75)),
            "requirements": int(v.get("requirements", 75)),
            "recommend": v.get("recommend", "REVIEW"),
            "status": "New",
            "expText": v.get("expText", "2.5 years"),
            "eduText": v.get("eduText", "Bachelor Degree"),
            "locText": v.get("locText", "Chennai, IN"),
            "email": v.get("email", "candidate@example.com"),
            "phone": v.get("phone", "+91 98765 43210"),
            "currentRole": v.get("currentRole", "Software Developer"),
            "strengths": json.dumps(v.get("strengths", [])),
            "gaps": json.dumps(v.get("gaps", [])),
            "explanation": v.get("explanation", "Evaluated via Gemini AI"),
            "resume_filename": filename,
            "screening_status": "Done",
            "matched_skills": json.dumps(v.get("matched_skills", [])),
            "missing_skills": json.dumps(v.get("missing_skills", [])),
        }
    except Exception as e:
        logger.error(f"Gemini AI Error: {e}. Falling back to Local NLP...")
        return screen_resume_with_local_ai(resume_text, filename, job)
