import supabase from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';

const mapDbToJob = (dbJob) => {
  if (!dbJob) return null;
  return {
    id: dbJob.id,
    title: dbJob.title,
    description: dbJob.description,
    department: dbJob.department,
    experienceLevel: dbJob.experience_level,
    requiredSkills: dbJob.required_skills || [],
    preferredSkills: dbJob.preferred_skills || [],
    skills: dbJob.required_skills || [], // Backward compatibility
    location: dbJob.location,
    employmentType: dbJob.employment_type,
    status: dbJob.status,
    createdAt: dbJob.created_at,
    updatedAt: dbJob.updated_at
  };
};

const mapJobToDb = (job) => {
  if (!job) return {};
  const dbJob = {};
  if (job.title !== undefined) dbJob.title = job.title;
  if (job.description !== undefined) dbJob.description = job.description;
  if (job.department !== undefined) dbJob.department = job.department;
  if (job.experienceLevel !== undefined) dbJob.experience_level = job.experienceLevel;
  if (job.requiredSkills !== undefined) {
    dbJob.required_skills = job.requiredSkills;
  } else if (job.skills !== undefined) {
    dbJob.required_skills = job.skills;
  }
  if (job.preferredSkills !== undefined) dbJob.preferred_skills = job.preferredSkills;
  if (job.location !== undefined) dbJob.location = job.location;
  if (job.employmentType !== undefined) dbJob.employment_type = job.employmentType;
  if (job.status !== undefined) dbJob.status = job.status;
  return dbJob;
};

export const createJob = async (jobBody) => {
  const dbData = mapJobToDb(jobBody);

  const { data, error } = await supabase
    .from('jobs')
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  return mapDbToJob(data);
};

export const queryJobs = async () => {
  const { data, error } = await supabase
    .from('jobs')
    .select();

  if (error) throw error;
  return data.map(mapDbToJob);
};

export const getJobById = async (id) => {
  const { data, error } = await supabase
    .from('jobs')
    .select()
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new ApiError(404, 'Job opening not found');
  }
  return mapDbToJob(data);
};

export const updateJobById = async (id, updateBody) => {
  await getJobById(id);

  const dbData = mapJobToDb(updateBody);

  const { data, error } = await supabase
    .from('jobs')
    .update(dbData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToJob(data);
};

export const deleteJobById = async (id) => {
  const job = await getJobById(id);

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return job;
};
