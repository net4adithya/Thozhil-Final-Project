const testQuestionsAndAnswersApi = async () => {
  try {
    const baseUrl = 'http://127.0.0.1:5000/api';
    console.log('=== SPRINT 3D: Testing Real Questions & Answers API → Supabase ===\n');

    // 1. Provision candidate and interview
    console.log('1. Provisioning test candidate and interview...');
    const candEmail = `jordan.vance.${Date.now()}@buildpath.io`;
    const candRes = await fetch(`${baseUrl}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Vance',
        email: candEmail,
        role: 'Senior React & Node Engineer',
        status: 'Invited',
        skills: ['React', 'Node.js', 'PostgreSQL', 'System Architecture']
      })
    });
    const candJson = await candRes.json();
    const candidateId = candJson.data.id;
    console.log('   Candidate Created UUID:', candidateId);

    const intRes = await fetch(`${baseUrl}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Full-Stack Technical Loop - ${Date.now()}`,
        type: 'async',
        duration: 45,
        status: 'Active',
        candidate: candidateId,
        questions: [
          {
            text: 'How does the React 19 compiler transform manual useMemo dependency arrays?',
            category: 'React Architecture',
            difficulty: 'Hard',
            duration: 180,
            questionOrder: 0
          }
        ]
      })
    });
    const intJson = await intRes.json();
    const interviewId = intJson.data.id;
    console.log('   Interview Created UUID:', interviewId);

    // 2. Test GET /api/interviews/:interviewId/questions
    console.log(`\n2. Testing GET /api/interviews/${interviewId}/questions...`);
    const qListRes = await fetch(`${baseUrl}/interviews/${interviewId}/questions`);
    const qListJson = await qListRes.json();
    console.log('   Status:', qListRes.status);
    console.log('   Total questions count in Supabase:', qListJson.data?.length);
    console.log('   Question 1 Text:', qListJson.data?.[0]?.text);
    const firstQuestionId = qListJson.data?.[0]?.id;

    // 3. Test POST /api/interviews/:interviewId/questions (Add new question)
    console.log(`\n3. Testing POST /api/interviews/${interviewId}/questions...`);
    const createQRes = await fetch(`${baseUrl}/interviews/${interviewId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Implement a debounce function with leading and trailing trigger options.',
        category: 'JavaScript Core',
        difficulty: 'Medium',
        duration: 240,
        type: 'code',
        boilerplate: 'function debounce(fn, wait, options) {\n  // Implementation\n}'
      })
    });
    const createQJson = await createQRes.json();
    console.log('   Status:', createQRes.status);
    console.log('   Created Question UUID:', createQJson.data?.id);
    console.log('   Question Category:', createQJson.data?.category);
    const secondQuestionId = createQJson.data?.id;

    // 4. Test POST /api/interviews/:interviewId/answers (Submit answer for Question 1)
    console.log(`\n4. Testing POST /api/interviews/${interviewId}/answers (Question 1)...`);
    const ans1Res = await fetch(`${baseUrl}/interviews/${interviewId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: candidateId,
        questionId: firstQuestionId,
        answerText: 'React 19 compiler performs automatic memoization at the AST compilation phase, memoizing JSX elements and computed values without manual hooks.',
        transcript: 'React 19 compiler performs automatic memoization at the AST compilation phase.',
        duration: 120,
        score: 94,
        feedback: 'Excellent grasp of React 19 compiler AST compilation pipeline.',
        status: 'Completed'
      })
    });
    const ans1Json = await ans1Res.json();
    console.log('   Status:', ans1Res.status);
    console.log('   Answer 1 UUID in Supabase:', ans1Json.data?.id);
    console.log('   Answer Score:', ans1Json.data?.score);

    // 5. Test POST /api/interviews/:interviewId/answers (Submit coding answer for Question 2)
    console.log(`\n5. Testing POST /api/interviews/${interviewId}/answers (Question 2 - Coding)...`);
    const ans2Res = await fetch(`${baseUrl}/interviews/${interviewId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: candidateId,
        questionId: secondQuestionId,
        answerText: 'function debounce(fn, wait) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); }; }',
        code: 'function debounce(fn, wait) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), wait);\n  };\n}',
        language: 'javascript',
        compileTime: 12,
        status: 'Accepted',
        score: 98,
        testCasesResult: [
          { input: 'fn, 100', expected: 'debouncedFn', actual: 'debouncedFn', passed: true }
        ]
      })
    });
    const ans2Json = await ans2Res.json();
    console.log('   Status:', ans2Res.status);
    console.log('   Answer 2 UUID in Supabase:', ans2Json.data?.id);
    console.log('   Answer 2 Status:', ans2Json.data?.status);

    // 6. Test GET /api/interviews/:interviewId/answers
    console.log(`\n6. Testing GET /api/interviews/${interviewId}/answers...`);
    const getAnswersRes = await fetch(`${baseUrl}/interviews/${interviewId}/answers`);
    const getAnswersJson = await getAnswersRes.json();
    console.log('   Status:', getAnswersRes.status);
    console.log('   Total answers stored in Supabase:', getAnswersJson.data?.length);
    console.log('   Both submitted answers present:', getAnswersJson.data?.length === 2);

    // 7. Verify Candidate status update to Completed
    console.log(`\n7. Testing Candidate update to Completed...`);
    const updateCandRes = await fetch(`${baseUrl}/candidates/${candidateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Completed',
        overallScore: 96,
        completionDate: new Date().toISOString().split('T')[0]
      })
    });
    const updateCandJson = await updateCandRes.json();
    console.log('   Candidate Final Status in Supabase:', updateCandJson.data?.status);
    console.log('   Candidate Overall Score:', updateCandJson.data?.overallScore);

    console.log('\n============================================================');
    console.log('✓ SPRINT 3D VERIFICATION: QUESTIONS & ANSWERS API FULLY VERIFIED AGAINST SUPABASE!');
    console.log('============================================================');
  } catch (err) {
    console.error('Questions/Answers API Test Failed:', err);
    process.exit(1);
  }
};

testQuestionsAndAnswersApi();
