import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CLASS_OPTIONS, getGradeFromStream } from '../constants/classes';
import { Sparkles, Flame, Zap, Crown, UserPlus, Heart, MessageSquare, Bell, Shield, X, Mail } from 'lucide-react';

export default function Landing({
  grade = '11',
  setGrade = () => {},
  stream = 'Class 11',
  setStream = () => {},
  loginWithGoogle = () => {},
  isAuthenticating = false,
  installPrompt = null
}) {
  const [selectedClass, setSelectedClass] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('campus_stream');
        if (stored && CLASS_OPTIONS.includes(stored)) return stored;
      }
    } catch (_) {}
    return stream && CLASS_OPTIONS.includes(stream) ? stream : 'Class 11';
  });

  // 1. DEFAULT STATE: Defaults to "home" on initial load
  const [activeTab, setActiveTab] = useState('home');
  const [referralCode, setReferralCode] = useState('');
  const [activeModal, setActiveModal] = useState(null); // null | 'faqs' | 'terms' | 'privacy' | 'soc'

  // Capture ?ref= referral parameter from URL and persist
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
      console.warn('Error reading ref param in Landing:', e);
    }
  }, []);

  const handleClassChange = (newClass) => {
    setSelectedClass(newClass);
    setStream(newClass);
    setGrade(getGradeFromStream(newClass));
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

  // 1. DYNAMIC PAGE BACKGROUND COLOR SYSTEM
  // - 'home' (CenterInsider): Neon Green (#00ff41)
  // - 'Connect': Bright Neon Blue (#0090ff)
  // - 'Notes': Clean White or Off-White (#f8f9fa)
  // - 'Premium': Deep Purple / Pitch Black (#111111)
  // - 'Polls': Neon Pink (#ff007f)
  const tabBackgrounds = {
    home: '#00ff41',
    CenterInsider: '#00ff41',
    Connect: '#0090ff',
    Notes: '#f8f9fa',
    Premium: '#111111',
    Polls: '#ff007f'
  };

  const activeBg = tabBackgrounds[activeTab] || '#00ff41';
  const isDarkTab = activeTab === 'Premium';
  const pageTextColor = isDarkTab ? '#ffffff' : '#000000';

  // Navigation tabs in top black pill
  const navTabs = ['CenterInsider', 'Premium', 'Connect', 'Polls', 'Notes'];

  // Sample Hinglish Polls from Supabase database for the Polls auto-scroller
  const sampleHinglishPolls = [
    { q: "Spends more time at the Maggi point than in class? 🍜", tag: "Foodie Legend", color: "#ffe600" },
    { q: "Brings the best lunchbox that everyone attacks at recess? 🥪", tag: "Tiffin Raider", color: "#0df259" },
    { q: "Secret crush in the coaching batch 👀🔥", tag: "Top Secret", color: "#ff1475" },
    { q: "Always sleeps through 5 PM Physics? 😴", tag: "Backbencher", color: "#00f0ff" },
    { q: "Solves HC Verma questions during recess 📚", tag: "AIR 1 Vibes", color: "#ffe600" },
    { q: "Class clown who always makes the teacher smile 😂", tag: "Main Character", color: "#0df259" },
    { q: "Biggest drip at Ajit Road 👟🔥", tag: "Drip King", color: "#ff1475" },
    { q: "Has handwritten formula cheat sheets everyone borrows 📝", tag: "Batch Savior", color: "#00f0ff" }
  ];

  // Reusable Auth Component with extreme rounded borders & soft 2xl drop shadow
  const renderAuthComponent = () => (
    <div
      className="shadow-2xl"
      style={{
        width: '100%',
        maxWidth: '380px',
        background: '#000000',
        borderRadius: '32px', // rounded-[2rem]
        padding: '22px 20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(0, 0, 0, 0.3)',
        border: '3px solid #000000',
        color: '#ffffff',
        boxSizing: 'border-box',
        marginTop: '20px'
      }}
    >
      {/* Label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px'
        }}
      >
        <label
          htmlFor="landing-class-select"
          style={{
            fontSize: '12px',
            fontWeight: '900',
            color: '#0df259',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}
        >
          🎓 SELECT YOUR CLASS:
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

      {/* Simplified Select Class Dropdown (strictly Class 12 down to Class 6, default Class 11) */}
      <select
        id="landing-class-select"
        value={selectedClass}
        onChange={(e) => handleClassChange(e.target.value)}
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: '18px',
          border: '2px solid #0df259',
          background: '#121214',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: '900',
          cursor: 'pointer',
          outline: 'none',
          marginBottom: '14px',
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

      {/* MASSIVE NEON GREEN "CONTINUE WITH GOOGLE" BUTTON */}
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
          borderRadius: '20px',
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
        {/* Authentic Google 'G' Icon */}
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
          {isAuthenticating ? 'Connecting to Google...' : 'Continue with Google'}
        </span>
      </motion.button>

      <p
        style={{
          fontSize: '11px',
          color: '#a1a1aa',
          margin: '10px 0 0 0',
          fontWeight: '700',
          textAlign: 'center'
        }}
      >
        🔒 Zero passwords • 1-click Google authentication
      </p>
    </div>
  );

  return (
    <div
      className="transition-colors duration-500"
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: activeBg, // Dynamic background linked to activeTab
        transition: 'background-color 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        color: pageTextColor,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', 'Inter', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* ======================================================== */}
      {/* 2. PERSISTENT HEADER (LOCKED & NEVER SWAPS OUT)         */}
      {/* ======================================================== */}

      {/* Top Pink Banner */}
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
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          borderBottom: '3px solid #000000'
        }}
      >
        <span style={{ fontSize: '15px' }}>⚡</span>
        <span>bathinda network live • 1,420+ votes dropped today • invite-only access</span>
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
          CLOSING SOON
        </span>
      </div>

      {/* Top Black Pill Navigation Menu */}
      <header
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '18px 12px 10px 12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 40,
          boxSizing: 'border-box'
        }}
      >
        <div
          className="shadow-2xl"
          style={{
            background: '#000000',
            padding: '5px 6px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            border: '2px solid #000000',
            maxWidth: '100%',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {navTabs.map((tab) => {
            const isActive = (tab === 'CenterInsider' && activeTab === 'home') || activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (tab === 'CenterInsider') {
                    setActiveTab('home');
                  } else {
                    setActiveTab(tab);
                  }
                }}
                style={{
                  background: isActive ? '#0df259' : 'transparent',
                  color: isActive ? '#000000' : '#ffffff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: '950',
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  outline: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </header>

      {/* ======================================================== */}
      {/* 3. CENTRAL CONTENT AREA (DYNAMICALLY SWAPS PER TAB)     */}
      {/* ======================================================== */}
      <main
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '8px 20px 28px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box',
          flex: 1
        }}
      >
        <AnimatePresence mode="wait">

          {/* ---------------------------------------------------- */}
          {/* TAB 1: HOME (CENTERINSIDER)                          */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'home' && (
            <motion.div
              key="tab-home"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {/* Hero Title */}
              <div style={{ margin: '4px 0 16px 0' }}>
                <h1
                  style={{
                    fontSize: 'clamp(36px, 9.5vw, 54px)',
                    fontWeight: '950',
                    lineHeight: '0.96',
                    letterSpacing: '-0.05em',
                    color: '#000000',
                    margin: '0 0 8px 0',
                    textTransform: 'lowercase'
                  }}
                >
                  the all-new <br />
                  <span
                    style={{
                      background: '#000000',
                      color: '#0df259',
                      padding: '2px 14px',
                      borderRadius: '18px',
                      display: 'inline-block',
                      marginTop: '4px',
                      boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
                    }}
                  >
                    centerinsider
                  </span>
                </h1>
                <p
                  style={{
                    fontSize: 'clamp(15px, 4vw, 19px)',
                    fontWeight: '900',
                    color: '#000000',
                    letterSpacing: '-0.03em',
                    margin: 0,
                    opacity: 0.9,
                    textTransform: 'lowercase'
                  }}
                >
                  your exclusive school network
                </p>
              </div>

              {/* 3D Floating App Mockup (Un-boxed, rounded-[2.25rem], shadow-2xl, gentle float) */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                whileHover={{ y: -4, rotate: [-0.5, 0.5, 0], scale: 1.01 }}
                className="shadow-2xl"
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  background: '#000000',
                  borderRadius: '36px', // rounded-[2.25rem]
                  padding: '26px 18px 22px 18px',
                  border: '3px solid #000000',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 10px 25px rgba(0, 0, 0, 0.25)',
                  color: '#ffffff',
                  textAlign: 'center',
                  position: 'relative',
                  transformPerspective: 1000
                }}
              >
                {/* Yellow "🔥 100% anonymous" Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#ffe600',
                    color: '#000000',
                    padding: '5px 16px',
                    borderRadius: '999px',
                    fontSize: '11.5px',
                    fontWeight: '950',
                    border: '2px solid #000000',
                    boxShadow: '2px 2px 0px #000000',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🔥 100% anonymous
                </div>

                {/* Trending Poll Header */}
                <div style={{ marginTop: '8px', marginBottom: '14px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '900',
                      color: '#0df259',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      background: '#121214',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      border: '1px solid #27272a'
                    }}
                  >
                    TRENDING POLL • 240+ VOTES
                  </span>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: '950',
                      color: '#ffffff',
                      margin: '10px 0 0 0',
                      letterSpacing: '-0.02em',
                      lineHeight: '1.25'
                    }}
                  >
                    "Secret crush in the coaching batch? 👀🔥"
                  </h3>
                </div>

                {/* 4 Options: @varis, @ravneet, @divanshu, @ishant */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                  {[
                    { name: "@varis", color: "#0df259", emoji: "😎" },
                    { name: "@ravneet", color: "#ff1475", emoji: "🌸" },
                    { name: "@divanshu", color: "#00f0ff", emoji: "⚡" },
                    { name: "@ishant", color: "#ffe600", emoji: "🔥" }
                  ].map((option) => (
                    <motion.div
                      key={option.name}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      style={{
                        background: '#121214',
                        border: `1.5px solid ${option.color}`,
                        borderRadius: '18px',
                        padding: '12px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.45)'
                      }}
                    >
                      <span style={{ fontSize: '15px' }}>{option.emoji}</span>
                      <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.01em' }}>
                        {option.name}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Micro-text */}
                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#a1a1aa' }}>
                    Tap any classmate to cast your anonymous vote ⚡
                  </span>
                </div>
              </motion.div>

              {/* Auth Card */}
              {renderAuthComponent()}
            </motion.div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 2: PREMIUM (GOD MODE GRAPHIC)                    */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'Premium' && (
            <motion.div
              key="tab-premium"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {/* Header Title for Premium */}
              <div style={{ margin: '4px 0 16px 0' }}>
                <h1
                  style={{
                    fontSize: 'clamp(34px, 8.5vw, 48px)',
                    fontWeight: '950',
                    lineHeight: '0.98',
                    letterSpacing: '-0.04em',
                    color: '#ffffff',
                    margin: '0 0 6px 0',
                    textTransform: 'lowercase'
                  }}
                >
                  unlock <br />
                  <span
                    style={{
                      background: '#ffe600',
                      color: '#000000',
                      padding: '2px 14px',
                      borderRadius: '18px',
                      display: 'inline-block',
                      marginTop: '4px',
                      boxShadow: '0 0 25px rgba(255, 230, 0, 0.4)'
                    }}
                  >
                    god mode
                  </span>
                </h1>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#a1a1aa',
                    margin: 0,
                    textTransform: 'lowercase'
                  }}
                >
                  see exactly who votes for you
                </p>
              </div>

              {/* 3D Floating God Mode Card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="shadow-2xl"
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  background: '#000000',
                  borderRadius: '36px',
                  padding: '26px 20px',
                  border: '3px solid #ffe600',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(255, 230, 0, 0.3)',
                  color: '#ffffff',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#ffe600',
                    color: '#000000',
                    padding: '5px 16px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '950',
                    border: '2px solid #000000',
                    boxShadow: '2px 2px 0px #000000',
                    whiteSpace: 'nowrap'
                  }}
                >
                  👑 GOD MODE UNLOCKED
                </div>

                <div style={{ fontSize: '48px', margin: '8px 0 4px 0' }}>👑</div>

                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: '950',
                    color: '#ffe600',
                    margin: '0 0 8px 0',
                    letterSpacing: '-0.03em',
                    lineHeight: '1.15'
                  }}
                >
                  Unlock Premium.
                </h3>

                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#ffffff',
                    lineHeight: '1.4',
                    margin: '0 0 16px 0',
                    padding: '0 4px'
                  }}
                >
                  Invite 25 friends to see exactly who voted for you.
                </p>

                {/* VIP Feature Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                  {[
                    { label: "Reveal Secret Voter Identities", icon: "👀", color: "#ff1475" },
                    { label: "Unlimited Votes (No 30m Cooldowns)", icon: "⚡", color: "#0df259" },
                    { label: "Equip Champion Gold Halo Ring", icon: "✨", color: "#ffe600" }
                  ].map((perk) => (
                    <div
                      key={perk.label}
                      style={{
                        background: '#121214',
                        border: '1.5px solid #27272a',
                        borderRadius: '16px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{perk.icon}</span>
                      <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#e4e4e7' }}>
                        {perk.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Auth Card */}
              {renderAuthComponent()}
            </motion.div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 3: CONNECT (SLEEK BLUE-THEMED GRAPHIC)           */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'Connect' && (
            <motion.div
              key="tab-connect"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {/* Header Title for Connect */}
              <div style={{ margin: '4px 0 16px 0' }}>
                <h1
                  style={{
                    fontSize: 'clamp(34px, 8.5vw, 48px)',
                    fontWeight: '950',
                    lineHeight: '0.98',
                    letterSpacing: '-0.04em',
                    color: '#ffffff',
                    margin: '0 0 6px 0',
                    textTransform: 'lowercase'
                  }}
                >
                  campus <br />
                  <span
                    style={{
                      background: '#000000',
                      color: '#00f0ff',
                      padding: '2px 14px',
                      borderRadius: '18px',
                      display: 'inline-block',
                      marginTop: '4px',
                      boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)'
                    }}
                  >
                    connections
                  </span>
                </h1>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#ffffff',
                    margin: 0,
                    textTransform: 'lowercase',
                    opacity: 0.95
                  }}
                >
                  students connecting through polling
                </p>
              </div>

              {/* 3D Floating Connect Card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="shadow-2xl"
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  background: '#000000',
                  borderRadius: '36px',
                  padding: '26px 20px',
                  border: '3px solid #00f0ff',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 35px rgba(0, 240, 255, 0.35)',
                  color: '#ffffff',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#00f0ff',
                    color: '#000000',
                    padding: '5px 16px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: '950',
                    border: '2px solid #000000',
                    boxShadow: '2px 2px 0px #000000',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ⚡ CAMPUS NETWORK
                </div>

                <div style={{ fontSize: '46px', margin: '8px 0 4px 0' }}>🤝</div>

                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: '950',
                    color: '#00f0ff',
                    margin: '0 0 6px 0',
                    letterSpacing: '-0.03em'
                  }}
                >
                  how students connect
                </h3>

                <p
                  style={{
                    fontSize: '13.5px',
                    fontWeight: '700',
                    color: '#cbd5e1',
                    lineHeight: '1.4',
                    margin: '0 0 16px 0'
                  }}
                >
                  connect through polling, adding friends, and sending anonymous compliments.
                </p>

                {/* Animated Connection Nodes */}
                <div
                  style={{
                    background: '#0a0f1d',
                    border: '1.5px solid #1e293b',
                    borderRadius: '22px',
                    padding: '16px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1e293b', border: '2px solid #00f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      😎
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff' }}>@you</span>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '0 8px' }}>
                    <motion.div
                      animate={{ scale: [1, 1.25, 1] }}
                      transition={{ repeat: Infinity, duration: 1.6 }}
                      style={{ fontSize: '18px' }}
                    >
                      💌
                    </motion.div>
                    <div style={{ width: '100%', height: '2px', background: 'dashed #00f0ff', borderTop: '2px dashed #00f0ff' }} />
                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#00f0ff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Secret Flame
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1e293b', border: '2px solid #ff1475', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      🌸
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff' }}>@classmate</span>
                  </div>
                </div>

                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ background: '#121214', border: '1px solid #27272a', padding: '5px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', color: '#00f0ff' }}>
                    ✓ 100% Encrypted
                  </span>
                  <span style={{ background: '#121214', border: '1px solid #27272a', padding: '5px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', color: '#0df259' }}>
                    ✓ Real Classmates
                  </span>
                </div>
              </motion.div>

              {/* Auth Card */}
              {renderAuthComponent()}
            </motion.div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 4: POLLS (AUTO-SCROLLING VERTICAL MARQUEE)       */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'Polls' && (
            <motion.div
              key="tab-polls"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {/* Header Title for Polls */}
              <div style={{ margin: '4px 0 16px 0' }}>
                <h1
                  style={{
                    fontSize: 'clamp(34px, 8.5vw, 48px)',
                    fontWeight: '950',
                    lineHeight: '0.98',
                    letterSpacing: '-0.04em',
                    color: '#ffffff',
                    margin: '0 0 6px 0',
                    textTransform: 'lowercase'
                  }}
                >
                  trending <br />
                  <span
                    style={{
                      background: '#000000',
                      color: '#ff007f',
                      padding: '2px 14px',
                      borderRadius: '18px',
                      display: 'inline-block',
                      marginTop: '4px',
                      boxShadow: '0 0 25px rgba(255, 0, 127, 0.4)'
                    }}
                  >
                    hinglish polls
                  </span>
                </h1>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#ffffff',
                    margin: 0,
                    textTransform: 'lowercase',
                    opacity: 0.95
                  }}
                >
                  compliments only • zero bullying
                </p>
              </div>

              {/* 3D Floating Polls Card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="shadow-2xl"
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  background: '#000000',
                  borderRadius: '36px',
                  padding: '20px 16px',
                  border: '3px solid #ff007f',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 35px rgba(255, 0, 127, 0.3)',
                  color: '#ffffff',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 6px 12px 6px',
                    borderBottom: '1px solid #27272a',
                    marginBottom: '12px'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#ff007f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ⚡ Live Hinglish Questions
                  </span>
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#ffe600' }}>
                    Auto-Refreshed
                  </span>
                </div>

                {/* Vertical Infinite Scrolling Container */}
                <div style={{ height: '230px', overflow: 'hidden', position: 'relative' }}>
                  <motion.div
                    animate={{ y: [0, -320] }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: 9,
                      ease: "linear"
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}
                  >
                    {[...sampleHinglishPolls, ...sampleHinglishPolls].map((poll, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#121214',
                          border: `1.5px solid ${poll.color}`,
                          borderRadius: '18px',
                          padding: '12px 14px',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: '900',
                            color: poll.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em'
                          }}
                        >
                          {poll.tag}
                        </span>
                        <p
                          style={{
                            fontSize: '13.5px',
                            fontWeight: '800',
                            color: '#ffffff',
                            margin: 0,
                            lineHeight: '1.25'
                          }}
                        >
                          "{poll.q}"
                        </p>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>

              {/* Auth Card */}
              {renderAuthComponent()}
            </motion.div>
          )}

          {/* ---------------------------------------------------- */}
          {/* TAB 5: NOTES (FLOATING IOS NOTIFICATION BUBBLES)      */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'Notes' && (
            <motion.div
              key="tab-notes"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              {/* Header Title for Notes */}
              <div style={{ margin: '4px 0 16px 0' }}>
                <h1
                  style={{
                    fontSize: 'clamp(34px, 8.5vw, 48px)',
                    fontWeight: '950',
                    lineHeight: '0.98',
                    letterSpacing: '-0.04em',
                    color: '#000000',
                    margin: '0 0 6px 0',
                    textTransform: 'lowercase'
                  }}
                >
                  secret <br />
                  <span
                    style={{
                      background: '#000000',
                      color: '#ffffff',
                      padding: '2px 14px',
                      borderRadius: '18px',
                      display: 'inline-block',
                      marginTop: '4px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    inbox notes
                  </span>
                </h1>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: '800',
                    color: '#000000',
                    margin: 0,
                    textTransform: 'lowercase',
                    opacity: 0.8
                  }}
                >
                  real-time anonymous compliments
                </p>
              </div>

              {/* 3D Floating Notes Card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="shadow-2xl"
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  background: '#000000',
                  borderRadius: '36px',
                  padding: '22px 18px',
                  border: '3px solid #000000',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 10px 25px rgba(0, 0, 0, 0.15)',
                  color: '#ffffff',
                  textAlign: 'left',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                    padding: '0 4px'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#ff1475', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🔔 Anonymous Notifications
                  </span>
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#0df259' }}>
                    Live Feeds
                  </span>
                </div>

                {/* 4 Exact Notification Strings with Staggered Floating Animations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  {[
                    { text: "someone has voted for you 👀", time: "now", border: "#ff1475" },
                    { text: "a girl just voted for you 🔥", time: "1m ago", border: "#ffe600" },
                    { text: "your vote is sent 🚀", time: "3m ago", border: "#0df259" },
                    { text: "you are a legend 👑", time: "5m ago", border: "#00f0ff" }
                  ].map((note, index) => (
                    <motion.div
                      key={note.text}
                      initial={{ opacity: 0, x: -16, y: 10 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.25 }}
                      whileHover={{ scale: 1.02 }}
                      style={{
                        background: '#121214',
                        border: `1.5px solid ${note.border}`,
                        borderRadius: '18px',
                        padding: '11px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '10px',
                            background: '#000000',
                            border: `1.5px solid ${note.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px'
                          }}
                        >
                          ⚡
                        </div>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: '800',
                            color: '#ffffff',
                            letterSpacing: '-0.01em'
                          }}
                        >
                          {note.text}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#71717a', flexShrink: 0 }}>
                        {note.time}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Auth Card */}
              {renderAuthComponent()}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ======================================================== */}
      {/* 4. PERSISTENT FOOTER (LOCKED & NEVER SWAPS OUT)         */}
      {/* ======================================================== */}
      <footer style={{ width: '100%', marginTop: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* BRIGHT YELLOW CONTAINER WITH BLUE "REAL CLASSROOM VIBES" BADGE */}
        <div
          style={{
            width: '100%',
            background: '#ffe600',
            borderTop: '3px solid #000000',
            borderBottom: '3px solid #000000',
            padding: '36px 20px',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            {/* Blue "REAL CLASSROOM VIBES" Badge */}
            <div
              style={{
                display: 'inline-block',
                background: '#0047ff', // Vibrant blue badge
                color: '#ffffff',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: '950',
                letterSpacing: '0.06em',
                marginBottom: '14px',
                textTransform: 'uppercase',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000'
              }}
            >
              REAL CLASSROOM VIBES
            </div>

            {/* Anti-bullying text */}
            <h2
              style={{
                fontSize: 'clamp(26px, 6.5vw, 36px)',
                fontWeight: '950',
                color: '#000000',
                lineHeight: '1.05',
                letterSpacing: '-0.04em',
                margin: '0 0 12px 0',
                textTransform: 'lowercase'
              }}
            >
              compliments only. zero bullying.
            </h2>

            <p
              style={{
                fontSize: '14.5px',
                fontWeight: '800',
                color: '#000000',
                lineHeight: '1.4',
                margin: '0 auto 20px auto',
                maxWidth: '440px',
                opacity: 0.95
              }}
            >
              all questions are positive, humorous, and safe. vote for your peers, see who voted for you, and discover your secret admirers.
            </p>

            {/* "100% Student Verified" tags */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap'
              }}
            >
              <span
                style={{
                  background: '#ffffff',
                  border: '2.5px solid #000000',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '950',
                  color: '#000000',
                  boxShadow: '2px 2px 0px #000000'
                }}
              >
                ✓ 100% Student Verified
              </span>
              <span
                style={{
                  background: '#ffffff',
                  border: '2.5px solid #000000',
                  borderRadius: '999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '950',
                  color: '#000000',
                  boxShadow: '2px 2px 0px #000000'
                }}
              >
                🔥 12,400+ Compliments Sent
              </span>
            </div>
          </div>
        </div>

        {/* PITCH-BLACK FOOTER SECTION (EXACT SLICK STRUCTURE) */}
        <div
          style={{
            width: '100%',
            background: '#000000',
            color: '#ffffff',
            padding: '48px 24px 64px 24px',
            textAlign: 'left',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            {/* ⚡ CenterInsider Logo/Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: '950',
                  color: '#ffffff',
                  letterSpacing: '-0.04em'
                }}
              >
                CenterInsider
              </span>
            </div>

            {/* Slay all day */}
            <p
              style={{
                fontSize: '16px',
                fontWeight: '800',
                color: '#a1a1aa',
                margin: '0 0 32px 0',
                letterSpacing: '-0.02em'
              }}
            >
              Slay all day
            </p>

            {/* Links List */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <a
                href="mailto:support@centerinsider.com"
                style={{
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'color 0.15s ease'
                }}
              >
                <span style={{ color: '#0df259' }}>-</span> Email us
              </a>

              <button
                type="button"
                onClick={() => setActiveModal('faqs')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left'
                }}
              >
                <span style={{ color: '#0df259' }}>-</span> FAQs
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('terms')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left'
                }}
              >
                <span style={{ color: '#0df259' }}>-</span> Terms of Use
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('privacy')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left'
                }}
              >
                <span style={{ color: '#0df259' }}>-</span> Privacy Policy
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('soc')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left'
                }}
              >
                <span style={{ color: '#0df259' }}>-</span> SOC
              </button>
            </nav>

            <div style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #27272a', fontSize: '11px', color: '#71717a', fontWeight: '700' }}>
              © 2026 CenterInsider Inc. Built exclusively for student communities.
            </div>
          </div>
        </div>
      </footer>

      {/* INTERACTIVE MODALS FOR LEGAL, FAQS, SOC */}
      <AnimatePresence>
        {activeModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '0'
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                width: '100%',
                maxWidth: '540px',
                background: '#121214',
                border: '2px solid #27272a',
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                padding: '24px 20px 36px 20px',
                color: '#ffffff',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '950', margin: 0, color: '#0df259' }}>
                  {activeModal === 'faqs' && 'Frequently Asked Questions'}
                  {activeModal === 'terms' && 'Terms of Use'}
                  {activeModal === 'privacy' && 'Privacy Policy'}
                  {activeModal === 'soc' && 'SOC 2 & Security Compliance'}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  style={{
                    background: '#27272a',
                    border: 'none',
                    color: '#ffffff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {activeModal === 'faqs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px', lineHeight: '1.4' }}>
                  <div>
                    <h4 style={{ color: '#ffe600', margin: '0 0 4px 0', fontWeight: '800' }}>Is CenterInsider really anonymous?</h4>
                    <p style={{ color: '#a1a1aa', margin: 0 }}>Yes. When you vote for a classmate, your identity is hidden. They only see that someone voted for them and your gender (e.g., "A boy from your class").</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#ffe600', margin: '0 0 4px 0', fontWeight: '800' }}>How do I see who voted for me?</h4>
                    <p style={{ color: '#a1a1aa', margin: 0 }}>Invite 25 classmates using your personal invite link to unlock God Mode status and reveal voter identities.</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#ffe600', margin: '0 0 4px 0', fontWeight: '800' }}>Can anyone bully others?</h4>
                    <p style={{ color: '#a1a1aa', margin: 0 }}>Never. CenterInsider is built strictly on positivity. All questions are pre-written compliments, humor, and hype.</p>
                  </div>
                </div>
              )}

              {activeModal === 'terms' && (
                <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#a1a1aa' }}>
                  <p>Welcome to CenterInsider. By accessing or using our closed student polling platform, you agree to participate in positive, uplifting peer-to-peer interactions.</p>
                  <p>Harassment, reverse-engineering, scraping, or botting will lead to immediate and permanent account termination.</p>
                </div>
              )}

              {activeModal === 'privacy' && (
                <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#a1a1aa' }}>
                  <p>We respect your privacy. Votes are encrypted, and student identities are never publicly revealed without explicit peer consent or God Mode unlocked via verified referrals.</p>
                  <p>We never sell student data to third-party ad networks.</p>
                </div>
              )}

              {activeModal === 'soc' && (
                <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#a1a1aa' }}>
                  <p>🔒 Service Organization Controls (SOC 2 Type II Compliant Architecture).</p>
                  <p>CenterInsider enforces strict Row Level Security (RLS) on all Supabase databases to protect student records, voter anonymity, and authentication tokens against network snooping.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
