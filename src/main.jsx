import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import { supabase } from './supabase.js'

// --- CRITICAL FIX: PRE-RENDER OAUTH HASH EXTRACTION & URL CLEAN-UP ---
// Instantly capture any access_token or refresh_token from window.location.hash,
// save session into Supabase using supabase.auth.setSession(),
// and immediately clean the URL using window.history.replaceState(null, '', window.location.pathname)
// to strip out the hash before React mounts and avoid HTML MIME-type / routing conflicts.
const initAuthAndBoot = async () => {
  const hash = window.location.hash;
  if (hash && (hash.includes('access_token') || hash.includes('error='))) {
    try {
      const cleanHash = hash.replace(/^#\/?/, '').replace(/^#/, '');
      const params = new URLSearchParams(cleanHash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      // Immediately clean the URL using window.history.replaceState to strip out the hash
      window.history.replaceState(null, '', window.location.pathname);

      if (access_token) {
        // Save session into Supabase client before booting the React tree
        const setSessionPromise = supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || ''
        });
        // 2-second safety timeout so initial render is never hung
        const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));
        await Promise.race([setSessionPromise, timeoutPromise]);
      }
    } catch (err) {
      console.error('[Pre-render OAuth session setup failed]:', err);
    }
  }

  // Mount React Application
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
};

initAuthAndBoot();