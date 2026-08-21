import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

if (!env.supabase.url || !env.supabase.serviceRoleKey) {
  throw new Error('Supabase URL and Service Role Key must be defined in environmental variables.');
}

export const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export default supabase;
