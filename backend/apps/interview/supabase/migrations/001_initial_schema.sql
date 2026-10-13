-- 001_initial_schema.sql
-- Supabase PostgreSQL Initial Database Schema for InterviewX AI

-- Drop existing tables to ensure a clean state if migrating from scratch
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper trigger function to automate updated_at changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';


-- 1. JOBS TABLE
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    department TEXT NOT NULL,
    experience_level TEXT,
    required_skills JSONB DEFAULT '[]'::jsonb,
    preferred_skills JSONB DEFAULT '[]'::jsonb,
    location TEXT,
    employment_type TEXT,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_jobs_modtime
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 2. CANDIDATES TABLE
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT,
    interview_id UUID, -- Backwards compatibility for references in candidate profiles
    status TEXT DEFAULT 'Invited',
    overall_score NUMERIC DEFAULT NULL,
    completion_date TIMESTAMPTZ DEFAULT NULL,
    avatar_initials TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    experience JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    recommendation TEXT,
    summary TEXT,
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidates_email ON candidates(email);

CREATE TRIGGER update_candidates_modtime
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 3. INTERVIEWS TABLE
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    job_role TEXT,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    company TEXT,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('async', 'live')),
    status TEXT DEFAULT 'Draft',
    duration INTEGER DEFAULT 30,
    settings JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX idx_interviews_job_id ON interviews(job_id);
CREATE INDEX idx_interviews_type ON interviews(type);
CREATE INDEX idx_interviews_status ON interviews(status);

CREATE TRIGGER update_interviews_modtime
    BEFORE UPDATE ON interviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint to candidates for interview_id after interviews table is created
ALTER TABLE candidates 
    ADD CONSTRAINT fk_candidate_interview 
    FOREIGN KEY (interview_id) 
    REFERENCES interviews(id) 
    ON DELETE SET NULL;


-- 4. QUESTIONS TABLE
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    category TEXT NOT NULL,
    duration INTEGER DEFAULT 180,
    difficulty TEXT DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    boilerplate TEXT DEFAULT '',
    test_cases JSONB DEFAULT '[]'::jsonb,
    question_order INTEGER NOT NULL DEFAULT 0,
    expected_topics JSONB DEFAULT '[]'::jsonb,
    question_type TEXT DEFAULT 'text',
    time_limit INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_interview_id ON questions(interview_id);
CREATE INDEX idx_questions_interview_order ON questions(interview_id, question_order);


-- 5. ANSWERS TABLE
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    question_id_str TEXT, -- For tracking custom front-end questions IDs like 'q-1'
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    answer_text TEXT,
    transcript TEXT,
    recording_url TEXT,
    duration INTEGER,
    submitted_at TIMESTAMPTZ,
    evaluation_status TEXT DEFAULT 'pending',
    score NUMERIC,
    feedback TEXT,
    code TEXT DEFAULT '',
    language TEXT DEFAULT '',
    test_cases_result JSONB DEFAULT '[]'::jsonb,
    compile_time NUMERIC,
    status TEXT DEFAULT '',
    time_taken INTEGER DEFAULT 0,
    comments TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_answers_interview_id ON answers(interview_id);
CREATE INDEX idx_answers_candidate_id ON answers(candidate_id);


-- 6. RESUMES TABLE
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
    original_file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    parsed_text TEXT,
    parsing_status TEXT DEFAULT 'Pending',
    screening_status TEXT DEFAULT 'Pending',
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resumes_candidate_id ON resumes(candidate_id);


-- 7. REPORTS TABLE
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL UNIQUE REFERENCES interviews(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    overall_score NUMERIC,
    technical_score NUMERIC,
    communication_score NUMERIC,
    problem_solving_score NUMERIC,
    confidence_score NUMERIC,
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    recommendation TEXT,
    summary TEXT DEFAULT '',
    question_analysis JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_interview_id ON reports(interview_id);
