import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve('server/.env') });

import supabase from '../src/config/supabase.js';

async function fixCandidateAjay() {
  // Update candidate 675a5adf-db1f-4498-bd32-5ba6c1cfe9fd with the assigned interview
  const { data, error } = await supabase
    .from('candidates')
    .update({
      interview_id: '681256ea-2f36-4c67-8a1a-fe31b43c11f6',
      role: 'Full Stack Engineer'
    })
    .eq('id', '675a5adf-db1f-4498-bd32-5ba6c1cfe9fd')
    .select();

  console.log('Updated Candidate:', data, 'Error:', error);
}

fixCandidateAjay().catch(console.error);
