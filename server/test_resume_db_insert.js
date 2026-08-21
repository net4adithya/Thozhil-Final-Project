import supabase from './src/config/supabase.js';

const testResumeDbInsert = async () => {
  try {
    const baseUrl = 'http://127.0.0.1:5000/api';
    console.log('=== VERIFYING RESUME DATABASE INSERT PIPELINE ===\n');

    // 1. Provision a new Candidate
    console.log('1. Creating brand new candidate in public.candidates...');
    const candEmail = `resume.test.${Date.now()}@buildpath.io`;
    const candRes = await fetch(`${baseUrl}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Elena Rostova',
        email: candEmail,
        role: 'Senior Staff Platform Engineer',
        status: 'Invited'
      })
    });
    const candJson = await candRes.json();
    const candidateId = candJson.data?.id;
    console.log('   Candidate ID (UUID):', candidateId);

    if (!candidateId) {
      throw new Error('Candidate creation failed');
    }

    // 2. Prepare sample PDF resume file
    const sampleFileName = 'Test_Resume_DB_Insert.pdf';
    const samplePdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF');

    const boundary = `----WebKitFormBoundary${Date.now().toString(16)}`;
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="candidateId"\r\n\r\n`;
    body += `${candidateId}\r\n`;

    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${sampleFileName}"\r\n`;
    body += `Content-Type: application/pdf\r\n\r\n`;

    const bodyHead = Buffer.from(body, 'utf-8');
    const bodyTail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    const fullBody = Buffer.concat([bodyHead, samplePdfBuffer, bodyTail]);

    console.log(`\n2. Uploading ${sampleFileName} to POST /api/resumes...`);
    const uploadRes = await fetch(`${baseUrl}/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: fullBody
    });

    const uploadJson = await uploadRes.json();
    console.log('   Upload Status:', uploadRes.status);
    console.log('   Upload Response Data:\n   ', JSON.stringify(uploadJson.data, null, 2));

    if (uploadRes.status !== 201) {
      throw new Error(`Upload failed with status ${uploadRes.status}: ${JSON.stringify(uploadJson)}`);
    }

    const resumeId = uploadJson.data?.id;
    console.log('   Returned Resume ID:', resumeId);

    // 3. Verify in Supabase Storage
    console.log('\n3. Verifying File Existence in Supabase Storage bucket "resumes"...');
    const { data: storageList, error: storageListErr } = await supabase.storage
      .from('resumes')
      .list(candidateId);

    if (storageListErr) {
      throw new Error(`Storage query failed: ${storageListErr.message}`);
    }
    console.log('   Storage files for candidate in bucket:', storageList.map(f => f.name));
    const matchingStorageFile = storageList.find(f => f.name.includes('Test_Resume_DB_Insert'));
    if (!matchingStorageFile) {
      throw new Error('Matching file not found in Supabase Storage');
    }
    console.log('   ✓ Storage Verification Passed! File exists:', matchingStorageFile.name);

    // 4. Verify in Supabase public.resumes table
    console.log('\n4. Verifying Row in public.resumes table...');
    const { data: dbRow, error: dbErr } = await supabase
      .from('resumes')
      .select('*')
      .eq('candidate_id', candidateId)
      .single();

    if (dbErr || !dbRow) {
      throw new Error(`public.resumes row not found or query error: ${dbErr?.message}`);
    }

    console.log('   ✓ Database Verification Passed! Row found in public.resumes:');
    console.log('     ID:', dbRow.id);
    console.log('     Candidate ID:', dbRow.candidate_id);
    console.log('     Original File Name:', dbRow.original_file_name);
    console.log('     Storage Path:', dbRow.storage_path);
    console.log('     File Type:', dbRow.file_type);
    console.log('     File Size:', dbRow.file_size);
    console.log('     Uploaded At:', dbRow.uploaded_at);

    if (dbRow.original_file_name !== sampleFileName) {
      throw new Error(`Mismatch in original_file_name: expected ${sampleFileName}, got ${dbRow.original_file_name}`);
    }

    console.log('\n============================================================');
    console.log('✓ FINAL VERIFICATION: RESUME DB INSERTION & STORAGE COMPLETE & VERIFIED!');
    console.log('============================================================');
  } catch (err) {
    console.error('Resume DB Insert Test Failed:', err);
    process.exit(1);
  }
};

testResumeDbInsert();
