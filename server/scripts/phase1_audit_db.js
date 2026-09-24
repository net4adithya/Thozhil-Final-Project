import dotenv from 'dotenv';
import path from 'path';
import supabase from '../src/config/supabase.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function auditAndCleanDatabase() {
  console.log('\n========================================================================');
  console.log('  PHASE 1: LIVE SUPABASE DATABASE AUDIT & CLEANUP');
  console.log('========================================================================\n');

  // 1. Fetch current counts
  const { data: candidates, error: candErr } = await supabase.from('candidates').select('id, name, email, role, status, created_at');
  const { data: jobs, error: jobErr } = await supabase.from('jobs').select('id, title, department, status, created_at');
  const { data: interviews, error: intErr } = await supabase.from('interviews').select('id, title, type, status, candidate_id, created_at');
  const { data: questions, error: qErr } = await supabase.from('questions').select('id, text, category, interview_id');
  const { data: answers, error: ansErr } = await supabase.from('answers').select('id, interview_id, candidate_id, score, created_at');
  const { data: reports, error: repErr } = await supabase.from('reports').select('id, interview_id, candidate_id, overall_score, recommendation, created_at');

  console.log('--- BEFORE CLEANUP: LIVE SUPABASE TABLE ROW COUNTS ---');
  console.log(`Candidates:  ${candidates?.length || 0}`);
  console.log(`Jobs:        ${jobs?.length || 0}`);
  console.log(`Interviews:  ${interviews?.length || 0}`);
  console.log(`Questions:   ${questions?.length || 0}`);
  console.log(`Answers:     ${answers?.length || 0}`);
  console.log(`Reports:     ${reports?.length || 0}`);

  console.log('\n--- SAMPLE EXISTING CANDIDATE RECORDS ---');
  (candidates || []).slice(0, 10).forEach(c => {
    console.log(`- [${c.id}] ${c.name} (${c.email}) | Status: ${c.status}`);
  });

  // Identify leftover verification test records (matching "Verification", "Adversarial", "Candidate A", "Candidate B", "Test", "@example.com")
  const testCandidateIds = (candidates || [])
    .filter(c => 
      c.name.includes('Verification') ||
      c.name.includes('Adversarial') ||
      c.name.includes('Candidate A') ||
      c.name.includes('Candidate B') ||
      c.email.includes('@example.com')
    )
    .map(c => c.id);

  console.log(`\nIdentified ${testCandidateIds.length} leftover automated verification candidate records to clean.`);

  if (testCandidateIds.length > 0) {
    // Delete associated test answers, reports, interviews, questions
    for (const candId of testCandidateIds) {
      await supabase.from('answers').delete().eq('candidate_id', candId);
      await supabase.from('reports').delete().eq('candidate_id', candId);
      await supabase.from('interviews').delete().eq('candidate_id', candId);
      await supabase.from('candidates').delete().eq('id', candId);
    }
  }

  // 2. Fetch counts after cleanup
  const { data: cleanCandidates } = await supabase.from('candidates').select('id, name, email, role, status');
  const { data: cleanJobs } = await supabase.from('jobs').select('id, title, department');
  const { data: cleanInterviews } = await supabase.from('interviews').select('id, title, type, status');
  const { data: cleanAnswers } = await supabase.from('answers').select('id');
  const { data: cleanReports } = await supabase.from('reports').select('id, overall_score');

  console.log('\n--- AFTER CLEANUP: LIVE SUPABASE TABLE ROW COUNTS ---');
  console.log(`Candidates:  ${cleanCandidates?.length || 0}`);
  console.log(`Jobs:        ${cleanJobs?.length || 0}`);
  console.log(`Interviews:  ${cleanInterviews?.length || 0}`);
  console.log(`Answers:     ${cleanAnswers?.length || 0}`);
  console.log(`Reports:     ${cleanReports?.length || 0}`);

  console.log('\n--- REMAINING PRODUCTION / BASELINE CANDIDATES ---');
  (cleanCandidates || []).forEach(c => {
    console.log(`- [${c.id}] ${c.name} (${c.email}) | Role: ${c.role || 'N/A'}`);
  });

  console.log('\n========================================================================');
  console.log('✓ PHASE 1 AUDIT & PURGE COMPLETE');
  console.log('========================================================================\n');
}

auditAndCleanDatabase().catch(console.error);
