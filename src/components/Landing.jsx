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

  // 3. COMPONENT PADDING & 4. SCALE ADJUSTMENT: p-8 md:p-10, max-w-sm md:max-w-md, mx-auto, shadow-2xl
  const renderAuthComponent = () => (
    <div
      className="w-full max-w-sm md:max-w-md mx-auto p-8 md:p-10 shadow-2xl rounded-3xl"
      style={{
        background: '#000000',
        borderRadius: '36px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 8px 24px rgba(0, 0, 0, 0.3)',
        border: '3px solid #000000',
        color: '#ffffff',
        boxSizing: 'border-box'
      }}
    >
      {/* Label */}
      <div
        className="flex items-center justify-between mb-3"
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

      {/* Simplified Select Class Dropdown */}
      <select
        id="landing-class-select"
        value={selectedClass}
        onChange={(e) => handleClassChange(e.target.value)}
        className="w-full p-4 mb-4"
        style={{
          borderRadius: '18px',
          border: '2px solid #0df259',
          background: '#121214',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: '900',
          cursor: 'pointer',
          outline: 'none',
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
        className="w-full p-4"
        style={{
          background: isAuthenticating ? '#27272a' : '#0df259',
          color: '#000000',
          border: '2px solid #000000',
          borderRadius: '20px',
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
        className="mt-3 text-center"
        style={{
          fontSize: '11px',
          color: '#a1a1aa',
          fontWeight: '700'
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

      {/* Top Pink Urgency Banner */}
      <div
        className="w-full py-2.5 px-4 text-center z-50 flex items-center justify-center gap-2"
        style={{
          background: '#ff1475',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: '900',
          letterSpacing: '-0.01em',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          borderBottom: '3px solid #000000'
        }}
      >
        <span style={{ fontSize: '15px' }}>⚡</span>
        <span>bathinda network live • 1,420+ votes dropped today • invite-only access</span>
        <span
          className="ml-1 py-0.5 px-2 rounded-full font-black text-xs"
          style={{
            background: '#000000',
            color: '#ff1475'
          }}
        >
          CLOSING SOON
        </span>
      </div>

      {/* Top Black Pill Navigation Menu */}
      <header
        className="w-full max-w-xl pt-5 pb-2 px-3 flex justify-center items-center z-40 box-border"
      >
        <div
          className="shadow-2xl bg-black p-1.5 rounded-full flex items-center gap-1 max-w-full overflow-x-auto"
          style={{
            border: '2px solid #000000',
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
                className="py-2 px-3.5 rounded-full font-black text-xs tracking-tight transition-all duration-200 outline-none whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  background: isActive ? '#0df259' : 'transparent',
                  color: isActive ? '#000000' : '#ffffff',
                  border: 'none'
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
      {/* 1. GLOBAL SPACING: gap-10 md:gap-12 with ample room     */}
      {/* ======================================================== */}
      <main
        className="w-full max-w-xl px-5 pb-6 flex-1 flex flex-col items-center text-center box-border"
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
              className="w-full flex flex-col items-center gap-8 md:gap-12"
            >
              {/* 2. HERO SECTION: Significant top margin mt-12 md:mt-16 */}
              <div className="mt-12 md:mt-16 mb-2">
                <h1
                  style={{
                    fontSize: 'clamp(36px, 9.5vw, 54px)',
                    fontWeight: '950',
                    lineHeight: '0.96',
                    letterSpacing: '-0.05em',
                    color: '#000000',
                    margin: '0 0 10px 0',
                    textTransform: 'lowercase'
                  }}
                >
                  the all-new <br />
                  <span
                    className="py-1 px-4 rounded-2xl inline-block shadow-md mt-1"
                    style={{
                      background: '#000000',
                      color: '#0df259'
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

              {/* 2. AUTH CARD (PRIORITIZED FOR INSTANT LOGIN) */}
              {renderAuthComponent()}

              {/* 3. DEMO POLL CARD */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                whileHover={{ y: -4, rotate: [-0.5, 0.5, 0], scale: 1.01 }}
                className="w-full max-w-sm md:max-w-md mx-auto p-8 md:p-10 shadow-2xl rounded-3xl relative text-center"
                style={{
                  background: '#000000',
                  borderRadius: '36px',
                  border: '3px solid #000000',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 10px 25px rgba(0, 0, 0, 0.25)',
                  color: '#ffffff',
                  transformPerspective: 1000
                }}
              >
                {/* Yellow "🔥 100% anonymous" Badge */}
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 py-1 px-4 rounded-full font-black text-xs whitespace-nowrap flex items-center gap-1 shadow-md"
                  style={{
                    background: '#ffe600',
                    color: '#000000',
                    border: '2px solid #000000'
                  }}
                >
                  🔥 100% anonymous
                </div>

                {/* Trending Poll Header */}
                <div className="mt-2 mb-4">
                  <span
                    className="py-1 px-3 rounded-full font-black text-[10px] tracking-wider uppercase inline-block mb-2"
                    style={{
                      color: '#0df259',
                      background: '#121214',
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
                      margin: '6px 0 0 0',
                      letterSpacing: '-0.02em',
                      lineHeight: '1.25'
                    }}
                  >
                    "Secret crush in the coaching batch? 👀🔥"
                  </h3>
                </div>

                {/* 4 Options: @varis, @ravneet, @divanshu, @ishant */}
                <div className="grid grid-cols-2 gap-3 mt-4">
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
                      className="p-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      style={{
                        background: '#121214',
                        border: `1.5px solid ${option.color}`
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
                <div className="mt-5 flex items-center justify-center gap-1.5">
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#a1a1aa' }}>
                    Tap any classmate to cast your anonymous vote ⚡
                  </span>
                </div>
              </motion.div>
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
              className="w-full flex flex-col items-center gap-8 md:gap-12"
            >
              {/* 2. HERO SECTION: Significant top margin mt-12 md:mt-16 */}
              <div className="mt-12 md:mt-16 mb-2">
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
                    className="py-1 px-4 rounded-2xl inline-block mt-1"
                    style={{
                      background: '#ffe600',
                      color: '#000000',
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

              {/* 3. COMPONENT PADDING & 4. SCALE ADJUSTMENT */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="w-full max-w-sm md:max-w-md mx-auto p-8 md:p-10 shadow-2xl rounded-3xl relative text-center"
                style={{
                  background: '#000000',
                  borderRadius: '36px',
                  border: '3px solid #ffe600',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(255, 230, 0, 0.3)',
                  color: '#ffffff'
                }}
              >
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 py-1 px-4 rounded-full font-black text-xs whitespace-nowrap shadow-md"
                  style={{
                    background: '#ffe600',
                    color: '#000000',
                    border: '2px solid #000000'
                  }}
                >
                  👑 GOD MODE UNLOCKED
                </div>

                <div style={{ fontSize: '48px', margin: '8px 0 6px 0' }}>👑</div>

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
                    margin: '0 0 18px 0',
                    padding: '0 4px'
                  }}
                >
                  Invite 25 friends to see exactly who voted for you.
                </p>

                {/* VIP Feature Badges */}
                <div className="flex flex-col gap-2.5 text-left">
                  {[
                    { label: "Reveal Secret Voter Identities", icon: "👀", color: "#ff1475" },
                    { label: "Unlimited Votes (No 30m Cooldowns)", icon: "⚡", color: "#0df259" },
                    { label: "Equip Champion Gold Halo Ring", icon: "✨", color: "#ffe600" }
                  ].map((perk) => (
                    <div
                      key={perk.label}
                      className="p-3 rounded-2xl flex items-center gap-3"
                      style={{
                        background: '#121214',
                        border: '1.5px solid #27272a'
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
              className="w-full flex flex-col items-center gap-8 md:gap-12"
            >
              {/* 2. HERO SECTION: Significant top margin mt-12 md:mt-16 */}
              <div className="mt-12 md:mt-16 mb-2">
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
                    className="py-1 px-4 rounded-2xl inline-block mt-1"
                    style={{
                      background: '#000000',
                      color: '#00f0ff',
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

              {/* 3. COMPONENT PADDING & 4. SCALE ADJUSTMENT */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="w-full max-w-sm md:max-w-md mx-auto p-8 md:p-10 shadow-2xl rounded-3xl relative text-center"
                style={{
                  background: '#000000',
                  borderRadius: '36px',
                  border: '3px solid #00f0ff',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 35px rgba(0, 240, 255, 0.35)',
                  color: '#ffffff'
                }}
              >
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 py-1 px-4 rounded-full font-black text-xs whitespace-nowrap shadow-md"
                  style={{
                    background: '#00f0ff',
                    color: '#000000',
                    border: '2px solid #000000'
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
                    margin: '0 0 18px 0'
                  }}
                >
                  connect through polling, adding friends, and sending anonymous compliments.
                </p>

                {/* Animated Connection Nodes */}
                <div
                  className="p-4 rounded-2xl flex items-center justify-between relative"
                  style={{
                    background: '#0a0f1d',
                    border: '1.5px solid #1e293b'
                  }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1e293b', border: '2px solid #00f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      😎
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff' }}>@you</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-0.5 px-2">
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

                  <div className="flex flex-col items-center gap-1">
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1e293b', border: '2px solid #ff1475', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      🌸
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff' }}>@classmate</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-center gap-2">
                  <span className="py-1 px-3 rounded-full font-extrabold text-xs" style={{ background: '#121214', border: '1px solid #27272a', color: '#00f0ff' }}>
                    ✓ 100% Encrypted
                  </span>
                  <span className="py-1 px-3 rounded-full font-extrabold text-xs" style={{ background: '#121214', border: '1px solid #27272a', color: '#0df259' }}>
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
              className="w-full flex flex-col items-center gap-8 md:gap-12"
            >
              {/* 2. HERO SECTION: Significant top margin mt-12 md:mt-16 */}
              <div className="mt-12 md:mt-16 mb-2">
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
                    className="py-1 px-4 rounded-2xl inline-block mt-1"
                    style={{
                      background: '#000000',
                      color: '#ff007f',
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

              {/* 3. COMPONENT PADDING & 4. SCALE ADJUSTMENT */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="w-full max-w-sm md:max-w-md mx-auto p-8 md:p-10 shadow-2xl rounded-3xl relative overflow-hidden"
                style={{
                  background: '#000000',
                  borderRadius: '36px',
                  border: '3px solid #ff007f',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 35px rgba(255, 0, 127, 0.3)',
                  color: '#ffffff'
                }}
              >
                <div
                  className="flex items-center justify-between pb-3 mb-3"
                  style={{ borderBottom: '1px solid #27272a' }}
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
                    className="flex flex-col gap-2.5"
                  >
                    {[...sampleHinglishPolls, ...sampleHinglishPolls].map((poll, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl text-left flex flex-col gap-1 shadow-md"
                        style={{
                          background: '#121214',
                          border: `1.5px solid ${poll.color}`
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
              className="w-full flex flex-col items-center gap-8 md:gap-12"
            >
              {/* 2. HERO SECTION: Significant top margin mt-12 md:mt-16 */}
              <div className="mt-12 md:mt-16 mb-2">
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
                    className="py-1 px-4 rounded-2xl inline-block mt-1 shadow-md"
                    style={{
                      background: '#000000',
                      color: '#ffffff'
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

              {/* 3. COMPONENT PADDING & 4. SCALE ADJUSTMENT */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="w-full max-w-sm md:max-w-md mx-auto p-8 md:p-10 shadow-2xl rounded-3xl relative text-left"
                style={{
                  background: '#000000',
                  borderRadius: '36px',
                  border: '3px solid #000000',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 10px 25px rgba(0, 0, 0, 0.15)',
                  color: '#ffffff'
                }}
              >
                <div
                  className="flex items-center justify-between mb-4 px-1"
                >
                  <span style={{ fontSize: '11px', fontWeight: '900', color: '#ff1475', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🔔 Anonymous Notifications
                  </span>
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#0df259' }}>
                    Live Feeds
                  </span>
                </div>

                {/* 4 Exact Notification Strings with Staggered Floating Animations */}
                <div className="flex flex-col gap-2.5">
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
                      className="p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md"
                      style={{
                        background: '#121214',
                        border: `1.5px solid ${note.border}`
                      }}
                    >
                      <div className="flex items-center gap-2.5">
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
      {/* 5. FOOTER SEPARATION: Massive top margin mt-20 md:mt-24  */}
      {/* ======================================================== */}
      <footer className="mt-20 md:mt-24 w-full flex flex-col">

        {/* BRIGHT YELLOW CONTAINER WITH BLUE "REAL CLASSROOM VIBES" BADGE */}
        <div
          className="w-full py-12 px-5 text-center box-border"
          style={{
            background: '#ffe600',
            borderTop: '3px solid #000000',
            borderBottom: '3px solid #000000'
          }}
        >
          <div className="max-w-lg mx-auto">
            {/* Blue "REAL CLASSROOM VIBES" Badge */}
            <div
              className="inline-block py-1.5 px-4 rounded-full font-black text-xs tracking-wider uppercase mb-3.5 shadow-md"
              style={{
                background: '#0047ff', // Vibrant blue badge
                color: '#ffffff',
                border: '2px solid #000000'
              }}
            >
              REAL CLASSROOM VIBES
            </div>

            {/* Anti-bullying text */}
            <h2
              className="mb-3 lowercase"
              style={{
                fontSize: 'clamp(26px, 6.5vw, 36px)',
                fontWeight: '950',
                color: '#000000',
                lineHeight: '1.05',
                letterSpacing: '-0.04em'
              }}
            >
              compliments only. zero bullying.
            </h2>

            <p
              className="mx-auto mb-5 max-w-md font-extrabold text-sm leading-relaxed"
              style={{
                color: '#000000',
                opacity: 0.95
              }}
            >
              all questions are positive, humorous, and safe. vote for your peers, see who voted for you, and discover your secret admirers.
            </p>

            {/* "100% Student Verified" tags */}
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <span
                className="py-1.5 px-3.5 rounded-full font-black text-xs shadow-sm"
                style={{
                  background: '#ffffff',
                  border: '2.5px solid #000000',
                  color: '#000000'
                }}
              >
                ✓ 100% Student Verified
              </span>
              <span
                className="py-1.5 px-3.5 rounded-full font-black text-xs shadow-sm"
                style={{
                  background: '#ffffff',
                  border: '2.5px solid #000000',
                  color: '#000000'
                }}
              >
                🔥 12,400+ Compliments Sent
              </span>
            </div>
          </div>
        </div>

        {/* PITCH-BLACK FOOTER SECTION (EXACT SLICK STRUCTURE) */}
        <div
          className="w-full bg-black text-white pt-12 pb-16 px-6 text-left box-border"
        >
          <div className="max-w-lg mx-auto">
            {/* ⚡ CenterInsider Logo/Icon */}
            <div className="flex items-center gap-2 mb-2">
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
              className="mb-8 font-extrabold text-base tracking-tight"
              style={{
                color: '#a1a1aa'
              }}
            >
              Slay all day
            </p>

            {/* Links List */}
            <nav className="flex flex-col gap-3.5">
              <a
                href="mailto:support@centerinsider.com"
                className="text-white text-sm font-extrabold flex items-center gap-2 no-underline hover:text-green-400 transition-colors"
              >
                <span style={{ color: '#0df259' }}>-</span> Email us
              </a>

              <button
                type="button"
                onClick={() => setActiveModal('faqs')}
                className="bg-transparent border-none text-white text-sm font-extrabold flex items-center gap-2 cursor-pointer p-0 text-left hover:text-green-400 transition-colors"
              >
                <span style={{ color: '#0df259' }}>-</span> FAQs
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('terms')}
                className="bg-transparent border-none text-white text-sm font-extrabold flex items-center gap-2 cursor-pointer p-0 text-left hover:text-green-400 transition-colors"
              >
                <span style={{ color: '#0df259' }}>-</span> Terms of Use
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('privacy')}
                className="bg-transparent border-none text-white text-sm font-extrabold flex items-center gap-2 cursor-pointer p-0 text-left hover:text-green-400 transition-colors"
              >
                <span style={{ color: '#0df259' }}>-</span> Privacy Policy
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('soc')}
                className="bg-transparent border-none text-white text-sm font-extrabold flex items-center gap-2 cursor-pointer p-0 text-left hover:text-green-400 transition-colors"
              >
                <span style={{ color: '#0df259' }}>-</span> SOC
              </button>
            </nav>

            <div
              className="mt-9 pt-5 border-t border-zinc-800 text-[11px] font-bold"
              style={{ color: '#71717a' }}
            >
              © 2026 CenterInsider Inc. Built exclusively for student communities.
            </div>
          </div>
        </div>
      </footer>

      {/* INTERACTIVE MODALS FOR LEGAL, FAQS, SOC */}
      <AnimatePresence>
        {activeModal && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center p-0 backdrop-blur-md"
            style={{
              background: 'rgba(0,0,0,0.85)'
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg p-6 pb-9 text-white overflow-y-auto box-border"
              style={{
                background: '#121214',
                border: '2px solid #27272a',
                borderTopLeftRadius: '28px',
                borderTopRightRadius: '28px',
                maxHeight: '80vh'
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: '20px', fontWeight: '950', margin: 0, color: '#0df259' }}>
                  {activeModal === 'faqs' && 'Frequently Asked Questions'}
                  {activeModal === 'terms' && 'Terms of Use'}
                  {activeModal === 'privacy' && 'Privacy Policy'}
                  {activeModal === 'soc' && 'SOC 2 & Security Compliance'}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full border-none text-white flex items-center justify-center cursor-pointer"
                  style={{ background: '#27272a' }}
                >
                  <X size={16} />
                </button>
              </div>

              {activeModal === 'faqs' && (
                <div className="flex flex-col gap-3.5 text-sm leading-relaxed">
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
                <div className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>
                  <p>Welcome to CenterInsider. By accessing or using our closed student polling platform, you agree to participate in positive, uplifting peer-to-peer interactions.</p>
                  <p>Harassment, reverse-engineering, scraping, or botting will lead to immediate and permanent account termination.</p>
                </div>
              )}

              {activeModal === 'privacy' && (
                <div className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>
                  <p>We respect your privacy. Votes are encrypted, and student identities are never publicly revealed without explicit peer consent or God Mode unlocked via verified referrals.</p>
                  <p>We never sell student data to third-party ad networks.</p>
                </div>
              )}

              {activeModal === 'soc' && (
                <div className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>
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
