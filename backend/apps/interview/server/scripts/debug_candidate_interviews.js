import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('server/.env') });

import supabase from '../src/config/supabase.js';

async function checkCandidateAndInterviews() {
  const { data: candidates } = await supabase.from('candidates').select('*');
  const { data: interviews } = await supabase.from('interviews').select('*');

  console.log('=== CANDIDATES IN DB ===');
  console.log(JSON.stringify(candidates, null, 2));

  console.log('=== INTERVIEWS IN DB ===');
  console.log(JSON.stringify(interviews, null, 2));
}

checkCandidateAndInterviews().catch(console.error);
