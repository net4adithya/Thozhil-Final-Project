const asyncHandler = require('express-async-handler');
const prisma = require('../config/prisma');

/**
 * GET /api/admin/dashboard
 * Aggregates statistics for total interns, active assignments, pending/completed assessments,
 * review breakdowns, and assessment pipeline progress.
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  let totalInterns = 0;
  let activeAssignments = 0;
  let pendingAssessments = 0;
  let completedAssessments = 0;
  let pendingReviews = 0;
  let approved = 0;
  let rejected = 0;
  let resubmissionRequested = 0;

  try {
    const [
      internCount,
      assignmentCount,
      assignments,
      resumeEvals,
      interviewEvals,
      projectReviews,
      submissions,
    ] = await Promise.all([
      prisma.intern.count().catch(() => 0),
      prisma.assignment.count().catch(() => 0),
      prisma.assignment.findMany({
        include: {
          intern: { include: { user: true } },
          resumeEvaluations: true,
          interviewEvaluations: true,
          projectLogReviews: true,
          submissions: { include: { versions: true } },
        },
      }).catch(() => []),
      prisma.resumeEvaluation.findMany().catch(() => []),
      prisma.interviewEvaluation.findMany().catch(() => []),
      prisma.projectLogReview.findMany().catch(() => []),
      prisma.submission.findMany().catch(() => []),
    ]);

    totalInterns = internCount;
    activeAssignments = assignmentCount;

    // Process review stats
    for (const a of assignments) {
      if (['DRAFT', 'PUBLISHED', 'PENDING_REVIEW'].includes(a.status)) {
        pendingAssessments++;
      } else if (['APPROVED', 'REJECTED', 'COMPLETED'].includes(a.status)) {
        completedAssessments++;
      }

      if (a.status === 'APPROVED') approved++;
      else if (a.status === 'REJECTED') rejected++;
      else if (a.status === 'RESUBMISSION_REQUESTED') resubmissionRequested++;
      else pendingReviews++;
    }

    // Build pipeline progress overview
    const pipelineOverview = assignments.map((a) => {
      const internName = a.intern?.user
        ? `${a.intern.user.firstName} ${a.intern.user.lastName}`.trim()
        : 'Unassigned';

      const hasResume = a.resumeEvaluations && a.resumeEvaluations.length > 0;
      const hasInterview = a.interviewEvaluations && a.interviewEvaluations.length > 0;
      const hasProject = a.projectLogReviews && a.projectLogReviews.length > 0;
      const hasCoding = a.submissions && a.submissions.length > 0;

      return {
        assignmentId: a.id,
        title: a.title,
        internName,
        status: a.status,
        stages: {
          resume: hasResume ? a.resumeEvaluations[0].status : 'NOT_STARTED',
          interview: hasInterview ? a.interviewEvaluations[0].status : 'NOT_STARTED',
          project: hasProject ? a.projectLogReviews[0].recommendation : 'NOT_STARTED',
          coding: hasCoding ? a.submissions[0].status : 'NOT_STARTED',
        },
      };
    });

    return res.json({
      overview: {
        totalInterns,
        activeAssignments,
        pendingAssessments,
        completedAssessments,
        pendingReviews,
        approved,
        rejected,
        resubmissionRequested,
      },
      pipelineOverview,
    });
  } catch (err) {
    res.status(500);
    throw new Error(`Failed to load admin dashboard stats: ${err.message}`);
  }
});

/**
 * GET /api/admin/assignments
 * Filterable and searchable list of assignments.
 */
const listAssignments = asyncHandler(async (req, res) => {
  const { status, internId, search } = req.query;

  try {
    const where = {};
    if (status) where.status = String(status);
    if (internId) where.internId = String(internId);
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        intern: { include: { user: true } },
        language: true,
        createdBy: true,
        resumeEvaluations: true,
        interviewEvaluations: true,
        projectLogReviews: true,
        submissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      status: a.status,
      accessCode: a.accessCode,
      deadline: a.deadline,
      language: a.language?.name || 'Multi-language',
      intern: a.intern
        ? {
            id: a.intern.id,
            name: a.intern.user ? `${a.intern.user.firstName} ${a.intern.user.lastName}`.trim() : 'Intern',
            email: a.intern.user?.email || '',
          }
        : null,
      stages: {
        resumeCount: a.resumeEvaluations.length,
        interviewCount: a.interviewEvaluations.length,
        projectLogCount: a.projectLogReviews.length,
        submissionCount: a.submissions.length,
      },
      createdAt: a.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500);
    throw new Error(`Failed to list assignments: ${err.message}`);
  }
});

