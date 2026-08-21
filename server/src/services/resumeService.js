import fs from 'fs';
import path from 'path';
import supabase from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import { getCandidateById } from './candidateService.js';
import { extractTextFromBuffer } from './resumeTextExtractionService.js';

const mapDbToResume = (dbRes) => {
  if (!dbRes) return null;
  return {
    id: dbRes.id,
    candidate: dbRes.candidate_id,
    candidateId: dbRes.candidate_id,
    originalFileName: dbRes.original_file_name,
    originalName: dbRes.original_file_name,
    fileUrl: dbRes.storage_path,
    storagePath: dbRes.storage_path,
    fileType: dbRes.file_type,
    mimeType: dbRes.file_type,
    fileSize: dbRes.file_size,
    size: dbRes.file_size,
    parsedText: dbRes.parsed_text || '',
    parsingStatus: dbRes.parsing_status || 'Pending',
    screeningStatus: dbRes.screening_status || 'Pending',
    uploadedAt: dbRes.uploaded_at,
    uploadDate: dbRes.uploaded_at
  };
};

/**
 * Extracts storage relative key from a storage_path URL
 * e.g. "https://xyz.supabase.co/storage/v1/object/public/resumes/candId/123-file.pdf" -> "candId/123-file.pdf"
 */
const extractStorageKey = (storagePath) => {
  if (!storagePath) return '';
  if (storagePath.includes('/resumes/')) {
    return storagePath.split('/resumes/').pop();
  }
  return storagePath.replace(/^\/+/, '');
};

export const createResume = async (candidateId, fileData) => {
  // Verify candidate exists
  await getCandidateById(candidateId);

  // Generate unique file path on Supabase Storage resumes bucket
  const cleanOriginalName = fileData.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePathKey = `${candidateId}/${Date.now()}-${cleanOriginalName}`;

  let publicUrl = '';

  try {
    // Attempt uploading to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(storagePathKey, fileData.buffer, {
        contentType: fileData.mimetype,
        upsert: true
      });

    if (uploadError) {
      if (uploadError.message?.toLowerCase().includes('bucket not found') || uploadError.error === 'Bucket not found') {
        const { error: createBucketError } = await supabase.storage.createBucket('resumes', { public: true });
        if (!createBucketError) {
          const { error: retryUploadError } = await supabase.storage
            .from('resumes')
            .upload(storagePathKey, fileData.buffer, {
              contentType: fileData.mimetype,
              upsert: true
            });
          if (retryUploadError) throw retryUploadError;
        } else {
          throw uploadError;
        }
      } else {
        throw uploadError;
      }
    }

    const { data: publicUrlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(storagePathKey);

    publicUrl = publicUrlData?.publicUrl || storagePathKey;
  } catch (storageErr) {
    // Fallback to local uploads directory
    try {
      const uploadsDir = path.resolve('uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const localFileName = `${Date.now()}-${cleanOriginalName}`;
      const localFilePath = path.join(uploadsDir, localFileName);
      fs.writeFileSync(localFilePath, fileData.buffer);
      publicUrl = `/uploads/${localFileName}`;
    } catch (fsErr) {
      throw new ApiError(500, `Storage Upload Failed: ${storageErr.message}`);
    }
  }

  // Safe debug log: Step 10
  console.log('[Resume DB Insert]');
  console.log(`candidateId: ${candidateId}`);
  console.log(`filename: ${fileData.originalname}`);
  console.log(`storagePath: ${storagePathKey}`);

  // Extract text immediately from upload buffer
  let extractedResult = { text: '', status: 'Pending' };
  try {
    extractedResult = await extractTextFromBuffer(fileData.buffer, fileData.mimetype, fileData.originalname);
  } catch (extractErr) {
    console.warn('Initial text extraction warning:', extractErr.message);
    extractedResult = { text: '', status: 'Failed' };
  }

  // Insert or update metadata into resumes table
  const { data: existingResume, error: selectError } = await supabase
    .from('resumes')
    .select('id, storage_path')
    .eq('candidate_id', candidateId)
    .maybeSingle();

  if (selectError) {
    // Attempt Storage file cleanup on failure
    await supabase.storage.from('resumes').remove([storagePathKey]).catch(() => {});
    console.error('[Resume DB Insert Result]');
    console.error('success: false');
    console.error(`errorCode: ${selectError.code || 500}`);
    console.error(`errorMessage: ${selectError.message}`);
    throw new ApiError(500, `Database query failed: ${selectError.message}`);
  }

  let result;
  if (existingResume) {
    const oldPath = extractStorageKey(existingResume.storage_path);
    if (oldPath) {
      await supabase.storage.from('resumes').remove([oldPath]).catch(() => {});
    }

    const { data: updated, error: updateError } = await supabase
      .from('resumes')
      .update({
        original_file_name: fileData.originalname,
        storage_path: publicUrl,
        file_type: fileData.mimetype || 'application/pdf',
        file_size: fileData.size || fileData.buffer?.length || 0,
        parsed_text: extractedResult.text || '',
        parsing_status: extractedResult.status || 'Completed',
        screening_status: 'Pending',
        uploaded_at: new Date().toISOString()
      })
      .eq('id', existingResume.id)
      .select()
      .single();

    if (updateError || !updated) {
      // Safe cleanup
      await supabase.storage.from('resumes').remove([storagePathKey]).catch(() => {});
      console.error('[Resume DB Insert Result]');
      console.error('success: false');
      console.error(`errorCode: ${updateError?.code || 500}`);
      console.error(`errorMessage: ${updateError?.message || 'Update returned no record'}`);
      throw new ApiError(500, `Database update failed: ${updateError?.message || 'Update returned no record'}`);
    }

    result = updated;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('resumes')
      .insert({
        candidate_id: candidateId,
        original_file_name: fileData.originalname,
        storage_path: publicUrl,
        file_type: fileData.mimetype || 'application/pdf',
        file_size: fileData.size || fileData.buffer?.length || 0,
        parsed_text: extractedResult.text || '',
        parsing_status: extractedResult.status || 'Completed',
        screening_status: 'Pending'
      })
      .select()
      .single();

    if (insertError || !inserted) {
      // Safe cleanup: delete orphaned uploaded file
      await supabase.storage.from('resumes').remove([storagePathKey]).catch(() => {});
      console.error('[Resume DB Insert Result]');
      console.error('success: false');
      console.error(`errorCode: ${insertError?.code || 500}`);
      console.error(`errorMessage: ${insertError?.message || 'Insert returned no record'}`);
      throw new ApiError(500, `Database insert failed: ${insertError?.message || 'Insert returned no record'}`);
    }

    result = inserted;
  }

  // Safe debug log success
  console.log('[Resume DB Insert Result]');
  console.log('success: true');

  return mapDbToResume(result);
};

