import supabase from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';

const mapDbToInterview = (dbInt) => {
  if (!dbInt) return null;
  return {
    id: dbInt.id,
    title: dbInt.title,
    jobRole: dbInt.job_role || (dbInt.jobs ? dbInt.jobs.title : ''),
    job: dbInt.jobs ? {
      id: dbInt.jobs.id,
      title: dbInt.jobs.title,
      department: dbInt.jobs.department,
      status: dbInt.jobs.status,
      description: dbInt.jobs.description,
      skills: dbInt.jobs.required_skills || [],
      createdAt: dbInt.jobs.created_at,
      updatedAt: dbInt.jobs.updated_at
    } : null,
    candidate: dbInt.candidates ? {
      id: dbInt.candidates.id,
      name: dbInt.candidates.name,
      email: dbInt.candidates.email,
      role: dbInt.candidates.role,
      status: dbInt.candidates.status
    } : null,
    candidateId: dbInt.candidate_id || (dbInt.candidates ? dbInt.candidates.id : null),
    candidate_id: dbInt.candidate_id || (dbInt.candidates ? dbInt.candidates.id : null),
    company: dbInt.company || '',
    interviewType: dbInt.type,
    type: dbInt.type,
    templateId: dbInt.settings?.templateId || '',
    department: dbInt.settings?.department || (dbInt.jobs ? dbInt.jobs.department : ''),
    status: dbInt.status,
    duration: dbInt.duration,
    language: dbInt.settings?.language || { code: 'en-IN', name: 'English', mode: 'native' },
    languageCode: dbInt.settings?.language?.code || dbInt.settings?.languageCode || 'en-IN',
    settings: dbInt.settings || {},
    questions: (dbInt.questions || []).map(q => ({
      id: q.id,
      text: q.text,
      category: q.category,
      duration: q.duration || q.time_limit || 180,
      difficulty: q.difficulty,
      boilerplate: q.boilerplate || '',
      testCases: q.test_cases || [],
      questionOrder: q.question_order,
      expectedTopics: q.expected_topics || [],
      questionType: q.question_type || 'text',
      timeLimit: q.time_limit || q.duration
    })).sort((a, b) => a.questionOrder - b.questionOrder),
    createdAt: dbInt.created_at,
    updatedAt: dbInt.updated_at
  };
};

export const createInterview = async (interviewBody) => {
  const {
    title,
    job,
    candidate,
    candidateId,
    type,
    interviewType,
    status,
    duration,
    company,
    jobRole,
    templateId,
    department,
    settings = {},
    questions = []
  } = interviewBody;

  const candidateIdVal = candidate || candidateId || interviewBody.candidate_id || null;
  const actualType = type || interviewType || 'async';
  if (!['async', 'live'].includes(actualType)) {
    throw new ApiError(400, 'Interview type must be either async or live');
  }

  const language = interviewBody.language || settings.language || { code: 'en-IN', name: 'English', mode: 'native' };
  const interviewSettings = {
    ...settings,
    language,
    ...(templateId ? { templateId } : {}),
    ...(department ? { department } : {})
  };

  // Insert interview row
  const dbData = {
    title,
    job_id: job || null,
    candidate_id: candidateIdVal,
    type: actualType,
    status: status || 'Draft',
    duration: duration !== undefined ? duration : 30,
    company: company || '',
    job_role: jobRole || '',
    settings: interviewSettings
  };

  const { data: insertedInt, error: intError } = await supabase
    .from('interviews')
    .insert(dbData)
    .select()
    .single();

  if (intError) throw intError;

  // Link candidate record to interview if provided
  if (candidateIdVal) {
    await supabase
      .from('candidates')
      .update({ interview_id: insertedInt.id })
      .eq('id', candidateIdVal);
  }

  // Insert questions if present
  if (questions && questions.length > 0) {
    const qDbData = questions.map((q, idx) => ({
      interview_id: insertedInt.id,
      text: q.text,
      category: q.category || 'General',
      duration: q.duration || q.timeLimit || 180,
      time_limit: q.timeLimit || q.duration || 180,
      difficulty: q.difficulty || 'Medium',
      boilerplate: q.boilerplate || '',
      test_cases: q.testCases || [],
      question_order: q.questionOrder !== undefined ? q.questionOrder : idx,
      expected_topics: q.expectedTopics || [],
      question_type: q.questionType || 'text'
    }));

    const { error: qError } = await supabase
      .from('questions')
      .insert(qDbData);

    if (qError) throw qError;
  }

  // Retrieve full interview structure with joins
  return await getInterviewById(insertedInt.id);
};

export const queryInterviews = async (filter = {}) => {
  const { data, error } = await supabase
    .from('interviews')
    .select('*, jobs(*), candidates!candidate_id(*), questions(*)');

  if (error) throw error;
  let results = data.map(mapDbToInterview);

  if (filter.candidateId) {
    const cid = filter.candidateId;
    // Check if candidate record has reciprocal interview_id assigned
    const { data: cand } = await supabase
      .from('candidates')
      .select('id, email, interview_id')
      .eq('id', cid)
      .maybeSingle();

    const candInterviewId = cand?.interview_id;
    const candEmail = (cand?.email || '').toLowerCase().trim();

    results = results.filter((int) => {
      const matchCandidateId = int.candidateId === cid || int.candidate_id === cid || int.candidate?.id === cid;
      const matchCandidateDirect = candInterviewId && int.id === candInterviewId;
      const matchCandidateEmail = candEmail && int.candidate?.email && int.candidate.email.toLowerCase().trim() === candEmail;
      return matchCandidateId || matchCandidateDirect || matchCandidateEmail;
    });
  }

  if (filter.status && filter.status !== 'ALL') {
    results = results.filter((int) => (int.status || '').toLowerCase() === filter.status.toLowerCase());
  }

  return results;
};