/**
 * GET /api/admin/interns
 * Returns list of all interns with their active assignments and status summaries.
 */
const listInterns = asyncHandler(async (req, res) => {
  try {
    const interns = await prisma.intern.findMany({
      include: {
        user: true,
        assignments: {
          include: {
            resumeEvaluations: true,
            interviewEvaluations: true,
            projectLogReviews: true,
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = interns.map((i) => ({
      id: i.id,
      userId: i.userId,
      name: i.user ? `${i.user.firstName} ${i.user.lastName}`.trim() : 'Intern',
      email: i.user?.email || '',
      institution: i.institution || 'N/A',
      startDate: i.startDate,
      endDate: i.endDate,
      assignedCount: i.assignments.length,
      completedCount: i.assignments.filter((a) => ['APPROVED', 'REJECTED', 'COMPLETED'].includes(a.status)).length,
      assignments: i.assignments.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        deadline: a.deadline,
      })),
    }));

    res.json(result);
  } catch (err) {
    res.status(500);
    throw new Error(`Failed to fetch interns list: ${err.message}`);
  }
});

/**
 * GET /api/admin/interns/:id/assessment-history
 * Detailed assessment history for a specific intern.
 */
const getInternAssessmentHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    let intern = await prisma.intern.findUnique({
      where: { id },
      include: {
        user: true,
        assignments: {
          include: {
            language: true,
            resumeEvaluations: true,
            interviewEvaluations: true,
            projectLogReviews: true,
            submissions: { include: { currentVersion: true, versions: true } },
          },
        },
      },
    });

    if (!intern) {
      intern = await prisma.intern.findFirst({
        where: { userId: id },
        include: {
          user: true,
          assignments: {
            include: {
              language: true,
              resumeEvaluations: true,
              interviewEvaluations: true,
              projectLogReviews: true,
              submissions: { include: { currentVersion: true, versions: true } },
            },
          },
        },
      });
    }

    if (!intern) {
      res.status(404);
      throw new Error('Intern not found.');
    }

    const history = intern.assignments.map((a) => ({
      assignmentId: a.id,
      title: a.title,
      description: a.description,
      language: a.language?.name,
      status: a.status,
      accessCode: a.accessCode,
      deadline: a.deadline,
      createdAt: a.createdAt,
      resumeEvaluation: a.resumeEvaluations[0] || null,
      interviewEvaluation: a.interviewEvaluations[0] || null,
      projectLogReview: a.projectLogReviews[0] || null,
      codingSubmission: a.submissions[0] || null,
    }));

    res.json({
      intern: {
        id: intern.id,
        name: intern.user ? `${intern.user.firstName} ${intern.user.lastName}`.trim() : 'Intern',
        email: intern.user?.email || '',
        institution: intern.institution || 'N/A',
        startDate: intern.startDate,
        endDate: intern.endDate,
      },
      assessmentHistory: history,
    });
  } catch (err) {
    res.status(500);
    throw new Error(`Failed to fetch intern assessment history: ${err.message}`);
  }
});

/**
 * GET /api/admin/assignments/:id/report
 * Multi-stage aggregated evaluation report for a single assignment.
 */
const getUnifiedReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        intern: { include: { user: true } },
        language: true,
        createdBy: true,
        resumeEvaluations: true,
        interviewEvaluations: true,
        projectLogReviews: true,
        submissions: {
          include: {
            currentVersion: true,
            versions: { orderBy: { version: 'desc' } },
          },
        },
      },
    });

    if (!assignment) {
      res.status(404);
      throw new Error('Assignment not found.');
    }

    const resume = assignment.resumeEvaluations[0] || null;
    const interview = assignment.interviewEvaluations[0] || null;
    const project = assignment.projectLogReviews[0] || null;
    const submission = assignment.submissions[0] || null;

    res.json({
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        status: assignment.status,
        accessCode: assignment.accessCode,
        deadline: assignment.deadline,
        language: assignment.language?.name,
        createdAt: assignment.createdAt,
        intern: assignment.intern
          ? {
              id: assignment.intern.id,
              name: assignment.intern.user
                ? `${assignment.intern.user.firstName} ${assignment.intern.user.lastName}`.trim()
                : 'Intern',
              email: assignment.intern.user?.email || '',
            }
          : null,
      },
      stages: {
        resume: resume
          ? {
              candidateName: resume.candidateName,
              candidateEmail: resume.candidateEmail,
              matchScore: resume.matchScore,
              skillsScore: resume.skillsScore,
              expScore: resume.expScore,
              projectsScore: resume.projectsScore,
              eduScore: resume.eduScore,
              reqScore: resume.reqScore,
              recommendation: resume.recommendation,
              status: resume.status,
              matchedSkills: resume.matchedSkills ? JSON.parse(resume.matchedSkills) : [],
              missingSkills: resume.missingSkills ? JSON.parse(resume.missingSkills) : [],
              strengths: resume.strengths ? JSON.parse(resume.strengths) : [],
              gaps: resume.gaps ? JSON.parse(resume.gaps) : [],
              explanation: resume.explanation,
            }
          : { status: 'NOT_COMPLETED' },

        interview: interview
          ? {
              interviewScore: interview.interviewScore,
              technicalScore: interview.technicalScore,
              communicationScore: interview.communicationScore,
              confidenceScore: interview.confidenceScore,
              recommendation: interview.recommendation,
              status: interview.status,
              transcript: interview.transcript ? JSON.parse(interview.transcript) : [],
              aiSummary: interview.aiSummary,
              audioUrl: interview.audioUrl,
              videoUrl: interview.videoUrl,
              proctoringEvents: interview.proctoringEvents ? JSON.parse(interview.proctoringEvents) : [],
            }
          : { status: 'NOT_COMPLETED' },

        project: project
          ? {
              workDescription: project.workDescription,
              logContent: project.logContent,
              sourceCode: project.sourceCode,
              overallScore: project.overallScore,
              correctnessScore: project.correctnessScore,
              qualityScore: project.qualityScore,
              riskScore: project.riskScore,
              recommendation: project.recommendation,
              strengths: project.strengths ? JSON.parse(project.strengths) : [],
              weaknesses: project.weaknesses ? JSON.parse(project.weaknesses) : [],
              suggestions: project.suggestions ? JSON.parse(project.suggestions) : [],
              summary: project.summary,
              internalNotes: project.internalNotes,
            }
          : { status: 'NOT_COMPLETED' },

        coding: submission
          ? {
              id: submission.id,
              status: submission.status,
              createdAt: submission.createdAt,
              updatedAt: submission.updatedAt,
              currentVersion: submission.currentVersion,
              versionCount: submission.versions.length,
              versions: submission.versions,
            }
          : { status: 'NOT_COMPLETED' },
      },
      overallStatus: assignment.status,
      privateNotes: project?.internalNotes || null,
    });
  } catch (err) {
    res.status(500);
    throw new Error(`Failed to load unified report: ${err.message}`);
  }
});

/**
 * POST /api/admin/assignments/:id/decision
 * Admin workflow action: APPROVE, REJECT, REQUEST RESUBMISSION + save private notes.
 */
const updateAssignmentDecision = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { decision, privateNotes } = req.body;

  const validDecisions = ['APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED', 'PENDING_REVIEW'];
  if (!validDecisions.includes(decision)) {
    res.status(400);
    throw new Error(`Decision must be one of: ${validDecisions.join(', ')}`);
  }

  try {
    const updated = await prisma.assignment.update({
      where: { id },
      data: { status: decision },
    });

    if (privateNotes !== undefined) {
      await prisma.projectLogReview.updateMany({
        where: { assignmentId: id },
        data: { internalNotes: String(privateNotes) },
      }).catch(() => {});
    }

    res.json({
      success: true,
      assignmentId: updated.id,
      status: updated.status,
      privateNotes: privateNotes || null,
    });
  } catch (err) {
    res.status(500);
    throw new Error(`Failed to update decision: ${err.message}`);
  }
});

module.exports = {
  getDashboardStats,
  listAssignments,
  listInterns,
  getInternAssessmentHistory,
  getUnifiedReport,
  updateAssignmentDecision,
};
