import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('campaigns').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
}

export default supabase;
