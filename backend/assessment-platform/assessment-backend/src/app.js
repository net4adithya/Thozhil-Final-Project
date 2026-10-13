const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const examRoutes = require('./routes/examRoutes');
const candidateExamRoutes = require('./routes/candidateExamRoutes');
const recordingRoutes = require('./routes/recordingRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use(
  '/uploads/media',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, 'uploads', 'media'))
);

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exam', candidateExamRoutes);
app.use('/api', recordingRoutes);

// Local compiler service (Piston-compatible API using host Node/Python)
const compilerRoutes = require('./routes/compilerRoutes');
app.use('/api/compiler', compilerRoutes);

// Question banks — list banks and questions for admin exam editor
const questionBankRoutes = require('./routes/questionBankRoutes');
app.use('/api/question-banks', questionBankRoutes);

// Intern auth — lookup exam by 6-char access code, auto-provision candidate attempt
const internAuthRoutes = require('./routes/internAuthRoutes');
app.use('/api/intern', internAuthRoutes);

// Resume screener routes — upload, screen, view candidate evaluations
const resumeRoutes = require('./routes/resumeRoutes');
app.use('/api/resumes', resumeRoutes);

// Video & Voice Interview routes — session init, turn-taking transcript evaluation, playback
const interviewRoutes = require('./routes/interviewRoutes');
app.use('/api/interviews', interviewRoutes);

// Project Analysis LogLense routes — work log submissions, multi-LLM review cards, risk notes
const projectLogRoutes = require('./routes/projectLogRoutes');
app.use('/api/project-logs', projectLogRoutes);

// Unified Admin Dashboard and Multi-Stage Reports routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use(errorHandler);

module.exports = app;
