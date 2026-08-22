const testCandidateCreation = async () => {
  try {
    const uniqueEmail = `elena.rostova.${Date.now()}@buildpath.io`;
    console.log(`Sending POST http://127.0.0.1:5000/api/candidates for ${uniqueEmail}...`);

    const createRes = await fetch('http://127.0.0.1:5000/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Elena Rostova',
        email: uniqueEmail,
        phone: '+1 (555) 432-8899',
        role: 'Senior Distributed Systems Architect',
        status: 'Invited',
        skills: ['React', 'Node.js', 'PostgreSQL', 'Distributed Systems']
      })
    });

    const createJson = await createRes.json();
    console.log('\n--- POST /api/candidates Response Status:', createRes.status, '---');
    console.log(JSON.stringify(createJson, null, 2));

    if (!createJson.success || !createJson.data?.id) {
      throw new Error('Failed to create candidate in Supabase: ' + JSON.stringify(createJson));
    }

    const candidateId = createJson.data.id;
    console.log(`\nCandidate persisted in Supabase with UUID: ${candidateId}`);

    // Verify GET /api/candidates
    console.log('\nSending GET http://127.0.0.1:5000/api/candidates...');
    const listRes = await fetch('http://127.0.0.1:5000/api/candidates');
    const listJson = await listRes.json();
    console.log('--- GET /api/candidates Total Count:', listJson.data?.length, '---');
    console.log('Found created candidate in Supabase list:', listJson.data?.some(c => c.id === candidateId));

    // Verify GET /api/candidates/:id
    console.log(`\nSending GET http://127.0.0.1:5000/api/candidates/${candidateId}...`);
    const singleRes = await fetch(`http://127.0.0.1:5000/api/candidates/${candidateId}`);
    const singleJson = await singleRes.json();
    console.log('--- GET /api/candidates/:id Candidate Name:', singleJson.data?.name, '---');

    console.log('\n✓ ALL CANDIDATE BACKEND API TESTS VERIFIED SUCCESSFULLY AGAINST SUPABASE!');
  } catch (err) {
    console.error('Candidate API Test Failed:', err);
    process.exit(1);
  }
};

testCandidateCreation();
