import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CLASS_OPTIONS, getGradeFromStream } from '../constants/classes';
import { Sparkles, ShieldCheck, Flame } from 'lucide-react';

export default function Signup({
  loginWithGoogle,
  isAuthenticating = false,
}) {
  const [selectedClass, setSelectedClass] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('campus_stream');
        if (stored && CLASS_OPTIONS.includes(stored)) return stored;
      }
    } catch (_) {}
    return 'Class 11';
  });

  const [activeTab, setActiveTab] = useState('Connect');
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref');
      if (refParam) {
        const cleanRef = refParam.trim().replace(/^@/, '');
        setReferralCode(cleanRef);
        sessionStorage.setItem('campus_ref_code', cleanRef);
        sessionStorage.setItem('referred_by', cleanRef);
        localStorage.setItem('campus_ref_code', cleanRef);
        localStorage.setItem('referred_by', cleanRef);
      }
    } catch (e) {
      console.warn('Error reading ref param in Signup:', e);
    }
  }, []);

  const handleClassChange = (newClass) => {
    setSelectedClass(newClass);
    try {
      localStorage.setItem('campus_stream', newClass);
      localStorage.setItem('campus_grade', getGradeFromStream(newClass));
      localStorage.setItem('pre_selected_school', 'St. Kabir Convent Senior Secondary');
      localStorage.setItem('campus_institute', 'St. Kabir Convent Senior Secondary');
    } catch (_) {}
  };

  const handleGoogleLogin = async () => {
    if (!selectedClass || !CLASS_OPTIONS.includes(selectedClass)) {
      alert("Please select your class first.");
      return;
    }
    try {
      localStorage.setItem('campus_stream', selectedClass);
      localStorage.setItem('campus_grade', getGradeFromStream(selectedClass));
      localStorage.setItem('pre_selected_school', 'St. Kabir Convent Senior Secondary');
      localStorage.setItem('campus_institute', 'St. Kabir Convent Senior Secondary');
    } catch (_) {}
    await loginWithGoogle('St. Kabir Convent Senior Secondary');
  };

  const navTabs = ['Premium', 'Connect', 'Polls', 'Notes'];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#0df259', // Slick neon green
        color: '#000000',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', 'Inter', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* 1. PINK SCARCITY BANNER AT THE TOP */}
      <div
        style={{
          width: '100%',
          background: '#ff1475',
          color: '#ffffff',
          padding: '10px 16px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '900',
          letterSpacing: '-0.01em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          zIndex: 50,
          borderBottom: '3px solid #000000'
        }}
      >
        <span>⚡ bathinda network live • zero friction Google access</span>
        <span
          style={{
            background: '#000000',
            color: '#ff1475',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: '900',
            marginLeft: '4px'
          }}
        >
          INSTANT ACCESS
        </span>
      </div>

      {/* 2. PILL-SHAPED CENTERED MENU */}
      <header
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '18px 16px 10px 16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 40
        }}
      >
        <div
          style={{
            background: '#000000',
            padding: '5px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            border: '2px solid #000000'
          }}
        >
          {navTabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  background: isActive ? '#0df259' : 'transparent',
                  color: isActive ? '#000000' : '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: '900',
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  outline: 'none'
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </header>

      {/* 3. HERO AUTHENTICATION WRAPPER */}
      <main
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '16px 20px 48px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ margin: '8px 0 20px 0' }}>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: 'clamp(36px, 9vw, 50px)',
              fontWeight: '950',
              lineHeight: '0.98',
              letterSpacing: '-0.05em',
              color: '#000000',
              margin: '0 0 10px 0',
              textTransform: 'lowercase'
            }}
          >
            welcome to <br />
            <span
              style={{
                background: '#000000',
                color: '#0df259',
                padding: '2px 14px',
                borderRadius: '16px',
                display: 'inline-block',
                marginTop: '4px'
              }}
            >
              centerinsider
            </span>
          </motion.h1>

          <p
            style={{
              fontSize: '16px',
              fontWeight: '900',
              color: '#000000',
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            1-click student authentication
          </p>
        </div>

        {/* 4. CONVERSION CARD */}
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            background: '#000000',
            borderRadius: '28px',
            padding: '22px 20px',
            boxShadow: '6px 6px 0px rgba(0,0,0,0.85)',
            border: '3px solid #000000',
            color: '#ffffff',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}
          >
            <label
              htmlFor="auth-class-select"
              style={{
                fontSize: '12px',
                fontWeight: '900',
                color: '#0df259',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
            >
              🎓 Select your class:
            </label>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#ffe600'
              }}
            >
              REQUIRED
            </span>
          </div>

          {/* Simplified Class dropdown (zero stream clutter) */}
          <select
            id="auth-class-select"
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '16px',
              border: '2px solid #0df259',
              background: '#121214',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '900',
              cursor: 'pointer',
              outline: 'none',
              marginBottom: '16px',
              boxSizing: 'border-box',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%230df259\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 16px center'
            }}
          >
            {CLASS_OPTIONS.map((c) => (
              <option key={c} value={c} style={{ background: '#18181b', color: '#ffffff', fontWeight: '700' }}>
                {c}
              </option>
            ))}
          </select>

          {/* MASSIVE GOOGLE BUTTON - ZERO PASSWORDS */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleLogin}
            disabled={isAuthenticating}
            style={{
              width: '100%',
              background: isAuthenticating ? '#27272a' : '#0df259',
              color: '#000000',
              border: '2px solid #000000',
              borderRadius: '18px',
              padding: '16px 20px',
              fontSize: '17px',
              fontWeight: '950',
              cursor: isAuthenticating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 6px 0px #000000',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>
              {isAuthenticating ? 'Connecting to Google...' : 'Log In with Google'}
            </span>
          </motion.button>

          <p
            style={{
              fontSize: '11px',
              color: '#a1a1aa',
              margin: '10px 0 0 0',
              fontWeight: '700'
            }}
          >
            🔒 Passwordless instant access
          </p>
        </div>

        {/* 5. YELLOW SOCIAL PROOF CHIP */}
        <div
          style={{
            marginTop: '24px',
            background: '#ffe600',
            border: '2px solid #000000',
            borderRadius: '999px',
            padding: '8px 20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: '900',
            boxShadow: '3px 3px 0px #000000'
          }}
        >
          <Flame size={15} color="#ff1475" />
          <span>join over 1,400+ students on campus today</span>
        </div>
      </main>
    </div>
  );
}
