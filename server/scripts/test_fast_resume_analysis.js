import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('server/.env') });

import { createCandidate } from '../src/services/candidateService.js';
import { createResume } from '../src/services/resumeService.js';
import { generatePersonalizedQuestionsFromResume } from '../src/services/ai/resumeScreeningService.js';
import supabase from '../src/config/supabase.js';

async function testFastResumeAnalysis() {
  console.log('Testing optimized Sarvam AI Resume Question Synthesis...');
  const t0 = Date.now();

  const cand = await createCandidate({
    name: 'Priya Sundaram',
    email: `priya.${Date.now()}@buildpath.io`,
    role: 'Senior Full Stack Engineer',
    status: 'Applied'
  });

  const resumeText = `
PRIYA SUNDARAM
Senior Full Stack Engineer | Bengaluru, India
Email: priya.s@example.com

SUMMARY:
Senior Full Stack Engineer with 6+ years of experience building scalable web architectures using React, Next.js, Node.js, and PostgreSQL.

EXPERIENCE:
Senior Engineer | FinTech Systems (2022 - Present)
- Architected a real-time payments microservice using Node.js, Redis Pub/Sub, and PostgreSQL partition tables handling 25,000 requests/minute.
- Built responsive React dashboards with TailwindCSS and optimized bundle sizes by 45% using code splitting and dynamic imports.
- Configured Dockerized CI/CD pipelines with GitHub Actions and automated end-to-end testing with Playwright.

Software Engineer | WebCloud Solutions (2019 - 2022)
- Developed RESTful and GraphQL APIs using Express.js, TypeScript, and MongoDB.
- Implemented JWT authentication with refresh token rotation and Redis session management.

SKILLS:
Frontend: React, Next.js, TypeScript, Redux Toolkit, Tailwind CSS
Backend: Node.js, Express, Go, GraphQL, REST APIs
Databases: PostgreSQL, Redis, MongoDB
DevOps: Docker, AWS (S3, ECS, Lambda), CI/CD, Git
`;

  const resumeRecord = await createResume(cand.id, {
    originalname: 'Priya_Sundaram_Resume.txt',
    mimetype: 'text/plain',
    size: Buffer.byteLength(resumeText),
    buffer: Buffer.from(resumeText, 'utf-8')
  });

  console.log(`Resume uploaded in ${Date.now() - t0}ms. Starting Sarvam AI question generation...`);
  const tGen = Date.now();

  const result = await generatePersonalizedQuestionsFromResume(resumeRecord.id, {
    roleTitle: 'Senior Full Stack Engineer'
  });

  const genDuration = Date.now() - tGen;
  console.log(`Sarvam AI Question Generation completed in ${genDuration}ms!`);
  console.log('Candidate Name:', result.candidateName);
  console.log('Extracted Skills:', result.extractedSkills);
  console.log('Questions count:', result.questions.length);
  result.questions.forEach((q, i) => {
    console.log(`  Q${i + 1} [${q.category}]: ${q.text}`);
    console.log(`    ↳ Anchor: ${q.sourceClaim}`);
  });

  // Cleanup
  await supabase.from('resumes').delete().eq('id', resumeRecord.id);
  await supabase.from('candidates').delete().eq('id', cand.id);
  console.log('Cleaned up test records.');
}

testFastResumeAnalysis().catch(console.error);