export const getInterviewById = async (id) => {
  const { data, error } = await supabase
    .from('interviews')
    .select('*, jobs(*), candidates!candidate_id(*), questions(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new ApiError(404, 'Assessment session not found');
  }

  return mapDbToInterview(data);
};

export const updateInterviewById = async (id, updateBody) => {
  // Check if exists
  const existing = await getInterviewById(id);
  const currentStatus = (existing.status || 'Draft').toLowerCase();

  // Lifecycle Rule 1: Completed interview cannot alter questions, duration, or interview type
  if (currentStatus === 'completed' || currentStatus === 'evaluated') {
    if (updateBody.questions !== undefined) {
      throw new ApiError(400, 'This interview has already been completed. Historical interview questions and evaluation criteria cannot be modified.');
    }
    if (updateBody.duration !== undefined && Number(updateBody.duration) !== Number(existing.duration)) {
      throw new ApiError(400, 'This interview has already been completed. Duration cannot be modified.');
    }
    if (updateBody.type !== undefined && updateBody.type !== existing.type) {
      throw new ApiError(400, 'This interview has already been completed. Assessment format cannot be modified.');
    }
  }

  // Lifecycle Rule 2: In-Progress interview restricts dangerous modifications
  if (currentStatus === 'in_progress' || currentStatus === 'active_session') {
    if (updateBody.questions !== undefined) {
      throw new ApiError(400, 'This interview has already started, so its questions cannot be changed while in progress.');
    }
    if (updateBody.duration !== undefined && Number(updateBody.duration) !== Number(existing.duration)) {
      throw new ApiError(400, 'This interview has already started, so duration cannot be changed while in progress.');
    }
  }

  const dbData = {};
  if (updateBody.title !== undefined) dbData.title = updateBody.title;
  if (updateBody.description !== undefined) dbData.description = updateBody.description;
  if (updateBody.job !== undefined) dbData.job_id = updateBody.job;
  if (updateBody.candidate !== undefined) dbData.candidate_id = updateBody.candidate || null;
  if (updateBody.type !== undefined) dbData.type = updateBody.type;
  if (updateBody.interviewType !== undefined) dbData.type = updateBody.interviewType;
  if (updateBody.status !== undefined) dbData.status = updateBody.status;
  if (updateBody.duration !== undefined) dbData.duration = Number(updateBody.duration);
  if (updateBody.company !== undefined) dbData.company = updateBody.company;
  if (updateBody.jobRole !== undefined) dbData.job_role = updateBody.jobRole;
  if (updateBody.settings !== undefined || updateBody.templateId !== undefined || updateBody.department !== undefined || updateBody.language !== undefined || updateBody.instructions !== undefined) {
    dbData.settings = {
      ...(existing.settings || {}),
      ...(updateBody.settings || {}),
      ...(updateBody.language !== undefined ? { language: updateBody.language } : {}),
      ...(updateBody.templateId !== undefined ? { templateId: updateBody.templateId } : {}),
      ...(updateBody.department !== undefined ? { department: updateBody.department } : {}),
      ...(updateBody.instructions !== undefined ? { instructions: updateBody.instructions } : {})
    };
  }

  if (dbData.type && !['async', 'live'].includes(dbData.type)) {
    throw new ApiError(400, 'Interview type must be either async or live');
  }

  const { data, error } = await supabase
    .from('interviews')
    .update(dbData)
    .eq('id', id)
    .select('*, jobs(*), candidates!candidate_id(*), questions(*)')
    .single();

  if (error) throw error;

  // Link candidate record to interview if provided
  if (updateBody.candidate) {
    await supabase
      .from('candidates')
      .update({ interview_id: id })
      .eq('id', updateBody.candidate);
  } else if (updateBody.candidate === null && existing.candidateId) {
    // Unassign previous candidate
    await supabase
      .from('candidates')
      .update({ interview_id: null })
      .eq('id', existing.candidateId);
  }

  // Handle nested question updates if passed in updateBody
  if (updateBody.questions !== undefined) {
    // Delete existing questions
    const { error: delError } = await supabase
      .from('questions')
      .delete()
      .eq('interview_id', id);

    if (delError) throw delError;

    // Insert new questions
    if (updateBody.questions.length > 0) {
      const qDbData = updateBody.questions.map((q, idx) => ({
        interview_id: id,
        text: q.text,
        category: q.category || 'General',
        duration: q.duration || q.timeLimit || 180,
        time_limit: q.timeLimit || q.duration || 180,
        difficulty: q.difficulty || 'Medium',
        boilerplate: q.boilerplate || '',
        test_cases: q.testCases || [],
        question_order: q.questionOrder !== undefined ? q.questionOrder : idx,
        expected_topics: q.expectedTopics || [],
        question_type: q.questionType || 'text'
      }));

      const { error: qError } = await supabase
        .from('questions')
        .insert(qDbData);

      if (qError) throw qError;
    }
    
    return await getInterviewById(id);
  }

  return mapDbToInterview(data);
};

export const deleteInterviewById = async (id) => {
  const interview = await getInterviewById(id);

  const { error } = await supabase
    .from('interviews')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return interview;
};
