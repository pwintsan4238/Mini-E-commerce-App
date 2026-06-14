/**
 * Supabase client singleton
 * Reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` from environment.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or ANON KEY is missing in .env. API calls will fail until .env is configured.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
