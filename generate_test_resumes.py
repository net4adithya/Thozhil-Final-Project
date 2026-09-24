import os
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

CANDIDATE_RESUMES = [
    {
        "filename": "Rahul_Kumar_Resume.pdf",
        "name": "Rahul Kumar",
        "email": "rahul.kumar.dev@example.com",
        "phone": "+91 98765 43210",
        "role": "Backend Engineer / Software Engineer",
        "location": "Chennai, IN",
        "experience": "2.8 Years",
        "education": "B.E. Computer Science, Anna University",
        "summary": "Results-oriented Backend Software Engineer with 2.8 years of hands-on experience designing, developing, and deploying high-performance microservices using Python, FastAPI, and PostgreSQL.",
        "skills": ["Python", "FastAPI", "PostgreSQL", "REST APIs", "Docker", "Git", "SQL Optimization", "Redis"],
        "projects": [
            "High-Throughput E-Commerce API - Built scalable FastAPI backend processing 5,000 requests/sec with Redis caching.",
            "Relational Database Migration - Optimized PostgreSQL queries reducing p99 latency by 45%."
        ]
    },
    {
        "filename": "Priya_Sharma_Resume.pdf",
        "name": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "phone": "+91 87654 32109",
        "role": "Software Developer / Backend Engineer",
        "location": "Bengaluru, IN",
        "experience": "3.2 Years",
        "education": "B.Tech Information Technology, VIT",
        "summary": "Versatile Software Engineer with 3.2 years of experience in Python, Flask, and relational database management. Skilled in modular backend architecture and API integration.",
        "skills": ["Python", "Flask", "SQL", "MySQL", "REST APIs", "Docker", "Git", "Microservices"],
        "projects": [
            "Enterprise Resource Portal - Engineered multi-tenant Flask backend with role-based access control.",
            "Data Pipeline Engine - Built automated ETL scripts in Python processing daily transaction logs."
        ]
    },
    {
        "filename": "Arjun_Patel_Resume.pdf",
        "name": "Arjun Patel",
        "email": "arjun.patel.dev@example.com",
        "phone": "+91 76543 21098",
        "role": "Junior Backend Developer",
        "location": "Chennai, IN",
        "experience": "2.1 Years",
        "education": "B.C.A. SRM University",
        "summary": "Enthusiastic developer with 2+ years of experience constructing Django REST API endpoints and automation scripts. Passionate about backend systems and clean code.",
        "skills": ["Python", "Django", "Django REST Framework", "SQLite", "Docker Basics", "Git"],
        "projects": [
            "AppStudio API Server - Developed authentication & user management service in Django.",
            "Task Tracker App - Built REST APIs with automated unit testing."
        ]
    },
    {
        "filename": "Karthik_Raman_Resume.pdf",
        "name": "Karthik Raman",
        "email": "karthik.raman@example.com",
        "phone": "+91 95432 10987",
        "role": "Python Scripting Associate",
        "location": "Chennai, IN",
        "experience": "2.5 Years",
        "education": "B.Sc Computer Science, Madras Christian College",
        "summary": "Detail-oriented Associate Developer skilled in Python automation, JSON data processing, and HTTP REST web services.",
        "skills": ["Python", "Scripting", "REST APIs", "JSON/XML", "Git", "Linux Shell"],
        "projects": [
            "Automated Log Parser - Created Python scripts to parse system diagnostics logs.",
            "Data Synchronizer - Implemented REST client script to sync operational records."
        ]
    },
    {
        "filename": "Ananya_Iyer_Resume.pdf",
        "name": "Ananya Iyer",
        "email": "ananya.iyer@example.com",
        "phone": "+91 94321 09876",
        "role": "System Engineer Analyst",
        "location": "Chennai, IN",
        "experience": "1.5 Years",
        "education": "B.Tech ECE, SSN College of Engineering",
        "summary": "Junior engineer with foundational Python scripting skills and strong problem-solving capabilities.",
        "skills": ["Python", "C++", "Foundational SQL", "Git", "Basic Web Tech"],
        "projects": [
            "Network Monitoring Script - Wrote basic Python network ping checkers.",
            "Database Inquiry Tool - Formulated basic SQL lookup queries for internal inventory."
        ]
    },
    {
        "filename": "Siddharth_Mehta_Resume.pdf",
        "name": "Siddharth Mehta",
        "email": "sid.mehta@example.com",
        "phone": "+91 93210 98765",
        "role": "Python API Lead / Senior Backend Engineer",
        "location": "Coimbatore, IN",
        "experience": "4.0 Years",
        "education": "B.E. Computer Science, PSG Tech",
        "summary": "Accomplished Backend Developer with 4 years of experience mastering Python, FastAPI, Docker, and Kubernetes on GCP.",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes", "GCP", "Redis", "CI/CD"],
        "projects": [
            "CoreTech Microservices Platform - Architected serverless FastAPI services deployed on GCP GKE.",
            "Database Indexing Overhaul - Optimized heavy PostgreSQL data schemas handling millions of monthly records."
        ]
    },
    {
        "filename": "Vikram_Singh_Resume.pdf",
        "name": "Vikram Singh",
        "email": "vikram.singh@example.com",
        "phone": "+91 82345 67890",
        "role": "Java Backend Engineer",
        "location": "Bengaluru, IN",
        "experience": "4.2 Years",
        "education": "B.Tech Computer Science, NIT Trichy",
        "summary": "Senior Java Developer specializing in Spring Boot, enterprise microservices, MySQL database design, and Docker containerization.",
        "skills": ["Java", "Spring Boot", "MySQL", "REST APIs", "Docker", "Git", "GCP", "Hibernate"],
        "projects": [
            "JavaForge Payment Gateway - Built secure Spring Boot REST API for transaction settlement.",
            "Database Schema Migration - Refactored complex enterprise MySQL databases."
        ]
    },
    {
        "filename": "Deepa_Pillai_Resume.pdf",
        "name": "Deepa Pillai",
        "email": "deepa.p@example.com",
        "phone": "+91 91234 56789",
        "role": "Software Engineer",
        "location": "Chennai, IN",
        "experience": "3.5 Years",
        "education": "B.Tech IT, Anna University",
        "summary": "Solid Java software engineer with extensive experience in object-oriented development, Hibernate ORM, and SQL query creation.",
        "skills": ["Java", "Hibernate", "SQL", "REST APIs", "Docker", "Git"],
        "projects": [
            "WebCreations Inventory Core - Implemented Java enterprise web modules.",
            "API Service Layer - Built structured JSON REST endpoints for mobile app clients."
        ]
    },
    {
        "filename": "Rohan_Das_Resume.pdf",
        "name": "Rohan Das",
        "email": "rohan.das@example.com",
        "phone": "+91 74321 09876",
        "role": "React UI Architect / Frontend Developer",
        "location": "Chennai, IN",
        "experience": "3.8 Years",
        "education": "B.E. Computer Science, SRM",
        "summary": "Creative Frontend Engineer with nearly 4 years of expertise crafting responsive, beautiful single page web applications using React, TailwindCSS, TypeScript, and modern JavaScript.",
        "skills": ["React", "JavaScript", "HTML5", "CSS3", "TailwindCSS", "TypeScript", "Redux", "Git"],
        "projects": [
            "Frontend Labs Design System - Created modular React component library with TailwindCSS.",
            "Analytics Dashboard Application - Built interactive real-time data viz dashboard using React."
        ]
    }
]

