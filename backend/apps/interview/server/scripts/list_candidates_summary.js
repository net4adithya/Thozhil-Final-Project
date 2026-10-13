import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('server/.env') });

import supabase from '../src/config/supabase.js';

async function listCandidates() {
  const { data: candidates } = await supabase.from('candidates').select('*');
  console.log('=== CANDIDATES COUNT:', candidates?.length);
  candidates?.forEach(c => {
    console.log(`Candidate: ID=${c.id}, Name=${c.name}, Email=${c.email}, Role=${c.role}, InterviewID=${c.interview_id}`);
  });

  const { data: interviews } = await supabase.from('interviews').select('*');
  console.log('=== INTERVIEWS COUNT:', interviews?.length);
  interviews?.forEach(i => {
    console.log(`Interview: ID=${i.id}, Title=${i.title}, Type=${i.type}, CandidateID=${i.candidate_id}, Status=${i.status}`);
  });
}

listCandidates().catch(console.error);
