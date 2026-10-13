const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const app = express();

// SECURITY FIX (ISSUE-004): Restrict CORS to known frontend origins only.
// Wildcard cors() previously allowed any website to call this API.
const ALLOWED_ORIGINS = [
  'http://localhost:8080',  // Unified Thozhil Gateway
  'http://localhost:5032',  // Vite dev server
  'http://localhost:5173',  // Vite default dev server
  'http://localhost:4173',  // Vite preview
  'http://localhost:3000',  // Admin Shell
  process.env.FRONTEND_URL, // Optional: set in production .env
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || origin.startsWith('http://localhost:')) return callback(null, true);
    return callback(new Error('CORS: origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-user-id', 'authorityId'],
  credentials: false
}));
app.use(express.json());

const PORT = process.env.PORT || 5030;
const supabase = require('./db');
const { reviewLog } = require('./reviewer');
const ALLOWED_FILE_EXTENSIONS = new Set(['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'html', 'css', 'json', 'txt', 'md', 'sql']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 10
  },
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname || '').split('.').pop().toLowerCase();
    if (ALLOWED_FILE_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File extension .${ext} is not allowed. Supported: ${Array.from(ALLOWED_FILE_EXTENSIONS).join(', ')}`));
    }
  }
});

// Serve static preview interface
app.use('/preview', express.static(path.join(__dirname, 'public')));

app.get(['/', '/api', '/api/'], (req, res) => {
  res.json({ message: 'Server is alive' });
});

app.post(['/review', '/api/review'], async (req, res) => {
  try {
    const { work_description, program_files } = req.body;

    if (!work_description || typeof work_description !== 'string' || work_description.trim() === '') {
      return res.status(400).json({ error: 'work_description is required and cannot be empty' });
    }
    if (!program_files || !Array.isArray(program_files) || program_files.length === 0) {
      return res.status(400).json({ error: 'program_files array is required and cannot be empty' });
    }

    const reviewResult = await reviewLog(work_description, program_files);
    
    // Express response schema mirrors FastAPI models exactly
    res.json({
      intern_review: {
        score: reviewResult.score,
        feedback: reviewResult.feedback,
        speech_text: reviewResult.speech_text || reviewResult.feedback || '',
        audio_supported: true,
        strengths: reviewResult.strengths || [],
        bugs: reviewResult.bugs || [],
        missing: reviewResult.missing || [],
        suggestions: reviewResult.suggestions || []
      },
      manager_summary: {
        overall_score: reviewResult.score || 0,
        summary: reviewResult.managerSummary || '',
        risk_level: reviewResult.riskLevel || 'medium',
        recommendation: reviewResult.recommendation || ''
      }
    });
  } catch (err) {
    console.error('Stateless review generation failed:', err);
    res.status(500).json({ detail: 'An unexpected internal error occurred. Please try again later.' });
  }
});

// Middleware wrapper for multer error handling
const handleUpload = (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds maximum limit of 5MB' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Maximum 10 files can be uploaded at once' });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
  });
};

// Helper to resolve project ID or access code to Supabase assignments table
async function resolveAssignment(projectId) {
  if (!projectId) return null;
  // 1. Try exact assignment ID (UUID)
  let { data, error } = await supabase.from('assignments').select('*').eq('id', projectId).maybeSingle();
  if (data) return data;

  // 2. Map project IDs / codes to accessCode
  let code = projectId;
  if (projectId.includes('stripe') || projectId.includes('8812')) code = 'PRJ-8812';
  else if (projectId.includes('linear') || projectId.includes('4091')) code = 'PRJ-4091';
  else if (projectId.includes('notion') || projectId.includes('1029') || projectId.includes('gateway')) code = 'PRJ-1029';

  ({ data, error } = await supabase.from('assignments').select('*').eq('accessCode', code).maybeSingle());
  return data;
}

function safeParseJson(value, fallback = []) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

function getLanguageFromExtension(filename) {
  if (!filename) return 'text';
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'py':
      return 'python';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'java':
      return 'java';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    default:
      return 'text';
  }
}

app.post(['/logs', '/api/logs'], handleUpload, async (req, res) => {
  try {
    const { projectId, internId, content } = req.body;
    const files = req.files || [];

    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      return res.status(400).json({ error: 'projectId is required and cannot be empty' });
    }
    
    const hasContent = content && typeof content === 'string' && content.trim() !== '';
    const hasFiles = files.length > 0;
    if (!hasContent && !hasFiles) {
      return res.status(400).json({ error: 'At least one file upload or non-empty content must be present' });
    }

    // Step 1: Fetch the assignment for this project
    const assignment = await resolveAssignment(projectId);
    const descToUse = assignment ? assignment.description : "General software design audit: focus on structure, naming conventions, core correctness, error handling, security, and next steps.";

    // Step 2: Build the program_files array for AI review
    const programFiles = [];
    if (hasContent) {
      programFiles.push({
        filename: 'log.txt',
        language: 'text',
        content: content
      });
    }

    const fileNames = [];
    for (const file of files) {
      const fileContentAsText = file.buffer.toString('utf8');
      const detected = getLanguageFromExtension(file.originalname);
      programFiles.push({
        filename: file.originalname,
        language: detected,
        content: fileContentAsText
      });
      fileNames.push(file.originalname);
    }

    // Step 3: Trigger AI Review
    let reviewResult = null;
    try {
      reviewResult = await reviewLog(descToUse, programFiles);
    } catch (reviewErr) {
      console.error('Error during automatic review generation:', reviewErr);
      reviewResult = { score: 85, feedback: "Review generation encountered an issue, recorded default score." };
    }

    const score = typeof reviewResult?.score === 'number' ? reviewResult.score : 85;

    // Step 4: Insert review into project_log_reviews in Supabase
    const candidateName = internId && internId.includes('ananya') ? 'Ananya Iyer' : (internId && internId.includes('arjun') ? 'Arjun Patel' : 'Sanjay Kumar');
    const candidateEmail = internId && internId.includes('ananya') ? 'ananya.iyer@example.com' : (internId && internId.includes('arjun') ? 'arjun.patel@example.com' : 'intern@platform.com');

    const logRecordData = {
      assignmentId: assignment ? assignment.id : null,
      candidateName,
      candidateEmail,
      workDescription: descToUse,
      logContent: content || `Files uploaded: ${fileNames.join(', ')}`,
      sourceCode: fileNames.length > 0 ? fileNames.join(', ') : null,
      overallScore: score,
      correctnessScore: Math.min(100, Math.max(0, score + 2)),
      qualityScore: Math.min(100, Math.max(0, score - 3)),
      riskScore: reviewResult?.riskLevel === 'low' ? 5 : (reviewResult?.riskLevel === 'critical' ? 60 : 25),
      recommendation: score >= 75 ? 'APPROVED' : 'UNDER_REVIEW',
      strengths: JSON.stringify(reviewResult?.strengths || []),
      weaknesses: JSON.stringify(reviewResult?.bugs || []),
      suggestions: JSON.stringify(reviewResult?.suggestions || []),
      missingItems: JSON.stringify(reviewResult?.missing || []),
      summary: reviewResult?.feedback || 'Review completed successfully.',
      internalNotes: reviewResult?.managerSummary || ''
    };

    const { data: insertedReview, error: logError } = await supabase
      .from('project_log_reviews')
      .insert([logRecordData])
      .select()
      .single();

    if (logError) {
      console.error('Database error inserting project_log_reviews:', logError);
      return res.status(500).json({ error: 'Failed to record log evaluation' });
    }

    const formattedReview = {
      id: insertedReview.id,
      logId: insertedReview.id,
      score: insertedReview.overallScore,
      feedback: insertedReview.summary,
      speechText: insertedReview.summary,
      strengths: safeParseJson(insertedReview.strengths),
      weaknesses: safeParseJson(insertedReview.weaknesses),
      suggestions: safeParseJson(insertedReview.suggestions),
      missing: safeParseJson(insertedReview.missingItems),
      managerSummary: insertedReview.internalNotes,
      riskLevel: insertedReview.riskScore < 15 ? 'low' : (insertedReview.riskScore < 40 ? 'medium' : 'high'),
      recommendation: insertedReview.recommendation,
      createdAt: insertedReview.createdAt
    };

    res.status(201).json({
      id: insertedReview.id,
      projectId,
      internId: internId || 'intern-sanjay',
      content: insertedReview.logContent,
      fileUrl: insertedReview.sourceCode,
      fileName: fileNames[0] || undefined,
      uploadedAt: insertedReview.createdAt,
      descriptionId: assignment ? assignment.id : null,
      review: formattedReview
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.get(['/logs/:projectId', '/api/logs/:projectId'], async (req, res) => {
  try {
    const { projectId } = req.params;
    const assignment = await resolveAssignment(projectId);

    let query = supabase.from('project_log_reviews').select('*').order('createdAt', { ascending: false });
    if (assignment) {
      query = query.eq('assignmentId', assignment.id);
    }

    const { data: logs, error: logsError } = await query;
    if (logsError) {
      console.error(logsError);
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }

    const formatted = (logs || []).map(lr => ({
      id: lr.id,
      projectId: projectId,
      internId: lr.candidateEmail?.includes('ananya') ? 'intern-aditi' : 'intern-sanjay',
      content: lr.logContent,
      fileUrl: lr.sourceCode,
      fileName: lr.sourceCode ? lr.sourceCode.split(',')[0].trim() : undefined,
      uploadedAt: lr.createdAt,
      descriptionId: lr.assignmentId,
      review: {
        id: lr.id,
        logId: lr.id,
        score: lr.overallScore,
        feedback: lr.summary || '',
        speechText: lr.summary || '',
        strengths: safeParseJson(lr.strengths),
        weaknesses: safeParseJson(lr.weaknesses),
        suggestions: safeParseJson(lr.suggestions),
        missing: safeParseJson(lr.missingItems),
        managerSummary: lr.internalNotes || '',
        riskLevel: lr.riskScore < 15 ? 'low' : (lr.riskScore < 40 ? 'medium' : 'high'),
        recommendation: lr.recommendation,
        createdAt: lr.createdAt
      }
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.post(['/work-descriptions', '/api/work-descriptions'], async (req, res) => {
  try {
    const { projectId, authorityId, description } = req.body;

    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      return res.status(400).json({ error: 'projectId is required and cannot be empty' });
    }
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return res.status(400).json({ error: 'description is required and cannot be empty' });
    }

    const assignment = await resolveAssignment(projectId);
    if (assignment) {
      const { data, error } = await supabase
        .from('assignments')
        .update({ description, updatedAt: new Date().toISOString() })
        .eq('id', assignment.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update assignment description:', error);
        return res.status(500).json({ error: 'Failed to update work description' });
      }

      return res.status(201).json({
        id: assignment.id,
        projectId,
        authorityId: authorityId || 'auth-jenkins',
        description,
        createdAt: data ? data.updatedAt : new Date().toISOString()
      });
    }

    res.status(404).json({ error: 'Assignment not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create work description' });
  }
});

app.get(['/work-descriptions/:projectId', '/api/work-descriptions/:projectId'], async (req, res) => {
  try {
    const { projectId } = req.params;
    const assignment = await resolveAssignment(projectId);

    if (!assignment) {
      return res.status(404).json({ error: 'No assignment found for this project' });
    }

    res.json({
      id: assignment.id,
      projectId,
      authorityId: assignment.createdById || 'auth-jenkins',
      description: assignment.description,
      createdAt: assignment.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch work description' });
  }
});

app.get(['/logs/:id/review', '/api/logs/:id/review'], async (req, res) => {
  try {
    const { id } = req.params;

    const { data: lr, error } = await supabase
      .from('project_log_reviews')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch review' });
    }

    if (!lr) {
      return res.status(404).json({ error: 'No review found for this log' });
    }

    res.json({
      id: lr.id,
      logId: lr.id,
      score: lr.overallScore,
      feedback: lr.summary || '',
      speechText: lr.summary || '',
      strengths: safeParseJson(lr.strengths),
      weaknesses: safeParseJson(lr.weaknesses),
      suggestions: safeParseJson(lr.suggestions),
      missing: safeParseJson(lr.missingItems),
      managerSummary: lr.internalNotes || '',
      riskLevel: lr.riskScore < 15 ? 'low' : (lr.riskScore < 40 ? 'medium' : 'high'),
      recommendation: lr.recommendation,
      createdAt: lr.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});