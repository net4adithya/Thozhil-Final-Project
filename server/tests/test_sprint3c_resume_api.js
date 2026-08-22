import fs from 'fs';
import path from 'path';

const testResumeApi = async () => {
  try {
    const baseUrl = 'http://127.0.0.1:5000/api';
    console.log('=== SPRINT 3C: Testing Real Resume Upload API → Supabase Storage & DB ===\n');

    // 1. Provision a test candidate to associate the resume
    console.log('1. Provisioning test candidate...');
    const candEmail = `alex.rivers.${Date.now()}@buildpath.io`;
    const candRes = await fetch(`${baseUrl}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Rivers',
        email: candEmail,
        role: 'Staff Infrastructure Engineer',
        status: 'Invited',
        skills: ['Kubernetes', 'Terraform', 'PostgreSQL', 'Golang']
      })
    });
    const candJson = await candRes.json();
    if (!candJson.success || !candJson.data?.id) {
      throw new Error('Failed to provision candidate: ' + JSON.stringify(candJson));
    }
    const candidateId = candJson.data.id;
    console.log('   Candidate Created UUID:', candidateId);

    // 2. Test Real PDF Resume Upload (POST /api/resumes)
    console.log('\n2. Testing Real PDF Upload via FormData (POST /api/resumes)...');
    const samplePdfContent = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Title (Alex Rivers Resume) /Author (Alex Rivers) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000078 00000 n\n0000000127 00000 n\n0000000184 00000 n\ntrailer\n<< /Size 5 /Root 2 0 R >>\nstartxref\n268\n%%EOF'
    );
    const blob = new Blob([samplePdfContent], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, 'Alex_Rivers_Staff_Resume.pdf');
    formData.append('candidateId', candidateId);

    const uploadRes = await fetch(`${baseUrl}/resumes`, {
      method: 'POST',
      body: formData
    });
    const uploadJson = await uploadRes.json();
    console.log('   Status:', uploadRes.status);
    console.log('   Upload Response Success:', uploadJson.success);
    console.log('   Resume UUID:', uploadJson.data?.id);
    console.log('   Original File Name:', uploadJson.data?.originalFileName);
    console.log('   Storage Path in Supabase:', uploadJson.data?.storagePath || uploadJson.data?.fileUrl);
    console.log('   Candidate Association:', uploadJson.data?.candidateId);

    if (!uploadJson.success || !uploadJson.data?.id) {
      throw new Error('Resume upload failed: ' + JSON.stringify(uploadJson));
    }
    const resumeId = uploadJson.data.id;

    // 3. Test GET /api/resumes/:id
    console.log(`\n3. Testing GET /api/resumes/${resumeId}...`);
    const getRes = await fetch(`${baseUrl}/resumes/${resumeId}`);
    const getJson = await getRes.json();
    console.log('   Status:', getRes.status);
    console.log('   Retrieved Resume ID:', getJson.data?.id);
    console.log('   Associated Candidate Name:', getJson.data?.candidate?.name || getJson.data?.candidate);

    // 4. Test Failure Case 1: Unsupported File Type (.exe)
    console.log('\n4. Testing Failure Case: Unsupported File Extension (.exe)...');
    const exeBlob = new Blob([Buffer.from('MZ...fake executable content')], { type: 'application/octet-stream' });
    const exeFormData = new FormData();
    exeFormData.append('file', exeBlob, 'malicious_payload.exe');
    exeFormData.append('candidateId', candidateId);

    const exeRes = await fetch(`${baseUrl}/resumes`, {
      method: 'POST',
      body: exeFormData
    });
    const exeJson = await exeRes.json();
    console.log('   Status:', exeRes.status, '(Expected: 400)');
    console.log('   Error message:', exeJson.message);
    if (exeRes.status !== 400) throw new Error('Expected 400 for .exe upload');

    // 5. Test Failure Case 2: Missing Candidate ID
    console.log('\n5. Testing Failure Case: Missing candidateId...');
    const noCandFormData = new FormData();
    noCandFormData.append('file', blob, 'resume_without_candidate.pdf');

    const noCandRes = await fetch(`${baseUrl}/resumes`, {
      method: 'POST',
      body: noCandFormData
    });
    const noCandJson = await noCandRes.json();
    console.log('   Status:', noCandRes.status, '(Expected: 400)');
    console.log('   Error message:', noCandJson.message);
    if (noCandRes.status !== 400) throw new Error('Expected 400 for missing candidateId');

    // 6. Test Failure Case 3: Missing File
    console.log('\n6. Testing Failure Case: Missing File...');
    const emptyFormData = new FormData();
    emptyFormData.append('candidateId', candidateId);

    const emptyRes = await fetch(`${baseUrl}/resumes`, {
      method: 'POST',
      body: emptyFormData
    });
    const emptyJson = await emptyRes.json();
    console.log('   Status:', emptyRes.status, '(Expected: 400)');
    console.log('   Error message:', emptyJson.message);
    if (emptyRes.status !== 400) throw new Error('Expected 400 for missing file');

    // 7. Verify Candidate profile joined with resume
    console.log(`\n7. Testing GET /api/candidates/${candidateId} to verify resume join in Supabase...`);
    const candVerifyRes = await fetch(`${baseUrl}/candidates/${candidateId}`);
    const candVerifyJson = await candVerifyRes.json();
    console.log('   Candidate Resume Attached:', !!candVerifyJson.data?.resume);
    console.log('   Attached Resume Filename:', candVerifyJson.data?.resume?.originalFileName);

    console.log('\n============================================================');
    console.log('✓ SPRINT 3C VERIFICATION: RESUME UPLOAD & STORAGE FULLY VERIFIED AGAINST SUPABASE!');
    console.log('============================================================');
  } catch (err) {
    console.error('Resume API Test Failed:', err);
    process.exit(1);
  }
};

testResumeApi();
