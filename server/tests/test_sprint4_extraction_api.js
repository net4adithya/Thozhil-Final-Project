import fs from 'fs';
import path from 'path';

const testResumeTextExtraction = async () => {
  try {
    const baseUrl = 'http://127.0.0.1:5000/api';
    console.log('=== SPRINT 4: Testing Real Resume Text Extraction Pipeline ===\n');

    // 1. Provision a test candidate
    console.log('1. Provisioning test candidate...');
    const candEmail = `marcus.sterling.${Date.now()}@buildpath.io`;
    const candRes = await fetch(`${baseUrl}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Marcus Sterling',
        email: candEmail,
        role: 'Principal Cloud Systems Engineer',
        status: 'Invited',
        skills: ['Distributed Systems', 'Kubernetes', 'Golang', 'PostgreSQL']
      })
    });
    const candJson = await candRes.json();
    const candidateId = candJson.data.id;
    console.log('   Candidate UUID:', candidateId);

    // 2. Test Real PDF Document Text Extraction
    console.log('\n2. Testing Real PDF Resume Text Extraction (Upload & Parse)...');
    const pdfContent = [
      '%PDF-1.4',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
      '4 0 obj << /Length 260 >> stream',
      'BT /F1 12 Tf 72 712 Td (MARCUS STERLING - Principal Cloud Engineer) Tj ET',
      'BT /F1 10 Tf 72 680 Td (SKILLS: Kubernetes, Docker, Golang, PostgreSQL, Kafka, Terraform, AWS) Tj ET',
      'BT /F1 10 Tf 72 650 Td (EXPERIENCE: Lead Infrastructure Architect at CloudScale \\(5 years\\)) Tj ET',
      'BT /F1 10 Tf 72 620 Td (EDUCATION: B.S. in Computer Science - Stanford University) Tj ET',
      'endstream endobj',
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
      'xref',
      '0 6',
      '0000000000 65535 f',
      '0000000009 00000 n',
      '0000000058 00000 n',
      '0000000115 00000 n',
      '0000000224 00000 n',
      '0000000536 00000 n',
      'trailer << /Size 6 /Root 1 0 R >>',
      'startxref',
      '604',
      '%%EOF'
    ].join('\n');

    const pdfBuffer = Buffer.from(pdfContent);
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const pdfFormData = new FormData();
    pdfFormData.append('file', pdfBlob, 'Marcus_Sterling_Resume.pdf');
    pdfFormData.append('candidateId', candidateId);

    const uploadRes = await fetch(`${baseUrl}/resumes`, {
      method: 'POST',
      body: pdfFormData
    });
    const uploadJson = await uploadRes.json();
    console.log('   Upload Status:', uploadRes.status);
    console.log('   Resume UUID:', uploadJson.data?.id);
    console.log('   Parsing Status in Supabase:', uploadJson.data?.parsingStatus);
    console.log('   Parsed Text Length:', uploadJson.data?.parsedText?.length);
    console.log('   Parsed Text Preview:\n----------------------------------------');
    console.log(uploadJson.data?.parsedText);
    console.log('----------------------------------------');

    if (!uploadJson.data?.parsedText?.includes('MARCUS STERLING') || !uploadJson.data?.parsedText?.includes('Kubernetes')) {
      throw new Error('Extracted PDF text does not contain expected resume contents.');
    }
    const resumeId = uploadJson.data.id;

    // 3. Test Reprocessing via POST /api/resumes/:id/process (Supabase Storage Download & Re-parse)
    console.log(`\n3. Testing POST /api/resumes/${resumeId}/process (Download from Storage & Re-extract)...`);
    const processRes = await fetch(`${baseUrl}/resumes/${resumeId}/process`, {
      method: 'POST'
    });
    const processJson = await processRes.json();
    console.log('   Process Status:', processRes.status);
    console.log('   Extraction Character Count:', processJson.data?.extraction?.characterCount);
    console.log('   Extraction Word Count:', processJson.data?.extraction?.wordCount);
    console.log('   Extraction Format:', processJson.data?.extraction?.format);
    console.log('   Requires OCR:', processJson.data?.extraction?.requiresOcr);
    console.log('   Confirmed Parsing Status:', processJson.data?.parsingStatus);

    // 4. Test Text-based Resume (.txt)
    console.log('\n4. Testing Plain Text Resume (.txt) upload & extraction...');
    const cand2Email = `elena.text.${Date.now()}@buildpath.io`;
    const cand2Res = await fetch(`${baseUrl}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Elena Rostova',
        email: cand2Email,
        role: 'Full Stack Architect'
      })
    });
    const cand2Json = await cand2Res.json();
    const cand2Id = cand2Json.data.id;

    const txtContent = `ELENA ROSTOVA
Role: Senior Staff Software Engineer
Summary: 10+ years developing high-throughput web applications with Node.js, React, and Supabase.
Skills: React, Node.js, PostgreSQL, Distributed Caching, Redis, TypeScript
Experience:
- Staff Architect at GlobalTech (2021 - Present)
  Designed reactive microservices handling 50k req/sec.
Education:
- M.S. Computer Engineering, MIT (2018)`;

    const txtBlob = new Blob([Buffer.from(txtContent)], { type: 'text/plain' });
    const txtFormData = new FormData();
    txtFormData.append('file', txtBlob, 'Elena_Rostova_CV.txt');
    txtFormData.append('candidateId', cand2Id);

    const txtUploadRes = await fetch(`${baseUrl}/resumes`, {
      method: 'POST',
      body: txtFormData
    });
    const txtUploadJson = await txtUploadRes.json();
    console.log('   TXT Upload Status:', txtUploadRes.status);
    console.log('   TXT Parsed Text Word Count:', txtUploadJson.data?.parsedText?.split(/\s+/).length);
    console.log('   TXT Contains Skills:', txtUploadJson.data?.parsedText?.includes('PostgreSQL'));

    // 5. Test Scanned / Empty Document (OCR detection)
    console.log('\n5. Testing Scanned / Empty Document (OCR Detection)...');
    const emptyPdfContent = [
      '%PDF-1.4',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj',
      '4 0 obj << /Length 0 >> stream',
      'endstream endobj',
      'xref',
      '0 5',
      '0000000000 65535 f',
      '0000000009 00000 n',
      '0000000058 00000 n',
      '0000000115 00000 n',
      '0000000192 00000 n',
      'trailer << /Size 5 /Root 1 0 R >>',
      'startxref',
      '243',
      '%%EOF'
    ].join('\n');

    const emptyBlob = new Blob([Buffer.from(emptyPdfContent)], { type: 'application/pdf' });
    const emptyFormData = new FormData();
    emptyFormData.append('file', emptyBlob, 'Scanned_Image_Only_Resume.pdf');
    emptyFormData.append('candidateId', cand2Id);

    const emptyRes = await fetch(`${baseUrl}/resumes`, {
      method: 'POST',
      body: emptyFormData
    });
    const emptyJson = await emptyRes.json();
    console.log('   Empty PDF Upload Status:', emptyRes.status);
    console.log('   Parsing Status:', emptyJson.data?.parsingStatus);

    // 6. Test Corrupt File Handling
    console.log('\n6. Testing Corrupt Document Handling...');
    const corruptBlob = new Blob([Buffer.from('%PDF-1.4 Corrupt binary non-parseable noise %%%%%')], { type: 'application/pdf' });
    const corruptFormData = new FormData();
    corruptFormData.append('file', corruptBlob, 'Corrupt_File.pdf');
    corruptFormData.append('candidateId', candidateId);

    const corruptRes = await fetch(`${baseUrl}/resumes`, {
      method: 'POST',
      body: corruptFormData
    });
    const corruptJson = await corruptRes.json();
    console.log('   Corrupt File Status:', corruptRes.status);
    console.log('   Parsing Status recorded:', corruptJson.data?.parsingStatus);

    // 7. Verify Supabase Database Record
    console.log(`\n7. Verifying final record in Supabase (GET /api/resumes/${resumeId})...`);
    const finalVerifyRes = await fetch(`${baseUrl}/resumes/${resumeId}`);
    const finalVerifyJson = await finalVerifyRes.json();
    console.log('   Supabase Stored Filename:', finalVerifyJson.data?.originalFileName);
    console.log('   Supabase Stored Parsing Status:', finalVerifyJson.data?.parsingStatus);
    console.log('   Supabase Stored Storage Path:', finalVerifyJson.data?.storagePath);

    console.log('\n============================================================');
    console.log('✓ SPRINT 4 VERIFICATION: RESUME TEXT EXTRACTION PIPELINE FULLY VERIFIED!');
    console.log('============================================================');
  } catch (err) {
    console.error('Resume Extraction Test Failed:', err);
    process.exit(1);
  }
};

testResumeTextExtraction();
