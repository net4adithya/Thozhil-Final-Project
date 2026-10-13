import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('server/.env') });

import supabase from '../src/config/supabase.js';

async function findAjay() {
  const { data: candidates } = await supabase.from('candidates').select('*').ilike('name', '%ajay%');
  console.log('Candidates matching ajay:', candidates);

  const { data: allCand } = await supabase.from('candidates').select('*');
  console.log('All candidates count:', allCand?.length);
  allCand?.forEach(c => console.log(c.id, c.name, c.email, 'InterviewID in candidate:', c.interview_id));
}

findAjay().catch(console.error);
