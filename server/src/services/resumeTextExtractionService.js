import { createRequire } from 'module';
import path from 'path';
import ApiError from '../utils/ApiError.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Normalizes extracted document text by removing excessive blank lines and trimming line padding
 * @param {string} text - Raw extracted text
 * @returns {string} Clean, normalized text
 */
export const normalizeExtractedText = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    // Normalize CRLF to LF
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Replace tabs with 2 spaces
    .replace(/\t/g, '  ')
    // Remove invisible control characters (except newlines)
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Trim individual lines
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    // Collapse 3+ consecutive newlines to 2 newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Extracts and normalizes readable text from a resume document buffer (PDF, DOCX, TXT)
 * @param {Buffer} buffer - Binary file buffer
 * @param {string} fileType - MIME type
 * @param {string} originalName - Original filename with extension
 * @returns {Promise<{text: string, characterCount: number, wordCount: number, format: string, requiresOcr: boolean}>}
 */
export const extractTextFromBuffer = async (buffer, fileType = '', originalName = '') => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new ApiError(400, 'Invalid file buffer provided for text extraction');
  }

  const ext = path.extname(originalName || '').toLowerCase();
  const isPdf = ext === '.pdf' || fileType?.includes('pdf');
  const isDocx = ext === '.docx' || fileType?.includes('wordprocessingml');
  const isDoc = ext === '.doc' || fileType?.includes('msword');
  const isTxt = ext === '.txt' || fileType?.includes('text/plain');

  let rawText = '';
  let format = 'unknown';

  if (isPdf) {
    format = 'PDF';
    try {
      const pdfData = await pdfParse(buffer);
      rawText = pdfData?.text || '';
    } catch (err) {
      // Fallback for PDFs with non-standard syntax, unescaped parens, or bad xref tables
      try {
        const rawStr = buffer.toString('binary');
        // Extract text in BT ... ET blocks with Tj/TJ operator
        const tjMatches = [...rawStr.matchAll(/\(([^)]+)\)\s*T[jJ]/g)].map(m => m[1].replace(/\\([\\()])/g, '$1'));
        if (tjMatches.length > 0) {
          rawText = tjMatches.join(' ');
        } else {
          // General printable ASCII chunks from streams
          const textStreams = rawStr.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g) || [];
          const extractedWords = [];
          textStreams.forEach(stream => {
            const matches = stream.match(/[A-Za-z0-9,.:;@/\-\(\)\s]{4,}/g) || [];
            extractedWords.push(...matches);
          });
          if (extractedWords.length > 0) {
            rawText = extractedWords.join(' ');
          } else {
            throw err;
          }
        }
      } catch (fallbackErr) {
        throw new ApiError(400, `Corrupt or invalid PDF document: ${err.message}`);
      }
    }
  } else if (isDocx) {
    format = 'DOCX';
    try {
      const docxResult = await mammoth.extractRawText({ buffer });
      rawText = docxResult?.value || '';
    } catch (err) {
      throw new ApiError(400, `Corrupt or invalid DOCX document: ${err.message}`);
    }
  } else if (isDoc) {
    format = 'DOC';
    try {
      const docResult = await mammoth.extractRawText({ buffer });
      rawText = docResult?.value || '';
    } catch (err) {
      // Fallback for legacy binary .doc
      rawText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');
    }
  } else if (isTxt) {
    format = 'TXT';
    rawText = buffer.toString('utf-8');
  } else {
    throw new ApiError(400, `Unsupported resume format: ${ext || fileType}. Only PDF, DOCX, and TXT are supported.`);
  }

  const normalized = normalizeExtractedText(rawText);

  // Empty or image-only scanned document detection
  if (!normalized || normalized.length < 20) {
    return {
      text: normalized,
      characterCount: normalized.length,
      wordCount: 0,
      format,
      requiresOcr: true,
      status: 'Failed',
      message: 'OCR REQUIRED FOR IMAGE-BASED RESUMES: Document contains no machine-readable text streams.'
    };
  }

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  return {
    text: normalized,
    characterCount: normalized.length,
    wordCount,
    format,
    requiresOcr: false,
    status: 'Completed',
    message: 'Text extraction completed successfully.'
  };
};

export default {
  extractTextFromBuffer,
  normalizeExtractedText
};
