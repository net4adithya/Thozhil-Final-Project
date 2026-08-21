import multer from 'multer';
import path from 'path';
import ApiError from '../utils/ApiError.js';

// Storage setup configuration: store in memory to pipe directly to Supabase Storage
const storage = multer.memoryStorage();

// File type checker boundary filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB maximum file capacity
  }
});
