import supabase from '../config/supabase.js';
import ApiError from '../utils/ApiError.js';
import { getInterviewById } from './interviewService.js';
import { getCandidateById } from './candidateService.js';

const mapDbToReport = (dbRep) => {
  if (!dbRep) return null;
  return {
    id: dbRep.id,
    interviewId: dbRep.interview_id,
    candidateId: dbRep.candidate_id,
    overallScore: dbRep.overall_score !== null ? Number(dbRep.overall_score) : null,
    technicalScore: dbRep.technical_score !== null ? Number(dbRep.technical_score) : null,
    communicationScore: dbRep.communication_score !== null ? Number(dbRep.communication_score) : null,
    problemSolvingScore: dbRep.problem_solving_score !== null ? Number(dbRep.problem_solving_score) : null,
    confidenceScore: dbRep.confidence_score !== null ? Number(dbRep.confidence_score) : null,
    strengths: dbRep.strengths || [],
    weaknesses: dbRep.weaknesses || [],
    recommendation: dbRep.recommendation,
    summary: dbRep.summary || '',
    questionAnalysis: dbRep.question_analysis || [],
    timeline: dbRep.timeline || [],
    generatedAt: dbRep.generated_at,
    candidate: dbRep.candidates ? {
      id: dbRep.candidates.id,
      name: dbRep.candidates.name,
      email: dbRep.candidates.email
    } : dbRep.candidate_id,
    interview: dbRep.interviews ? {
      id: dbRep.interviews.id,
      title: dbRep.interviews.title,
      type: dbRep.interviews.type
    } : dbRep.interview_id
  };
};

export const createReport = async (reportData) => {
  const intId = reportData.interview || reportData.interviewId;
  const candId = reportData.candidate || reportData.candidateId;

  if (!intId || !candId) {
    throw new ApiError(400, 'Interview and Candidate references are required');
  }

  await getInterviewById(intId);
  await getCandidateById(candId);

  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('interview_id', intId)
    .maybeSingle();

  if (existing) {
    throw new ApiError(400, 'A report already exists for this interview');
  }

  const dbData = {
    interview_id: intId,
    candidate_id: candId,
    overall_score: reportData.overallScore !== undefined ? reportData.overallScore : null,
    technical_score: reportData.technicalScore !== undefined ? reportData.technicalScore : null,
    communication_score: reportData.communicationScore !== undefined ? reportData.communicationScore : null,
    problem_solving_score: reportData.problemSolvingScore !== undefined ? reportData.problemSolvingScore : null,
    confidence_score: reportData.confidenceScore !== undefined ? reportData.confidenceScore : null,
    strengths: reportData.strengths || [],
    weaknesses: reportData.weaknesses || [],
    recommendation: reportData.recommendation || '',
    summary: reportData.summary || '',
    question_analysis: reportData.questionAnalysis || [],
    timeline: reportData.timeline || []
  };

  const { data, error } = await supabase
    .from('reports')
    .insert(dbData)
    .select('*, candidates(*), interviews(*)')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new ApiError(400, 'A report already exists for this interview');
    }
    throw error;
  }

  return mapDbToReport(data);
};

export const getReportByIdOrInterviewId = async (id) => {
  let { data, error } = await supabase
    .from('reports')
    .select('*, candidates(*), interviews(*)')
    .eq('id', id)
    .maybeSingle();

  if (error && error.code !== '22P02') throw error;

  if (!data) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('reports')
      .select('*, candidates(*), interviews(*)')
      .eq('interview_id', id)
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    data = fallbackData;
  }

  if (!data) {
    throw new ApiError(404, 'Report not found');
  }

  return mapDbToReport(data);
};

export const getReportByInterviewId = getReportByIdOrInterviewId;

export const getAnalytics = async () => {
  // Query all candidates
  const { data: candidates, error: candError } = await supabase
    .from('candidates')
    .select();

  if (candError) throw candError;

  // Query all interviews
  const { data: interviews, error: intError } = await supabase
    .from('interviews')
    .select('*, jobs(*)');

  if (intError) throw intError;

  const totalInvited = candidates.length;
  const completedCandidates = candidates.filter(c => c.status === 'Completed');
  const completedCount = completedCandidates.length;

  const activeInterviews = interviews.filter(i => i.status === 'Active').length;

  const totalScore = completedCandidates.reduce((acc, curr) => acc + (curr.overall_score !== null ? Number(curr.overall_score) : 0), 0);
  const averageScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;

  const conversionRate = totalInvited > 0 ? Math.round((completedCount / totalInvited) * 100) : 0;

  // Compute score distribution
  const scoreDistribution = [
    { range: '0-50', count: 0 },
    { range: '50-60', count: 0 },
    { range: '60-70', count: 0 },
    { range: '70-80', count: 0 },
    { range: '80-90', count: 0 },
    { range: '90-100', count: 0 },
  ];

  completedCandidates.forEach(c => {
    const score = Number(c.overall_score || 0);
    if (score < 50) scoreDistribution[0].count++;
    else if (score < 60) scoreDistribution[1].count++;
    else if (score < 70) scoreDistribution[2].count++;
    else if (score < 80) scoreDistribution[3].count++;
    else if (score < 90) scoreDistribution[4].count++;
    else scoreDistribution[5].count++;
  });

  // Department statistics mapping based on interviews -> jobs
  const deptMap = {};
  interviews.forEach(int => {
    const dept = int.department || (int.jobs ? int.jobs.department : 'General') || 'General';
    if (!deptMap[dept]) {
      deptMap[dept] = { count: 0, totalScore: 0, completedCount: 0 };
    }
    
    const intCandidates = candidates.filter(c => c.interview_id === int.id);
    deptMap[dept].count += intCandidates.length;
    
    intCandidates.forEach(c => {
      if (c.status === 'Completed' && c.overall_score !== null) {
        deptMap[dept].completedCount++;
        deptMap[dept].totalScore += Number(c.overall_score);
      }
    });
  });

  const departmentStats = Object.entries(deptMap).map(([name, stats]) => ({
    name,
    count: stats.count,
    avg: stats.completedCount > 0 ? Math.round(stats.totalScore / stats.completedCount) : 0
  }));

  if (departmentStats.length === 0) {
    departmentStats.push(
      { name: 'Engineering', count: 0, avg: 0 },
      { name: 'Product', count: 0, avg: 0 },
      { name: 'Design', count: 0, avg: 0 }
    );
  }

  const weeklyCompletions = [
    { name: 'Mon', count: Math.round(completedCandidates.length * 0.1) },
    { name: 'Tue', count: Math.round(completedCandidates.length * 0.2) },
    { name: 'Wed', count: Math.round(completedCandidates.length * 0.1) },
    { name: 'Thu', count: Math.round(completedCandidates.length * 0.3) },
    { name: 'Fri', count: Math.round(completedCandidates.length * 0.2) },
    { name: 'Sat', count: 0 },
    { name: 'Sun', count: 0 },
  ];

  return {
    kpis: {
      activeInterviews,
      totalInvited,
      completions: completedCount,
      averageScore,
      conversionRate,
    },
    weeklyCompletions,
    scoreDistribution,
    departmentStats
  };
};
