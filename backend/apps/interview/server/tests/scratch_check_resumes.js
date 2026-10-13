import supabase from '../src/config/supabase.js';

const checkResumesTable = async () => {
  try {
    console.log('Testing connection to public.resumes...');
    const { data, error } = await supabase.from('resumes').select('*').limit(5);
    if (error) {
      console.error('Supabase Query Error:', error);
    } else {
      console.log('Successfully queried public.resumes. Row count:', data.length);
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

checkResumesTable();