export const getResumeById = async (id) => {
  const { data, error } = await supabase
    .from('resumes')
    .select('*, candidates(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new ApiError(404, 'Resume not found');
  }

  const resume = mapDbToResume(data);
  if (data.candidates) {
    resume.candidate = {
      id: data.candidates.id,
      name: data.candidates.name,
      email: data.candidates.email
    };
  }
  return resume;
};

/**
 * Downloads resume file from Supabase Storage and processes text extraction
 * @param {string} resumeId - Resume UUID
 * @returns {Promise<Object>} Processed resume record with parsed text and extraction metadata
 */
export const processResume = async (resumeId) => {
  const resume = await getResumeById(resumeId);

  // Mark as Processing
  await supabase
    .from('resumes')
    .update({ parsing_status: 'Processing' })
    .eq('id', resumeId);

  let fileBuffer = null;

  // 1. Try downloading from Supabase Storage
  const storageKey = extractStorageKey(resume.storagePath || resume.fileUrl);
  if (storageKey) {
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(storageKey);

    if (!downloadError && fileBlob) {
      const arrayBuffer = await fileBlob.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }
  }

  // 2. Fallback to local uploads directory if not found in storage
  if (!fileBuffer && (resume.storagePath?.startsWith('/uploads/') || resume.fileUrl?.startsWith('/uploads/'))) {
    const localPath = path.resolve(resume.storagePath.replace(/^\//, ''));
    if (fs.existsSync(localPath)) {
      fileBuffer = fs.readFileSync(localPath);
    }
  }

  if (!fileBuffer) {
    await supabase
      .from('resumes')
      .update({ parsing_status: 'Failed' })
      .eq('id', resumeId);
    throw new ApiError(404, 'Resume file binary could not be retrieved from storage');
  }

  // 3. Extract and normalize text
  const extracted = await extractTextFromBuffer(
    fileBuffer,
    resume.fileType,
    resume.originalFileName
  );

  // 4. Persist extraction outcome into Supabase
  const { data: updatedRecord, error: updateError } = await supabase
    .from('resumes')
    .update({
      parsed_text: extracted.text,
      parsing_status: extracted.status,
      uploaded_at: new Date().toISOString()
    })
    .eq('id', resumeId)
    .select('*, candidates(*)')
    .single();

  if (updateError) throw updateError;

  const processedResume = mapDbToResume(updatedRecord);
  processedResume.extraction = {
    characterCount: extracted.characterCount,
    wordCount: extracted.wordCount,
    format: extracted.format,
    requiresOcr: extracted.requiresOcr,
    message: extracted.message
  };

  return processedResume;
};

export default {
  createResume,
  getResumeById,
  processResume
};
