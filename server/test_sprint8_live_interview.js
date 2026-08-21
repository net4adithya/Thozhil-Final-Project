const testLiveInterviewEngine = async () => {
  try {
    const baseUrl = 'http://127.0.0.1:5000/api';
    console.log('=== SPRINT 8: Testing Live AI Interview Engine ===\n');

    // 1. Provision Candidate & Live Interview track
    console.log('1. Provisioning candidate and live interview...');
    const candEmail = `jordan.hayes.${Date.now()}@nexustech.io`;
    const candRes = await fetch(`${baseUrl}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Hayes',
        email: candEmail,
        role: 'Senior Full Stack Cloud Engineer',
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
        title: `Live Cloud Engineer Assessment - ${Date.now()}`,
        type: 'live',
        duration: 30,
        status: 'Active',
        candidate: candidateId,
        questions: [
          {
            text: 'How do you design a high-throughput caching tier using Redis in front of PostgreSQL?',
            category: 'System Design',
            difficulty: 'Hard',
            duration: 180,
            questionOrder: 0
          },
          {
            text: 'How do you handle zero-downtime database migrations in a production microservices environment?',
            category: 'Database Architecture',
            difficulty: 'Hard',
            duration: 180,
            questionOrder: 1
          }
        ]
      })
    });
    const intJson = await intRes.json();
    const interviewId = intJson.data.id;
    console.log('   Interview UUID:', interviewId);

    // 2. Initialize Live Session
    console.log(`\n2. Initializing Live Session via POST /api/interviews/${interviewId}/live/init...`);
    const initRes = await fetch(`${baseUrl}/interviews/${interviewId}/live/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId })
    });
    const initJson = await initRes.json();
    console.log('   Init Status:', initRes.status);
    console.log('   Session ID:', initJson.data?.sessionId);
    console.log('   Intro Phrase:\n   ', initJson.data?.introPhrase);
    console.log('   First Question:', initJson.data?.currentQuestion?.text);

    if (initRes.status !== 200 || !initJson.data?.introPhrase) {
      throw new Error('Live session initialization failed');
    }

    const q1 = initJson.data.currentQuestion;

    // 3. Live Turn 1: Candidate responds to Q1 -> triggers controlled follow-up
    console.log('\n3. Processing Live Turn 1 (Q1 Response -> Expect FOLLOW_UP)...');
    const turn1Res = await fetch(`${baseUrl}/interviews/${interviewId}/live/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        questionId: q1.id,
        transcript: 'We place Redis clusters with write-around caching for read-heavy entities, and use cache-aside patterns with strict TTLs and Redis pub/sub for invalidation.',
        answerText: 'We place Redis clusters with write-around caching for read-heavy entities, and use cache-aside patterns with strict TTLs and Redis pub/sub for invalidation.',
        duration: 45,
        followUpCount: 0,
        isFollowUp: false,
        currentQuestionIndex: 0
      })
    });
    const turn1Json = await turn1Res.json();
    console.log('   Turn 1 Status:', turn1Res.status);
    console.log('   Turn 1 Next Action:', turn1Json.data?.nextAction);
    console.log('   Turn 1 Follow-up Question:\n   ', turn1Json.data?.followUpQuestion?.text);
    console.log('   Turn 1 Score:', turn1Json.data?.evaluation?.score);

    if (turn1Json.data?.nextAction !== 'FOLLOW_UP') {
      throw new Error(`Expected FOLLOW_UP nextAction, received: ${turn1Json.data?.nextAction}`);
    }

    // 4. Live Turn 2: Candidate responds to Follow-up question -> triggers NEXT_QUESTION (Q2)
    console.log('\n4. Processing Live Turn 2 (Follow-up 1 Response -> Expect NEXT_QUESTION)...');
    const turn2Res = await fetch(`${baseUrl}/interviews/${interviewId}/live/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        questionId: q1.id,
        transcript: 'To handle cache invalidation during high-volume spikes, we apply distributed locking using Redlock and atomic Lua scripts to prevent cache stampedes and dogpiling.',
        answerText: 'To handle cache invalidation during high-volume spikes, we apply distributed locking using Redlock and atomic Lua scripts to prevent cache stampedes and dogpiling.',
        duration: 50,
        followUpCount: 1,
        isFollowUp: true,
        currentQuestionIndex: 0
      })
    });
    const turn2Json = await turn2Res.json();
    console.log('   Turn 2 Status:', turn2Res.status);
    console.log('   Turn 2 Next Action:', turn2Json.data?.nextAction);
    console.log('   Turn 2 Next Question:', turn2Json.data?.nextQuestion?.text);
    console.log('   Turn 2 Score:', turn2Json.data?.evaluation?.score);

    if (turn2Json.data?.nextAction !== 'NEXT_QUESTION') {
      throw new Error(`Expected NEXT_QUESTION nextAction, received: ${turn2Json.data?.nextAction}`);
    }

    const q2 = turn2Json.data.nextQuestion;

    // 5. Live Turn 3: Candidate responds to Q2 -> triggers controlled follow-up for Q2
    console.log('\n5. Processing Live Turn 3 (Q2 Response -> Expect FOLLOW_UP)...');
    const turn3Res = await fetch(`${baseUrl}/interviews/${interviewId}/live/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        questionId: q2.id,
        transcript: 'For zero-downtime schema migrations, we adopt the expand and contract pattern: first add new columns or tables in a backwards-compatible manner, deploy dual-write code, backfill existing data asynchronously, switch read traffic, and finally deprecate and drop legacy fields.',
        answerText: 'For zero-downtime schema migrations, we adopt the expand and contract pattern: first add new columns or tables in a backwards-compatible manner, deploy dual-write code, backfill existing data asynchronously, switch read traffic, and finally deprecate and drop legacy fields.',
        duration: 65,
        followUpCount: 0,
        isFollowUp: false,
        currentQuestionIndex: 1
      })
    });
    const turn3Json = await turn3Res.json();
    console.log('   Turn 3 Status:', turn3Res.status);
    console.log('   Turn 3 Next Action:', turn3Json.data?.nextAction);
    console.log('   Turn 3 Follow-up Question:\n   ', turn3Json.data?.followUpQuestion?.text);
    console.log('   Turn 3 Score:', turn3Json.data?.evaluation?.score);

    if (turn3Json.data?.nextAction !== 'FOLLOW_UP') {
      throw new Error(`Expected FOLLOW_UP nextAction, received: ${turn3Json.data?.nextAction}`);
    }

    // 6. Live Turn 4: Candidate responds to Follow-up 2 -> all questions complete -> Expect COMPLETE
    console.log('\n6. Processing Live Turn 4 (Follow-up 2 Response -> Expect COMPLETE)...');
    const turn4Res = await fetch(`${baseUrl}/interviews/${interviewId}/live/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId,
        questionId: q2.id,
        transcript: 'We handle database rollback strategy by guaranteeing non-breaking backward compatibility across multiple microservice versions and using database feature flags.',
        answerText: 'We handle database rollback strategy by guaranteeing non-breaking backward compatibility across multiple microservice versions and using database feature flags.',
        duration: 55,
        followUpCount: 1,
        isFollowUp: true,
        currentQuestionIndex: 1
      })
    });
    const turn4Json = await turn4Res.json();
    console.log('   Turn 4 Status:', turn4Res.status);
    console.log('   Turn 4 Next Action:', turn4Json.data?.nextAction);
    console.log('   Turn 4 Score:', turn4Json.data?.evaluation?.score);

    if (turn4Json.data?.nextAction !== 'COMPLETE') {
      throw new Error(`Expected COMPLETE nextAction, received: ${turn4Json.data?.nextAction}`);
    }

    // 7. Complete Live Session
    console.log(`\n7. Completing Live Session via POST /api/interviews/${interviewId}/live/complete...`);
    const compRes = await fetch(`${baseUrl}/interviews/${interviewId}/live/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId })
    });
    const compJson = await compRes.json();
    console.log('   Complete Status:', compRes.status);
    console.log('   Final Report Overall Score:', compJson.data?.report?.overallScore);
    console.log('   Final Report Recommendation:', compJson.data?.report?.recommendation);

    // 8. Verify Supabase Persistence
    console.log('\n8. Verifying Supabase Database Persistence...');
    
    // Answers Table
    const ansListRes = await fetch(`${baseUrl}/interviews/${interviewId}/answers`);
    const ansListJson = await ansListRes.json();
    console.log(`   Persisted Answers Count in Supabase: ${ansListJson.data?.length} (Expected >= 4)`);
    if (!ansListJson.data || ansListJson.data.length < 4) {
      throw new Error('Expected at least 4 persisted answers in Supabase');
    }

    // Candidate Record
    const getCandRes = await fetch(`${baseUrl}/candidates/${candidateId}`);
    const getCandJson = await getCandRes.json();
    console.log('   Candidate Status in Supabase:', getCandJson.data?.status);
    console.log('   Candidate Overall Score in Supabase:', getCandJson.data?.overallScore);

    // Report Record
    const getRepRes = await fetch(`${baseUrl}/reports/interview/${interviewId}`);
    const getRepJson = await getRepRes.json();
    console.log('   Report Overall Score in Supabase:', getRepJson.data?.overallScore);
    console.log('   Report Candidate Name in Supabase:', getRepJson.data?.candidate?.name);

    console.log('\n============================================================');
    console.log('✓ SPRINT 8 VERIFICATION: LIVE AI INTERVIEW ENGINE FULLY VERIFIED!');
    console.log('============================================================');
  } catch (err) {
    console.error('Sprint 8 Live Interview Test Failed:', err);
    process.exit(1);
  }
};

testLiveInterviewEngine();
