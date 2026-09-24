import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/env.js';
import supabase, { isUsingLocalFallback } from './config/supabase.js';
import ApiError from './utils/ApiError.js';
import notFoundMiddleware from './middleware/notFoundMiddleware.js';
import { errorConverter, errorHandler } from './middleware/errorMiddleware.js';

import { authenticate } from './middleware/authMiddleware.js';

// Route imports
import candidateRoutes from './routes/candidateRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';

const app = express();

// Set security HTTP headers with cross-origin resource policy for media playback
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Dev request logging
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Activity heartbeat route (handles browser extensions or local IDE activity pings cleanly)
app.all('/api/activity', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Activity heartbeat acknowledged'
  });
});

// Enable CORS with ALLOWED_ORIGINS enforcement
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin header)
    if (!origin) return callback(null, true);
    
    // In development or local environments, allow any localhost or 127.0.0.1 origin
    if (config.env === 'development' || !config.env || config.env === 'test') {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (origin.startsWith('chrome-extension://') || origin.startsWith('vscode-webview://')) {
        return callback(null, true);
      }
    }

    if (config.allowedOrigins && config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new ApiError(403, `CORS policy violation: Origin '${origin}' is not allowed`));
  },
  credentials: true
}));

// Rate Limiting (environment-aware: 10,000 for development/test, 200 for production, or custom RATE_LIMIT_MAX)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', limiter);
app.use('/api', authenticate);

// Serve uploads folder statically for access to resume documents
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', async (req, res, next) => {
  try {
    const { error } = await supabase.from('jobs').select('id').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    res.status(200).json({
      success: true,
      message: 'InterviewX AI API is running',
      database: isUsingLocalFallback() ? 'local_resilient' : 'supabase'
    });
  } catch (err) {
    next(err);
  }
});

// Bind route controllers
app.use('/api/candidates', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/voice', voiceRoutes);

// Send 404 back for any unknown api request
app.use(notFoundMiddleware);

// Convert error to ApiError if needed
app.use(errorConverter);

// Handle error response formats
app.use(errorHandler);

export default app;