def build_pdf(filepath, data):
    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
    )
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0059BB')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#414754')
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#191C1D')
    )
    
    heading_style = ParagraphStyle(
        'DocHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#007BFF'),
        spaceBefore=10,
        spaceAfter=4
    )
    
    story = []
    
    # Header
    story.append(Paragraph(data['name'], title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph(f"{data['role']} • {data['location']}", subtitle_style))
    story.append(Paragraph(f"Email: {data['email']} | Phone: {data['phone']}", body_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E9ECEF'), spaceAfter=10))
    
    # Professional Summary
    story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
    story.append(Paragraph(data['summary'], body_style))
    story.append(Spacer(1, 8))
    
    # Education & Experience
    story.append(Paragraph("EXPERIENCE & EDUCATION", heading_style))
    story.append(Paragraph(f"<b>Experience:</b> {data['experience']}", body_style))
    story.append(Paragraph(f"<b>Education:</b> {data['education']}", body_style))
    story.append(Spacer(1, 8))
    
    # Technical Skills
    story.append(Paragraph("KEY TECHNICAL SKILLS", heading_style))
    story.append(Paragraph(", ".join(data['skills']), body_style))
    story.append(Spacer(1, 8))
    
    # Projects
    story.append(Paragraph("FEATURED PROJECTS", heading_style))
    for proj in data['projects']:
        story.append(Paragraph(f"• {proj}", body_style))
        story.append(Spacer(1, 4))
        
    doc.build(story)
    print(f"Generated sample resume: {filepath}")

def generate_all_test_resumes():
    for cand in CANDIDATE_RESUMES:
        filepath = os.path.join(UPLOAD_DIR, cand['filename'])
        build_pdf(filepath, cand)
        
        # Also copy to test_resumes directory if present
        test_dir = "test_resumes"
        os.makedirs(test_dir, exist_ok=True)
        test_filepath = os.path.join(test_dir, cand['filename'])
        build_pdf(test_filepath, cand)

if __name__ == "__main__":
    generate_all_test_resumes()
