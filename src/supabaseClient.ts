import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Checks if the Supabase environment variables are properly configured
 * and not left as default template placeholders.
 */
export const hasSupabaseConfig = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (
    supabaseUrl.trim() === '' || 
    supabaseUrl.includes('your-supabase') || 
    supabaseAnonKey.trim() === '' || 
    supabaseAnonKey.includes('your-supabase')
  ) {
    return false;
  }
  return true;
};

// Exports the validated Supabase client instance (or null if unconfigured)
export const supabase = hasSupabaseConfig() 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;
