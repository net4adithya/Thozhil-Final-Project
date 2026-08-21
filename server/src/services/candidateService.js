import supabase from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';

const mapDbToCandidate = (dbCand) => {
  if (!dbCand) return null;
  return {
    id: dbCand.id,
    name: dbCand.name,
    email: dbCand.email,
    phone: dbCand.phone,
    role: dbCand.role,
    interviewId: dbCand.interview_id,
    status: dbCand.status,
    overallScore: dbCand.overall_score !== null ? Number(dbCand.overall_score) : null,
    completionDate: dbCand.completion_date,
    avatarInitials: dbCand.avatar_initials,
    skills: dbCand.skills || [],
    education: dbCand.education || [],
    experience: dbCand.experience || [],
    projects: dbCand.projects || [],
    recommendation: dbCand.recommendation,
    summary: dbCand.summary,
    strengths: dbCand.strengths || [],
    weaknesses: dbCand.weaknesses || [],
    timeline: dbCand.timeline || [],
    profileImageUrl: dbCand.profile_image_url,
    resume: dbCand.resumes ? {
      id: dbCand.resumes.id,
      candidate: dbCand.resumes.candidate_id,
      originalFileName: dbCand.resumes.original_file_name,
      fileUrl: dbCand.resumes.storage_path,
      fileType: dbCand.resumes.file_type,
      fileSize: dbCand.resumes.file_size,
      parsingStatus: dbCand.resumes.parsing_status,
      screeningStatus: dbCand.resumes.screening_status,
      uploadedAt: dbCand.resumes.uploaded_at
    } : null,
    createdAt: dbCand.created_at,
    updatedAt: dbCand.updated_at
  };
};

const mapCandidateToDb = (cand) => {
  if (!cand) return {};
  const dbCand = {};
  if (cand.name !== undefined) dbCand.name = cand.name;
  if (cand.email !== undefined) dbCand.email = cand.email;
  if (cand.phone !== undefined) dbCand.phone = cand.phone;
  if (cand.role !== undefined) dbCand.role = cand.role;
  if (cand.interviewId !== undefined) dbCand.interview_id = cand.interviewId;
  if (cand.status !== undefined) dbCand.status = cand.status;
  if (cand.overallScore !== undefined) dbCand.overall_score = cand.overallScore;
  if (cand.completionDate !== undefined) dbCand.completion_date = cand.completionDate;
  if (cand.avatarInitials !== undefined) dbCand.avatar_initials = cand.avatarInitials;
  if (cand.skills !== undefined) dbCand.skills = cand.skills;
  if (cand.education !== undefined) dbCand.education = cand.education;
  if (cand.experience !== undefined) dbCand.experience = cand.experience;
  if (cand.projects !== undefined) dbCand.projects = cand.projects;
  if (cand.recommendation !== undefined) dbCand.recommendation = cand.recommendation;
  if (cand.summary !== undefined) dbCand.summary = cand.summary;
  if (cand.strengths !== undefined) dbCand.strengths = cand.strengths;
  if (cand.weaknesses !== undefined) dbCand.weaknesses = cand.weaknesses;
  if (cand.timeline !== undefined) dbCand.timeline = cand.timeline;
  if (cand.profileImageUrl !== undefined) dbCand.profile_image_url = cand.profileImageUrl;
  return dbCand;
};

export const createCandidate = async (candidateBody) => {
  // Check if candidate with email already exists
  const { data: existing } = await supabase
    .from('candidates')
    .select('id')
    .eq('email', candidateBody.email.toLowerCase())
    .maybeSingle();

  if (existing) {
    throw new ApiError(400, 'Candidate with this email already exists');
  }

  const dbData = mapCandidateToDb(candidateBody);
  if (dbData.email) dbData.email = dbData.email.toLowerCase();

  const { data, error } = await supabase
    .from('candidates')
    .insert(dbData)
    .select('*, resumes(*)')
    .single();

  if (error) throw error;
  return mapDbToCandidate(data);
};

export const queryCandidates = async (filter = {}) => {
  let query = supabase.from('candidates').select('*, resumes(*)');

  // Handle simple filter keys if passed
  Object.keys(filter).forEach((key) => {
    const dbKey = key === 'interviewId' ? 'interview_id' : key;
    query = query.eq(dbKey, filter[key]);
  });

  const { data, error } = await query;
  if (error) throw error;

  return data.map(mapDbToCandidate);
};

export const getCandidateById = async (id) => {
  const { data, error } = await supabase
    .from('candidates')
    .select('*, resumes(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new ApiError(404, 'Candidate not found');
  }

  return mapDbToCandidate(data);
};

export const updateCandidateById = async (id, updateBody) => {
  const candidate = await getCandidateById(id);

  if (updateBody.email && updateBody.email.toLowerCase() !== candidate.email.toLowerCase()) {
    const { data: existing } = await supabase
      .from('candidates')
      .select('id')
      .eq('email', updateBody.email.toLowerCase())
      .maybeSingle();

    if (existing) {
      throw new ApiError(400, 'Candidate with this email already exists');
    }
  }

  const dbData = mapCandidateToDb(updateBody);
  if (dbData.email) dbData.email = dbData.email.toLowerCase();

  const { data, error } = await supabase
    .from('candidates')
    .update(dbData)
    .eq('id', id)
    .select('*, resumes(*)')
    .single();

  if (error) throw error;
  return mapDbToCandidate(data);
};

export const deleteCandidateById = async (id) => {
  const candidate = await getCandidateById(id);

  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return candidate;
};
