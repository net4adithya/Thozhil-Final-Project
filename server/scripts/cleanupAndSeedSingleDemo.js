import supabase from '../src/config/supabase.js';

async function cleanupAndEstablishSingleDemoDataset() {
  console.log('=== STARTING DATABASE CLEANUP & DEMO ISOLATION ===');

  // Real user records to preserve by email
  const realUserEmails = [
    'gamemania123098@gmail.com',
    'ajay@gmail.com',
    'aaa@gmail.com',
    'newwaa@gmail.com',
    'sir@gmail.com'
  ];

  // 1. Fetch all candidates
  const { data: candidates, error: candErr } = await supabase.from('candidates').select('*');
  if (candErr) throw candErr;

  const testCandidates = candidates.filter(c => 
    !realUserEmails.includes(c.email?.toLowerCase()) &&
    c.email !== 'demo.test.candidate@interviewx.local'
  );

  console.log(`Found ${candidates.length} total candidates. ${testCandidates.length} test candidates to clean up.`);

  const testCandIds = testCandidates.map(c => c.id);

  if (testCandIds.length > 0) {
    // Clean up reports for test candidates
    await supabase.from('reports').delete().in('candidate_id', testCandIds);
    // Clean up answers for test candidates
    await supabase.from('answers').delete().in('candidate_id', testCandIds);
    // Clean up resumes for test candidates
    await supabase.from('resumes').delete().in('candidate_id', testCandIds);
    // Delete test candidates
    await supabase.from('candidates').delete().in('id', testCandIds);
  }

  // 2. Fetch and clean up test interviews
  const { data: interviews } = await supabase.from('interviews').select('*');
  const testInterviews = (interviews || []).filter(i => 
    i.title.includes('1787') || 
    i.title.includes('E2E') || 
    i.title.includes('test') ||
    i.title.includes('Screening') ||
    i.title.includes('Principal Cloud Systems Live Interview') ||
    i.title.includes('Senior Distributed Systems Engineer (Async)') ||
    i.title.includes('aa') ||
    i.title.includes('nee')
  );

  const testIntIds = testInterviews.map(i => i.id);
  if (testIntIds.length > 0) {
    await supabase.from('questions').delete().in('interview_id', testIntIds);
    await supabase.from('reports').delete().in('interview_id', testIntIds);
    await supabase.from('answers').delete().in('interview_id', testIntIds);
    await supabase.from('interviews').delete().in('id', testIntIds);
    console.log(`Cleaned up ${testIntIds.length} obsolete test interviews and linked questions.`);
  }

  // 3. Clean up test jobs
  const { data: jobs } = await supabase.from('jobs').select('*');
  const testJobs = (jobs || []).filter(j => j.title.includes('Principal Cloud Platform Engineer'));
  if (testJobs.length > 0) {
    await supabase.from('jobs').delete().in('id', testJobs.map(j => j.id));
    console.log(`Cleaned up ${testJobs.length} obsolete test jobs.`);
  }

  // 4. Ensure EXACTLY ONE clearly marked test/demo dataset exists
  const { data: existingDemo } = await supabase
    .from('candidates')
    .select('*')
    .eq('email', 'demo.test.candidate@interviewx.local')
    .maybeSingle();

  if (!existingDemo) {
    console.log('Creating ONE authoritative, clearly marked DEMO test dataset...');
    
    // Create Demo Job
    const { data: demoJob } = await supabase.from('jobs').insert({
      title: 'DEMO Job — Senior Platform Engineer (DO NOT USE FOR PRODUCTION)',
      department: 'Core Infrastructure (DEMO)',
      description: 'Controlled test fixture for InterviewX AI evaluation validation.',
      status: 'Active'
    }).select().single();

    // Create Demo Candidate
    const { data: newDemoCand } = await supabase.from('candidates').insert({
      name: 'DEMO TEST CANDIDATE — DO NOT USE FOR PRODUCTION',
      email: 'demo.test.candidate@interviewx.local',
      role: 'Staff Systems Architect (DEMO)',
      status: 'Completed',
      overall_score: 88,
      recommendation: 'HIRE',
      skills: ['Distributed Systems', 'Node.js', 'WebSockets', 'Supabase', 'Architecture']
    }).select().single();

    const demoCandidateId = newDemoCand.id;

    // Create Demo Interview
    const { data: demoInt } = await supabase.from('interviews').insert({
      title: 'DEMO Interview — Real-Time AI Systems Evaluation (DO NOT USE FOR PRODUCTION)',
      type: 'live',
      status: 'Completed',
      candidate_id: demoCandidateId,
      job_id: demoJob?.id,
      duration: 30
    }).select().single();

    // Link interview back to candidate
    await supabase.from('candidates').update({ interview_id: demoInt.id }).eq('id', demoCandidateId);

    // Create Demo Questions
    const { data: demoQ1 } = await supabase.from('questions').insert({
      interview_id: demoInt.id,
      text: 'How do you design a real-time WebSocket state synchronization engine with reconnect buffering?',
      category: 'System Architecture',
      duration: 180,
      time_limit: 180,
      difficulty: 'Hard',
      question_order: 1
    }).select().single();

    const { data: demoQ2 } = await supabase.from('questions').insert({
      interview_id: demoInt.id,
      text: 'Explain idempotency strategies for handling distributed payment webhooks.',
      category: 'Backend Engineering',
      duration: 180,
      time_limit: 180,
      difficulty: 'Medium',
      question_order: 2
    }).select().single();

    const ans1Text = 'We use WebSocket heartbeat timers, message queues with idempotency keys, and reconnect grace period caches.';
    const ans2Text = 'We assign unique event UUIDs, store transaction states in Redis with TTLs, and use database unique constraints.';

    // Create Demo Answers
    await supabase.from('answers').insert({
      interview_id: demoInt.id,
      candidate_id: demoCandidateId,
      question_id: demoQ1.id,
      answer_text: ans1Text,
      transcript: ans1Text,
      score: 90,
      evaluation_status: 'completed'
    });

    await supabase.from('answers').insert({
      interview_id: demoInt.id,
      candidate_id: demoCandidateId,
      question_id: demoQ2.id,
      answer_text: ans2Text,
      transcript: ans2Text,
      score: 86,
      evaluation_status: 'completed'
    });

    // Create Demo Report
    await supabase.from('reports').insert({
      candidate_id: demoCandidateId,
      interview_id: demoInt.id,
      overall_score: 88,
      technical_score: 90,
      problem_solving_score: 88,
      communication_score: 86,
      confidence_score: 88,
      recommendation: 'HIRE',
      summary: 'Candidate demonstrated strong mastery of distributed real-time systems, caching layers, and idempotency guarantees.',
      strengths: ['Clear explanation of WebSocket buffering', 'Strong grasp of distributed consensus & idempotency'],
      weaknesses: ['Could elaborate further on backpressure mitigation under heavy burst loads'],
      question_analysis: [
        {
          questionId: demoQ1.id,
          text: demoQ1.text,
          category: 'System Architecture',
          score: 90,
          answerText: ans1Text,
          feedback: 'Accurate architectural approach utilizing message queues and deduplication caches.'
        },
        {
          questionId: demoQ2.id,
          text: demoQ2.text,
          category: 'Backend Engineering',
          score: 86,
          answerText: ans2Text,
          feedback: 'Solid implementation strategy for transaction atomicity and idempotency keys.'
        }
      ]
    });

    console.log('✓ Authoritative DEMO dataset created successfully.');
  } else {
    console.log('✓ DEMO dataset already exists and is isolated.');
  }

  console.log('=== DATABASE CLEANUP COMPLETED SUCCESSFULLY ===');
}

cleanupAndEstablishSingleDemoDataset().then(() => process.exit(0)).catch(e => {
  console.error('FAILED:', e);
  process.exit(1);
});
