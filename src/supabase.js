import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aezhlsfbewfqmzfshuzs.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemhsc2ZiZXdmcW16ZnNodXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTQwMjAsImV4cCI6MjEwNDA5MDAyMH0.XoDOE3ODevwYIzGz1ivsjmTvwQmIDtpC9jfg-TWSqUI';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export default supabase;