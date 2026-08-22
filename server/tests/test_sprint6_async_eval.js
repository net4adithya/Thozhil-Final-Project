const testAsyncInterviewEvaluation = async () => {
  try {
    const baseUrl = 'http://127.0.0.1:5000/api';
    console.log('=== SPRINT 6: Testing Async Interview AI Evaluation Engine ===\n');

    // 1. Provision Candidate and Multi-Question Async Interview
    console.log('1. Provisioning test candidate and multi-question async interview...');
    const candEmail = `samuel.vance.${Date.now()}@buildpath.io`;
    const candRes = await fetch(`${baseUrl}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Samuel Vance',
        email: candEmail,
        role: 'Senior Distributed Systems Engineer',
        status: 'Invited'
      })
    });
    const candJson = await candRes.json();
    const candidateId = candJson.data.id;
    console.log('   Candidate UUID:', candidateId);

    const intRes = await fetch(`${baseUrl}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Distributed Systems Async Assessment - ${Date.now()}`,
        type: 'async',
        duration: 45,
        status: 'Active',
        candidate: candidateId,
        questions: [
          {
            text: 'How do you prevent split-brain scenarios in distributed consensus algorithms like Raft?',
            category: 'System Architecture',
            difficulty: 'Hard',
            duration: 180,
            questionOrder: 0
          },
          {
            text: 'Implement a concurrent rate-limiter using token bucket algorithm in JavaScript.',
            category: 'Coding',
            difficulty: 'Medium',
            duration: 240,
            type: 'code',
            questionOrder: 1
          },
          {
            text: 'Describe a situation where you resolved a critical production incident under high pressure.',
            category: 'Behavioral',
            difficulty: 'Medium',
            duration: 180,
            questionOrder: 2
          }
        ]
      })
    });
    const intJson = await intRes.json();
    const interviewId = intJson.data.id;
    console.log('   Interview UUID:', interviewId);

    // Fetch questions to get UUIDs
    const qListRes = await fetch(`${baseUrl}/interviews/${interviewId}/questions`);
    const qListJson = await qListRes.json();
    const questions = qListJson.data;
    console.log(`   Retrieved ${questions.length} questions for assessment.`);

    // 2. Submit Answers for all 3 questions
    console.log('\n2. Submitting Candidate Answers for all 3 questions...');
    
    // Q1: Strong Architecture Answer
    const ans1Res = await fetch(`${baseUrl}/interviews/${interviewId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        questionId: questions[0].id,
        answerText: 'In Raft, split-brain is prevented by requiring a strict majority quorum (N/2 + 1) for leader election and log commitment. A leader cannot commit an entry without replication to a quorum, ensuring two valid leaders can never commit conflicting logs simultaneously.',
        duration: 110,
        status: 'Completed'
      })
    });
    const ans1Json = await ans1Res.json();
    console.log('   Answer 1 Submitted (Architecture) UUID:', ans1Json.data?.id);

    // Q2: Coding Answer (Token Bucket)
    const ans2Res = await fetch(`${baseUrl}/interviews/${interviewId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        questionId: questions[1].id,
        answerText: 'Token bucket rate limiter calculates time elapsed since last request, refilling tokens up to capacity before deducting 1 token per admitted request.',
        code: 'class TokenBucket {\n  constructor(capacity, refillRate) {\n    this.capacity = capacity;\n    this.tokens = capacity;\n    this.refillRate = refillRate;\n    this.lastRefill = Date.now();\n  }\n  allow() {\n    const now = Date.now();\n    const elapsed = (now - this.lastRefill) / 1000;\n    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);\n    this.lastRefill = now;\n    if (this.tokens >= 1) {\n      this.tokens -= 1;\n      return true;\n    }\n    return false;\n  }\n}',
        language: 'javascript',
        status: 'Accepted',
        duration: 175
      })
    });
    const ans2Json = await ans2Res.json();
    console.log('   Answer 2 Submitted (Coding) UUID:', ans2Json.data?.id);

    // Q3: Behavioral Answer
    const ans3Res = await fetch(`${baseUrl}/interviews/${interviewId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        questionId: questions[2].id,
        answerText: 'During a Black Friday spike, our Redis cluster reached connection limits causing API degradation. I coordinated an emergency bridge, identified connection leakage in worker pods, safely rolled out pooled connections, and restored 100% health in 14 minutes.',
        duration: 130,
        status: 'Completed'
      })
    });
    const ans3Json = await ans3Res.json();
    console.log('   Answer 3 Submitted (Behavioral) UUID:', ans3Json.data?.id);

    // 3. Trigger Async Interview AI Evaluation
    console.log(`\n3. Triggering POST /api/interviews/${interviewId}/evaluate...`);
    const evalRes = await fetch(`${baseUrl}/interviews/${interviewId}/evaluate`, {
      method: 'POST'
    });
    const evalJson = await evalRes.json();
    console.log('   Evaluation Status:', evalRes.status);
    console.log('   Report UUID in Supabase:', evalJson.data?.id);
    console.log('   Overall Evaluation Score:', evalJson.data?.overallScore);
    console.log('   Technical Score:', evalJson.data?.technicalScore);
    console.log('   Problem Solving Score:', evalJson.data?.problemSolvingScore);
    console.log('   Communication Score:', evalJson.data?.communicationScore);
    console.log('   Recommendation:', evalJson.data?.recommendation);
    console.log('   Question Analyses Count:', evalJson.data?.questionAnalysis?.length);
    console.log('   Strengths:', evalJson.data?.strengths);
    console.log('   Executive Summary:\n   ', evalJson.data?.summary);

    if (!evalJson.data?.overallScore || evalJson.data.overallScore < 70) {
      throw new Error('Expected overallScore >= 70 for strong responses');
    }

    // 4. Test Report Retrieval via GET /api/reports/interview/:interviewId
    console.log(`\n4. Testing GET /api/reports/interview/${interviewId}...`);
    const getReportRes = await fetch(`${baseUrl}/reports/interview/${interviewId}`);
    const getReportJson = await getReportRes.json();
    console.log('   Report Status:', getReportRes.status);
    console.log('   Candidate Name in Report:', getReportJson.data?.candidate?.name);
    console.log('   Candidate Overall Score:', getReportJson.data?.overallScore);

    // 5. Test Candidate Record in Supabase
    console.log(`\n5. Verifying Candidate record in Supabase (GET /api/candidates/${candidateId})...`);
    const getCandRes = await fetch(`${baseUrl}/candidates/${candidateId}`);
    const getCandJson = await getCandRes.json();
    console.log('   Candidate Status in Supabase:', getCandJson.data?.status);
    console.log('   Candidate Overall Score in Supabase:', getCandJson.data?.overallScore);
    console.log('   Candidate Recommendation in Supabase:', getCandJson.data?.recommendation);

    console.log('\n============================================================');
    console.log('✓ SPRINT 6 VERIFICATION: ASYNC INTERVIEW AI EVALUATION ENGINE FULLY VERIFIED!');
    console.log('============================================================');
  } catch (err) {
    console.error('Async Evaluation Test Failed:', err);
    process.exit(1);
  }
};

testAsyncInterviewEvaluation();
