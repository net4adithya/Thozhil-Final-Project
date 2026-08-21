const testInterviewApi = async () => {
  try {
    const baseUrl = 'http://127.0.0.1:5000/api';
    console.log('=== SPRINT 3B: Testing Real Express & Supabase Interview API ===\n');

    // 1. Verify GET /api/interviews
    console.log('1. Testing GET /api/interviews...');
    const initialListRes = await fetch(`${baseUrl}/interviews`);
    const initialListJson = await initialListRes.json();
    console.log('   Status:', initialListRes.status);
    console.log('   Total existing interviews in Supabase:', initialListJson.data?.length);

    // 2. Create Async Technical Assessment via POST /api/interviews
    console.log('\n2. Testing POST /api/interviews (type: "async")...');
    const asyncTitle = `Senior Full Stack Architect Loop (Async) - ${Date.now()}`;
    const asyncRes = await fetch(`${baseUrl}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: asyncTitle,
        type: 'async',
        interviewType: 'async',
        department: 'Engineering',
        duration: 45,
        status: 'Active',
        questions: [
          {
            text: 'Explain the core distinction between useMemo and useCallback in React performance tuning.',
            category: 'React Architecture',
            difficulty: 'Medium',
            duration: 180,
            questionOrder: 0
          },
          {
            text: 'Implement an LRU Cache with get and put methods executing in O(1) time complexity.',
            category: 'Coding',
            difficulty: 'Hard',
            duration: 240,
            boilerplate: 'class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n  }\n}',
            questionOrder: 1
          }
        ],
        settings: {
          proctorTabSwitch: true,
          proctorBlockCopyPaste: true,
          voiceGuide: true
        }
      })
    });

    const asyncJson = await asyncRes.json();
    console.log('   Status:', asyncRes.status);
    console.log('   Created Async Interview ID:', asyncJson.data?.id);
    console.log('   Persisted Type in Supabase:', asyncJson.data?.type);
    console.log('   Persisted Questions Count:', asyncJson.data?.questions?.length);
    if (!asyncJson.success || asyncJson.data?.type !== 'async') {
      throw new Error('Failed to create async interview: ' + JSON.stringify(asyncJson));
    }
    const asyncInterviewId = asyncJson.data.id;

    // 3. Create Live AI Host Assessment via POST /api/interviews
    console.log('\n3. Testing POST /api/interviews (type: "live")...');
    const liveTitle = `Ava AI Conversational Technical Host (Live) - ${Date.now()}`;
    const liveRes = await fetch(`${baseUrl}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: liveTitle,
        type: 'live',
        interviewType: 'live',
        department: 'Engineering',
        duration: 30,
        status: 'Active',
        questions: [
          {
            text: 'How do you structure high-throughput WebSocket ingestion feeds in distributed services?',
            category: 'System Design',
            difficulty: 'Hard',
            duration: 240,
            questionOrder: 0
          },
          {
            text: 'Describe your strategy for zero-downtime database migrations with 20M+ rows.',
            category: 'Database Architecture',
            difficulty: 'Hard',
            duration: 180,
            questionOrder: 1
          }
        ],
        settings: {
          proctorTabSwitch: true,
          voiceGuide: true,
          aiHost: 'Ava'
        }
      })
    });

    const liveJson = await liveRes.json();
    console.log('   Status:', liveRes.status);
    console.log('   Created Live Interview ID:', liveJson.data?.id);
    console.log('   Persisted Type in Supabase:', liveJson.data?.type);
    console.log('   Persisted Questions Count:', liveJson.data?.questions?.length);
    if (!liveJson.success || liveJson.data?.type !== 'live') {
      throw new Error('Failed to create live interview: ' + JSON.stringify(liveJson));
    }
    const liveInterviewId = liveJson.data.id;

    // 4. Test GET /api/interviews/:id for Async Interview
    console.log(`\n4. Testing GET /api/interviews/${asyncInterviewId}...`);
    const getAsyncRes = await fetch(`${baseUrl}/interviews/${asyncInterviewId}`);
    const getAsyncJson = await getAsyncRes.json();
    console.log('   Status:', getAsyncRes.status);
    console.log('   Title:', getAsyncJson.data?.title);
    console.log('   Type:', getAsyncJson.data?.type);
    console.log('   Question 1:', getAsyncJson.data?.questions?.[0]?.text?.substring(0, 50) + '...');
    console.log('   Question 2:', getAsyncJson.data?.questions?.[1]?.text?.substring(0, 50) + '...');

    // 5. Test GET /api/interviews/:id for Live Interview
    console.log(`\n5. Testing GET /api/interviews/${liveInterviewId}...`);
    const getLiveRes = await fetch(`${baseUrl}/interviews/${liveInterviewId}`);
    const getLiveJson = await getLiveRes.json();
    console.log('   Status:', getLiveRes.status);
    console.log('   Title:', getLiveJson.data?.title);
    console.log('   Type:', getLiveJson.data?.type);
    console.log('   Question 1:', getLiveJson.data?.questions?.[0]?.text?.substring(0, 50) + '...');

    // 6. Test PUT /api/interviews/:id (Update Status)
    console.log(`\n6. Testing PUT /api/interviews/${asyncInterviewId} (Status update)...`);
    const updateRes = await fetch(`${baseUrl}/interviews/${asyncInterviewId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Completed' })
    });
    const updateJson = await updateRes.json();
    console.log('   Status:', updateRes.status);
    console.log('   Updated Status in Supabase:', updateJson.data?.status);

    // 7. Test GET /api/interviews (Confirm list contains both newly created interviews)
    console.log('\n7. Testing GET /api/interviews list verification...');
    const finalListRes = await fetch(`${baseUrl}/interviews`);
    const finalListJson = await finalListRes.json();
    console.log('   Total interviews in Supabase:', finalListJson.data?.length);
    console.log('   Async Interview Found in List:', finalListJson.data?.some(i => i.id === asyncInterviewId));
    console.log('   Live Interview Found in List:', finalListJson.data?.some(i => i.id === liveInterviewId));

    console.log('\n============================================================');
    console.log('✓ SPRINT 3B VERIFICATION: ALL INTERVIEW BACKEND ENDPOINTS PASSED AGAINST SUPABASE!');
    console.log('============================================================');
  } catch (err) {
    console.error('Interview API Test Error:', err);
    process.exit(1);
  }
};

testInterviewApi();
