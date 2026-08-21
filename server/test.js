import dotenv from 'dotenv';
dotenv.config();

import supabase from './src/config/supabase.js';
import app from './src/app.js';

const PORT = 5001;

// Assert helper
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(` ✓ [PASS] ${message}`);
};

const runTests = async () => {
  console.log('=== Commencing Supabase-based Integration Test Suite ===');
  
  // Start server listener
  const server = app.listen(PORT, async () => {
    console.log(`Test server active on port: ${PORT}`);
    
    // IDs list to cleanup after execution to avoid polluting database
    let candidateId;
    let candidateId2;
    let jobId;
    let asyncInterviewId;
    let liveInterviewId;
    let resumeId;
    let reportId;
    let questionId;
    let answerId;

    const baseUrl = `http://localhost:${PORT}/api`;
    
    try {
      // Test 1: GET /api/health
      console.log('\nRunning Test 1: Health Check Endpoint...');
      const healthRes = await fetch(`${baseUrl}/health`);
      assert(healthRes.status === 200, 'Health endpoint status is 200');
      const healthJson = await healthRes.json();
      assert(healthJson.success === true, 'Health check returns success=true');
      assert(healthJson.database === 'supabase', 'Health check returns database=supabase');

      // Test 2: POST /api/candidates (Validation Error - Missing Email)
      console.log('\nRunning Test 2: Candidate Create - Missing Fields Validation...');
      const candInvalidRes = await fetch(`${baseUrl}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alex Connor' })
      });
      assert(candInvalidRes.status === 400, 'Missing email candidate returns status 400');
      const candInvalidJson = await candInvalidRes.json();
      assert(candInvalidJson.success === false, 'Invalid candidate response success is false');

      // Test 3: POST /api/candidates (Success)
      console.log('\nRunning Test 3: Candidate Create - Successful registration...');
      const uniqueEmail = `sarah.connor.${Date.now()}@resistance.net`;
      const candRes = await fetch(`${baseUrl}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sarah Connor',
          email: uniqueEmail,
          phone: '+1-555-1984',
          skills: ['Cybersecurity', 'Tactical Operations']
        })
      });
      assert(candRes.status === 201, 'Successful candidate creation returns status 201');
      const candJson = await candRes.json();
      assert(candJson.success === true, 'Candidate response success is true');
      assert(candJson.data.name === 'Sarah Connor', 'Name matches input');
      candidateId = candJson.data.id;
      assert(candidateId !== undefined, 'Candidate has valid UUID');

      // Test 4: GET /api/candidates (List Retrieves & Candidate Details)
      console.log('\nRunning Test 4: Candidate Retrieval...');
      const listRes = await fetch(`${baseUrl}/candidates`);
      assert(listRes.status === 200, 'List candidates returns 200');
      const listJson = await listRes.json();
      assert(listJson.data.length >= 1, 'Candidates list contains at least 1 candidate');

      const getOneRes = await fetch(`${baseUrl}/candidates/${candidateId}`);
      assert(getOneRes.status === 200, 'Get single candidate returns 200');
      const getOneJson = await getOneRes.json();
      assert(getOneJson.data.email === uniqueEmail, 'Retrieved email matches');

      // Test 5: POST /api/jobs (Success)
      console.log('\nRunning Test 5: Job Create...');
      const jobRes = await fetch(`${baseUrl}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Principal Systems Architect',
          description: 'Oversee autonomous system hardware integrations.',
          department: 'Engineering',
          requiredSkills: ['Node.js', 'PostgreSQL', 'Supabase'],
          employmentType: 'Full-time'
        })
      });
      assert(jobRes.status === 201, 'Job creation status is 201');
      const jobJson = await jobRes.json();
      jobId = jobJson.data.id;
      assert(jobId !== undefined, 'Job has valid UUID');

      // Test 6: POST /api/interviews (Async Interview Create)
      console.log('\nRunning Test 6: Async Interview Creation...');
      const asyncIntRes = await fetch(`${baseUrl}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'System Design Async Screening',
          job: jobId,
          candidate: candidateId,
          type: 'async',
          duration: 30
        })
      });
      assert(asyncIntRes.status === 201, 'Async interview creation returns 201');
      const asyncIntJson = await asyncIntRes.json();
      asyncInterviewId = asyncIntJson.data.id;
      assert(asyncIntJson.data.interviewType === 'async', 'Interview type is async');

      // Test 7: POST /api/interviews (Live Interview Create)
      console.log('\nRunning Test 7: Live Interview Creation...');
      const liveIntRes = await fetch(`${baseUrl}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Live Conversational Architecture Boarding',
          job: jobId,
          candidate: candidateId,
          type: 'live',
          duration: 45
        })
      });
      assert(liveIntRes.status === 201, 'Live interview creation returns 201');
      const liveIntJson = await liveIntRes.json();
      liveInterviewId = liveIntJson.data.id;
      assert(liveIntJson.data.interviewType === 'live', 'Interview type is live');

      // Test 8: Invalid interview type check
      console.log('\nRunning Test 8: Invalid Interview Type Validation...');
      const invalidIntRes = await fetch(`${baseUrl}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Invalid Interview Format',
          job: jobId,
          candidate: candidateId,
          type: 'conversational-assessment-format' // invalid type
        })
      });
      assert(invalidIntRes.status === 400, 'Invalid type returns 400 bad request');

      // Test 9: POST /api/interviews/:interviewId/questions
      console.log('\nRunning Test 9: Question Creation...');
      const qRes = await fetch(`${baseUrl}/interviews/${asyncInterviewId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'How do you structure database indexes for high-volume logs?',
          category: 'Database Architecture',
          difficulty: 'Hard',
          timeLimit: 180
        })
      });
      assert(qRes.status === 201, 'Question creation returns 201');
      const qJson = await qRes.json();
      questionId = qJson.data.id;
      assert(qJson.data.category === 'Database Architecture', 'Category matches');

      // Test 10: POST /api/interviews/:interviewId/answers
      console.log('\nRunning Test 10: Answer Creation...');
      const ansRes = await fetch(`${baseUrl}/interviews/${asyncInterviewId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidateId,
          questionId: questionId,
          transcript: 'Indexes should use B-Tree or BRIN strategies depending on query profiles.',
          duration: 45,
          score: 85,
          comments: 'Candidate explains index models clearly.'
        })
      });
      assert(ansRes.status === 201, 'Answer submission status is 201');
      const ansJson = await ansRes.json();
      answerId = ansJson.data.id;
      assert(ansJson.data.score === 85, 'Score matches expected value');

      // Test 11: POST /api/resumes (Success with text file)
      console.log('\nRunning Test 11: Resume Upload & Association...');
      const formData = new FormData();
      const resumeBlob = new Blob(['Dummy resume text content'], { type: 'text/plain' });
      formData.append('file', resumeBlob, 'test_sarah_resume.txt');
      formData.append('candidateId', candidateId);

      const uploadRes = await fetch(`${baseUrl}/resumes`, {
        method: 'POST',
        body: formData
      });
      assert(uploadRes.status === 201, 'Resume upload returns status 201');
      const uploadJson = await uploadRes.json();
      resumeId = uploadJson.data.id;
      assert(uploadJson.data.originalName === 'test_sarah_resume.txt', 'Original filename matches');

      // Test 12: POST /api/reports & GET /api/reports/:id
      console.log('\nRunning Test 12: Report Creation & Retrieval...');
      const reportRes = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidateId,
          interviewId: asyncInterviewId,
          overallScore: 88,
          recommendation: 'STRONG HIRE',
          summary: 'Highly tactical skills.',
          strengths: ['Analytical logic'],
          weaknesses: ['None']
        })
      });
      assert(reportRes.status === 201, 'Report creation returns 201');
      const reportJson = await reportRes.json();
      reportId = reportJson.data.id;

      const getRepRes = await fetch(`${baseUrl}/reports/${reportId}`);
      assert(getRepRes.status === 200, 'Retrieve report by ID returns 200');
      const getRepJson = await getRepRes.json();
      assert(getRepJson.data.overallScore === 88, 'Report score matches');

      // Test 13: Duplicate report prevention
      console.log('\nRunning Test 13: Duplicate Report Prevention...');
      const dupRepRes = await fetch(`${baseUrl}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidateId,
          interviewId: asyncInterviewId,
          overallScore: 90,
          recommendation: 'STRONG HIRE'
        })
      });
      assert(dupRepRes.status === 400, 'Duplicate report creation rejected with 400');
      const dupRepJson = await dupRepRes.json();
      assert(dupRepJson.message.includes('already exists'), 'ErrorMessage clarifies unique violation');

      // Test 14: Invalid UUID validation check
      console.log('\nRunning Test 14: Invalid UUID Parameter Validation...');
      const invalidUuidRes = await fetch(`${baseUrl}/candidates/not-a-valid-uuid-value`);
      assert(invalidUuidRes.status === 400, 'Invalid UUID parameter returns status 400');
      const invalidUuidJson = await invalidUuidRes.json();
      assert(invalidUuidJson.message === 'Invalid UUID format', 'Correct UUID format error returned');

      // Test 15: 404 Route handling check
      console.log('\nRunning Test 15: 404 Route Handling check...');
      const missingRouteRes = await fetch(`${baseUrl}/unregistered-api-route-endpoint`);
      assert(missingRouteRes.status === 404, 'Unregistered route returns 404');
      const missingRouteJson = await missingRouteRes.json();
      assert(missingRouteJson.message.includes('API Route Not Found'), '404 handler returns correct label');

      // Test 16: Storage failure (Upload missing file)
      console.log('\nRunning Test 16: Storage Failure Validation...');
      const emptyUploadRes = await fetch(`${baseUrl}/resumes`, {
        method: 'POST',
        body: new FormData()
      });
      assert(emptyUploadRes.status === 400, 'Missing multipart file upload returns 400');

      console.log('\n======================================================');
      console.log('    ALL 16 SUPABASE API TEST SCENARIOS PASSED SUCCESS   ');
      console.log('======================================================');

    } catch (testError) {
      console.error(`\n✖ TEST SUITE RUNTIME EXCEPTION: ${testError.message}`);
      process.exitCode = 1;
    } finally {
      console.log('\nPerforming test database records cleanup...');
      
      // Cleanup tables sequentially to respect foreign key references
      if (reportId) {
        await supabase.from('reports').delete().eq('id', reportId);
        console.log(' ✓ Removed test report');
      }
      if (answerId) {
        await supabase.from('answers').delete().eq('id', answerId);
        console.log(' ✓ Removed test answer');
      }
      if (questionId) {
        await supabase.from('questions').delete().eq('id', questionId);
        console.log(' ✓ Removed test question');
      }
      if (asyncInterviewId) {
        await supabase.from('interviews').delete().eq('id', asyncInterviewId);
        console.log(' ✓ Removed test async interview');
      }
      if (liveInterviewId) {
        await supabase.from('interviews').delete().eq('id', liveInterviewId);
        console.log(' ✓ Removed test live interview');
      }
      if (resumeId) {
        // Attempt removing the file from storage
        const { data: resumeMeta } = await supabase.from('resumes').select('storage_path').eq('id', resumeId).maybeSingle();
        if (resumeMeta && resumeMeta.storage_path) {
          const oldPath = resumeMeta.storage_path.split('/resumes/').pop();
          if (oldPath) {
            await supabase.storage.from('resumes').remove([oldPath]);
          }
        }
        await supabase.from('resumes').delete().eq('id', resumeId);
        console.log(' ✓ Removed test resume metadata & storage file');
      }
      if (candidateId) {
        // Remove constraint first
        await supabase.from('candidates').update({ interview_id: null }).eq('id', candidateId);
        await supabase.from('candidates').delete().eq('id', candidateId);
        console.log(' ✓ Removed test candidate');
      }
      if (jobId) {
        await supabase.from('jobs').delete().eq('id', jobId);
        console.log(' ✓ Removed test job');
      }

      // Close server and exit
      server.close(() => {
        console.log('Test server stopped.');
        process.exit(process.exitCode || 0);
      });
    }
  });
};

runTests();
