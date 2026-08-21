import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/env.js';
import supabase from './config/supabase.js';
import notFoundMiddleware from './middleware/notFoundMiddleware.js';
import { errorConverter, errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import candidateRoutes from './routes/candidateRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Dev request logging
if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: config.clientUrl || '*',
  credentials: true
}));

// Basic Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', limiter);

// Serve uploads folder statically for access to resume documents
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', async (req, res, next) => {
  try {
    // Check communication with Supabase by doing a lightweight query
    const { error } = await supabase.from('jobs').select('id').limit(1);
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    res.status(200).json({
      success: true,
      message: 'InterviewX AI API is running',
      database: 'supabase'
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
