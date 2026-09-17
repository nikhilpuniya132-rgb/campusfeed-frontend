import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aezhlsfbewfqmzfshuzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlemhsc2ZiZXdmcW16ZnNodXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTQwMjAsImV4cCI6MjEwNDA5MDAyMH0.XoDOE3ODevwYIzGz1ivsjmTvwQmIDtpC9jfg-TWSqUI';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: 'pkce', // <-- This forces the clean URL fix
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

export default supabase;