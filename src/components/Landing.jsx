import React, { useRef, useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import AddToHomeScreenGuide from './AddToHomeScreenGuide';
import InstituteCombobox, { findHubForInstitute } from './InstituteCombobox';
import { MASTER_CLASS_OPTIONS, getGradeFromStream } from '../constants/classes';

const InteractivePollDemo = lazy(() => import('./InteractivePollDemo'));
const HolographicCard = lazy(() => import('./HolographicCard'));

const FAQS = [
  {
    q: "Is CenterInsider really anonymous?",
    a: "Yes. When you vote for a classmate in a poll, your identity is completely hidden. They will only see that \"someone\" from their institute voted for them, along with your gender (e.g., \"A boy from your hub\")."
  },
  {
    q: "How do I see who voted for me?",
    a: "If you receive a 'Secret Flame', you can reveal the voter's identity by successfully inviting 3 friends to the app using your unique referral code or link."
  },
  {
    q: "Why do I have to log in with Google?",
    a: "We enforce Google authentication to keep the community safe and authentic. It prevents bots, fake accounts, and ensures that the polls represent real students in your coaching hub."
  },
  {
    q: "Can people use this to bully others?",
    a: "No. CenterInsider is built strictly on positivity. Users cannot create their own custom questions. All polls are pre-written by our team and are designed to be compliments, funny observations, or hype."
  },
  {
    q: "How do I change my School or Coaching Institute?",
    a: "Once you lock in your profile during onboarding, your institute is set to ensure poll accuracy. If you made a mistake, you must delete your account from the Profile tab and sign up again."
  }
];

export default function Landing({
  grade = '11',
  setGrade = () => {},
  stream = 'Class 11 - Medical',
  setStream = () => {},
  institute = '',
  setInstitute = () => {},
  coachingHub = 'Ajit Road Hub',
  setCoachingHub = () => {},
  loginWithGoogle = () => {},
  isAuthenticating = false,
  showManualLogin: propShowManualLogin,
  setShowManualLogin: propSetShowManualLogin,
  handle = '',
  setHandle = () => {},
  password = '',
  setPassword = () => {},
  login = () => {},
  loginWithPassword,
  legalView: propLegalView,
  setLegalView: propSetLegalView,
  activePlan: propActivePlan,
  setActivePlan: propSetActivePlan,
  handleUpgrade = () => {},
  installPrompt = null
}) {
  const [localShowManual, setLocalShowManual] = useState(false);
  const showManualLogin = propShowManualLogin !== undefined ? propShowManualLogin : localShowManual;
  const setShowManualLogin = propSetShowManualLogin || setLocalShowManual;

  const [localLegalView, setLocalLegalView] = useState(null);
  const legalView = propLegalView !== undefined ? propLegalView : localLegalView;
  const setLegalView = propSetLegalView || setLocalLegalView;

  const [localActivePlan, setLocalActivePlan] = useState('weekly');
  const activePlan = propActivePlan !== undefined ? propActivePlan : localActivePlan;
  const setActivePlan = propSetActivePlan || setLocalActivePlan;

  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const [referralCode, setReferralCode] = useState(() => {
    try {
      if (typeof window === 'undefined') return '';
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      return ref ? ref.trim().replace(/^@/, '') : (sessionStorage.getItem('campus_ref_code') || localStorage.getItem('campus_ref_code') || '');
    } catch (_) {
      return '';
    }
  });

  // Capture ?ref= parameter on Landing page and persist in sessionStorage and localStorage
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
      console.error('Error capturing referral parameter in Landing:', e);
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (!stream || !MASTER_CLASS_OPTIONS.includes(stream)) {
      alert("Please select your Class / Standard first before continuing with Google.");
      return;
    }
    const selectedInstitute = (institute || localStorage.getItem('pre_selected_school') || '').trim();
    if (selectedInstitute) {
      try {
        localStorage.setItem('pre_selected_school', selectedInstitute);
      } catch (_) {}
    } else {
      try {
        localStorage.removeItem('pre_selected_school');
      } catch (_) {}
    }
    try {
      localStorage.setItem('campus_stream', stream);
      localStorage.setItem('campus_grade', getGradeFromStream(stream));
    } catch (_) {}
    await loginWithGoogle(selectedInstitute);
  };

  const doPasswordLogin = loginWithPassword || login;

  const heroRef = useRef(null);
  const pricingRef = useRef(null);
  const loginRef = useRef(null);

  // --- 3D SCROLL-DRIVEN MOTION ---
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const smoothHero = useSpring(heroScrollProgress, {
    stiffness: 100,
    damping: 24,
    mass: 0.2
  });

  const heroTextOpacity = useTransform(smoothHero, [0, 0.45], [1, 0]);
  const heroTextY = useTransform(smoothHero, [0, 0.45], [0, -45]);
  const stageScale = useTransform(smoothHero, [0, 0.45], [0.85, 1]);
  const stageRotateX = useTransform(smoothHero, [0, 0.45], [20, 0]);
  const stageOpacity = useTransform(smoothHero, [0, 0.2], [0.9, 1]);

  const { scrollYProgress: pricingScrollProgress } = useScroll({
    target: pricingRef,
    offset: ["start end", "center center"]
  });

  const smoothPricing = useSpring(pricingScrollProgress, {
    stiffness: 90,
    damping: 22,
    mass: 0.2
  });

  const pricingOpacity = useTransform(smoothPricing, [0, 0.75], [0, 1]);
  const pricingY = useTransform(smoothPricing, [0, 0.75], [60, 0]);

  const { scrollYProgress: loginScrollProgress } = useScroll({
    target: loginRef,
    offset: ["start end", "center center"]
  });

  const smoothLogin = useSpring(loginScrollProgress, {
    stiffness: 90,
    damping: 22,
    mass: 0.2
  });

  const loginOpacity = useTransform(smoothLogin, [0, 0.75], [0, 1]);
  const loginY = useTransform(smoothLogin, [0, 0.75], [60, 0]);

  return (
    <div className="gas-landing-wrapper" style={{ background: '#ffffff', color: '#000000', minHeight: '100vh' }}>
      {/* 1. Top Navbar */}
      <header className="gas-landing-nav" style={{ background: 'rgba(255, 255, 255, 0.95)', borderBottom: '1px solid #e5e7eb', backdropFilter: 'blur(12px)' }}>
        <div className="gas-logo">
          <span className="flame-icon">🔥</span>
          <span style={{ color: '#000000', fontWeight: '900', letterSpacing: '-0.5px' }}>CENTERINSIDER</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="gas-school-badge" style={{ border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#4b5563', fontWeight: '800', letterSpacing: '0.04em' }}>
            🔥 BATHINDA COACHING NETWORK
          </span>

          <div className="tooltip-wrapper">
            <li className="nav-link" style={{ listStyle: 'none' }}>
              <div className="tooltip-tab" style={{ color: '#4b5563', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <span>Support</span>
                <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', fill: 'currentColor' }}><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" /></svg>
              </div>
              <div className="tooltip" style={{ background: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <ul className="tooltip-menu-with-icon" style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                  <div style={{ padding: '8px 12px', fontSize: '11px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>
                    Available 3 PM - 6 PM
                  </div>
                  <li className="tooltip-link">
                    <a href="https://instagram.com/_nikhilpuniyaai" target="_blank" rel="noreferrer" style={{ color: '#111827' }}>
                      @_nikhilpuniyaai
                    </a>
                  </li>
                  <li className="tooltip-link">
                    <a href="mailto:nikhilpuniya132@gmail.com" style={{ color: '#111827' }}>
                      nikhilpuniya132@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
            </li>
          </div>
        </div>
      </header>

      {/* 2. Hero Section - Stripped nested overflows and ensured no mobile touch trap */}
      <section ref={heroRef} className="gas-hero-section overflow-visible" style={{ overflow: 'visible', touchAction: 'pan-y' }}>
        <motion.div
          className="gas-hero-text overflow-visible"
          style={{
            opacity: heroTextOpacity,
            y: heroTextY,
            overflow: 'visible'
          }}
        >
          <div className="gas-pill-badge" style={{ border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#4b5563' }}>
            <span>✦</span> The Anonymous Loop for Bathinda Coaching Hubs
          </div>

          <h1 className="gas-hero-title" style={{ color: '#000000' }}>
            STOP GUESSING.<br />
            <span style={{ color: '#000000' }}>START KNOWING.</span>
          </h1>

          <p className="gas-hero-subtitle" style={{ color: '#6b7280' }}>
            The 100% anonymous school voting network. Answer viral polls about your classmates, see who voted for you, and discover your secret admirers.
          </p>

          <div className="gas-desktop-only">
            <div className="gas-hero-stats">
              <div className="gas-stat-card" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
                <span className="gas-stat-number" style={{ color: '#000000' }}>12,480+</span>
                <span className="gas-stat-label" style={{ color: '#6b7280' }}>Votes Cast</span>
              </div>
              <div className="gas-stat-card" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
                <span className="gas-stat-number" style={{ color: '#000000' }}>100%</span>
                <span className="gas-stat-label" style={{ color: '#6b7280' }}>Anonymous</span>
              </div>
              <div className="gas-stat-card" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
                <span className="gas-stat-number" style={{ color: '#000000', fontSize: '13px' }}>Class 6 to 12 & Droppers</span>
                <span className="gas-stat-label" style={{ color: '#6b7280' }}>Bathinda Hubs</span>
              </div>
            </div>

            <div className="gas-hero-cta-group">
              <button
                className="magic-btn"
                onClick={() => document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: '#000000', color: '#ffffff', border: 'none', boxShadow: 'none', fontWeight: '800' }}
              >
                ENTER NETWORK ➔
              </button>
            </div>
          </div>
        </motion.div>

        {/* 3D Showcase Interactive Stage with Chips (overflow-visible, auto height, no touch trap) */}
        <motion.div
          className="gas-hero-3d-stage overflow-visible"
          style={{
            scale: stageScale,
            rotateX: stageRotateX,
            opacity: stageOpacity,
            overflow: 'visible',
            touchAction: 'pan-y',
            height: 'auto',
            minHeight: 'auto'
          }}
        >
          <div className="gas-float-chip gas-float-chip-1" style={{ background: '#ffffff', border: '1px solid #e5e7eb', color: '#111827', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <span>🔥</span> Someone secretly picked you
          </div>
          <div className="gas-float-chip gas-float-chip-2" style={{ background: '#ffffff', border: '1px solid #e5e7eb', color: '#111827', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <span>👑</span> 100% Private & Anonymous
          </div>

          <Suspense fallback={<div className="overflow-visible" style={{ minHeight: 'auto', height: 'auto', overflow: 'visible' }} />}>
            <InteractivePollDemo onCtaClick={() => document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' })} />
          </Suspense>
        </motion.div>

        {/* Mobile-Only CTA */}
        <div className="gas-mobile-only overflow-visible" style={{ width: '100%', marginTop: '20px', overflow: 'visible' }}>
          <div className="gas-hero-cta-group">
            <button
              className="magic-btn"
              onClick={() => document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: '#000000', color: '#ffffff', border: 'none', boxShadow: 'none', fontWeight: '800' }}
            >
              ENTER NETWORK ➔
            </button>
          </div>

          <div className="gas-hero-stats">
            <div className="gas-stat-card" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
              <span className="gas-stat-number" style={{ color: '#000000' }}>12,480+</span>
              <span className="gas-stat-label" style={{ color: '#6b7280' }}>Votes</span>
            </div>
            <div className="gas-stat-card" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
              <span className="gas-stat-number" style={{ color: '#000000' }}>100%</span>
              <span className="gas-stat-label" style={{ color: '#6b7280' }}>Anonymous</span>
            </div>
            <div className="gas-stat-card" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', boxShadow: 'none' }}>
              <span className="gas-stat-number" style={{ color: '#000000', fontSize: '13px' }}>Class 6 to 12 & Droppers</span>
              <span className="gas-stat-label" style={{ color: '#6b7280' }}>Bathinda Hubs</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pure Invite Loop - Zero Paid Subscriptions */}
      <section id="pricing-portal" ref={pricingRef} className="pricing-section" style={{ background: '#ffffff', padding: '60px 20px' }}>
        <motion.div
          style={{
            opacity: pricingOpacity,
            y: pricingY,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span className="gas-pill-badge" style={{ border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#111827', fontWeight: '800' }}>
              ⚡ 100% FREE • PURE INVITE LOOP
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 900, margin: '14px 0 8px 0', color: '#000000', letterSpacing: '-1px' }}>
              Unlock God Mode With Friends.
            </h2>
            <p style={{ color: '#6b7280', maxWidth: '520px', margin: '0 auto', fontSize: '14px', lineHeight: 1.5 }}>
              No subscriptions, no payment gateways, no fees. CenterInsider premium features unlock purely by inviting your classmates into the loop.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', width: '100%', maxWidth: '860px' }}>
            {/* Card 1: 3 Invites (1 Month Access) */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              style={{
                background: '#ffffff',
                border: '1.5px solid #000000',
                borderRadius: '24px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    color: '#000000',
                    fontSize: '11px',
                    fontWeight: '900',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    letterSpacing: '0.04em'
                  }}>
                    🔥 3 INVITES MILESTONE
                  </span>
                  <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>1 Month Access</span>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#000000', margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>
                  Invite 3 Friends (1 Month Access)
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 20px 0', lineHeight: 1.4 }}>
                  Invite 3 classmates to instantly unlock 1 Month of full God Mode privileges.
                </p>

                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
                    What You Unlock:
                  </span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#111827', fontWeight: '600' }}>
                      <span style={{ color: '#000000', fontWeight: '900', fontSize: '15px' }}>✓</span>
                      <span><strong>See who voted for you</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#111827', fontWeight: '600' }}>
                      <span style={{ color: '#000000', fontWeight: '900', fontSize: '15px' }}>✓</span>
                      <span><strong>See who secretly views your profile</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#111827', fontWeight: '600' }}>
                      <span style={{ color: '#000000', fontWeight: '900', fontSize: '15px' }}>✓</span>
                      <span><strong>Cast unlimited votes</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#111827', fontWeight: '600' }}>
                      <span style={{ color: '#000000', fontWeight: '900', fontSize: '15px' }}>✓</span>
                      <span><strong>Create up to 3 custom polls</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '14px',
                  border: '1.5px solid #000000',
                  background: '#f9fafb',
                  color: '#000000',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Join & Invite 3 Friends ➔
              </button>
            </motion.div>

            {/* Card 2: 25 Invites (Lifetime Legend) */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              style={{
                background: '#000000',
                border: '1.5px solid #000000',
                borderRadius: '24px',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 30px rgba(0,0,0,0.14)',
                color: '#ffffff',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-11px',
                right: '24px',
                background: '#fbbf24',
                color: '#000000',
                fontSize: '10px',
                fontWeight: '900',
                padding: '3px 10px',
                borderRadius: '12px',
                letterSpacing: '0.04em'
              }}>
                👑 ELITE STATUS
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{
                    background: '#262626',
                    border: '1px solid #404040',
                    color: '#fbbf24',
                    fontSize: '11px',
                    fontWeight: '900',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    letterSpacing: '0.04em'
                  }}>
                    👑 25 INVITES MILESTONE
                  </span>
                  <span style={{ fontSize: '11px', color: '#a3a3a3', fontWeight: '700' }}>Lifetime Legend</span>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '-0.3px' }}>
                  Invite 25 Friends (Lifetime Legend)
                </h3>
                <p style={{ fontSize: '13px', color: '#a3a3a3', margin: '0 0 20px 0', lineHeight: 1.4 }}>
                  Invite 25 classmates to permanently cement your status as an official School & Coaching Legend.
                </p>

                <div style={{ borderTop: '1px solid #262626', paddingTop: '16px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
                    Lifetime Superpowers:
                  </span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#ffffff', fontWeight: '600' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '15px' }}>★</span>
                      <span><strong>Get featured in the Legends tab</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#ffffff', fontWeight: '600' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '15px' }}>★</span>
                      <span><strong>Create up to 150 custom polls/month</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#ffffff', fontWeight: '600' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '15px' }}>★</span>
                      <span><strong>Cast unlimited votes</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#ffffff', fontWeight: '600' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '15px' }}>★</span>
                      <span><strong>See all voters and profile visitors</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#ffffff', fontWeight: '600' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '15px' }}>★</span>
                      <span><strong>Unlock preferred aura rings</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#ffffff', fontWeight: '600' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '15px' }}>★</span>
                      <span><strong>Get boosted visibility in the feed</strong></span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#000000',
                  fontWeight: '900',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Become a Lifetime Legend ⚡
              </button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 4. Login Portal Section (Natural Flow & Scrollable) */}
      <section
        id="login-portal"
        ref={loginRef}
        style={{
          minHeight: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px 80px 20px',
          position: 'relative',
          background: '#ffffff'
        }}
      >
        <motion.div
          style={{
            opacity: loginOpacity,
            y: loginY,
            width: '100%',
            maxWidth: '400px',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div
            className="form"
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '24px',
              padding: '24px 20px',
              boxShadow: 'none'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  color: '#4b5563',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  letterSpacing: '0.04em'
                }}
              >
                ⚡ 1-TAP ONE-TOUCH ACCESS
              </span>
              {referralCode && (
                <span
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 10px',
                    borderRadius: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>🎁</span> Invited by @{referralCode}
                </span>
              )}
            </div>

            <p style={{ marginTop: '8px', textAlign: 'center', fontSize: '14px', color: '#000000', fontWeight: '700' }}>
              Join the Loop.
              <span style={{ color: '#6b7280', fontWeight: '500', display: 'block', marginTop: '2px', fontSize: '12.5px' }}>
                Select your School/Institute to enter the loop.
              </span>
            </p>

            {/* Searchable Institute Combobox */}
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                School/Institute
              </label>
              <InstituteCombobox
                value={institute}
                placeholder="Search or select your school"
                onChange={(val) => {
                  setInstitute(val);
                  setCoachingHub(findHubForInstitute(val));
                  if (val && val.trim()) {
                    try {
                      localStorage.setItem('pre_selected_school', val.trim());
                    } catch (_) {}
                  } else {
                    try {
                      localStorage.removeItem('pre_selected_school');
                    } catch (_) {}
                  }
                }}
                onSelectHub={(hub) => setCoachingHub(hub)}
              />
            </div>

            {/* Standard Dropdown Selector */}
            <div style={{ marginBottom: '18px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label htmlFor="standard-selector" style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select Class / Standard
                </label>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '800' }}>REQUIRED</span>
              </div>
              <div style={{ position: 'relative' }}>
                <select
                  id="standard-selector"
                  value={MASTER_CLASS_OPTIONS.includes(stream) ? stream : (stream || 'Class 11 - Medical')}
                  onChange={(e) => {
                    const s = e.target.value;
                    if (window.navigator?.vibrate) window.navigator.vibrate(8);
                    setStream(s);
                    const resolvedGrade = getGradeFromStream(s);
                    setGrade(resolvedGrade);
                    try {
                      localStorage.setItem('campus_stream', s);
                      localStorage.setItem('campus_grade', resolvedGrade);
                    } catch (_) {}
                  }}
                  style={{
                    width: '100%',
                    padding: '13px 40px 13px 14px',
                    background: '#f9fafb',
                    border: '1.5px solid #000000',
                    borderRadius: '14px',
                    color: '#000000',
                    fontSize: '14px',
                    fontWeight: '700',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#000000'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#000000'; }}
                >
                  <optgroup label="Junior School (Classes 6-9)">
                    {MASTER_CLASS_OPTIONS.filter(o => ['Class 6', 'Class 7', 'Class 8', 'Class 9'].includes(o)).map((opt) => (
                      <option key={opt} value={opt} style={{ color: '#000000', background: '#ffffff', fontWeight: '600' }}>
                        {opt}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Senior School & Coaching (Classes 10-12+)">
                    {MASTER_CLASS_OPTIONS.filter(o => !['Class 6', 'Class 7', 'Class 8', 'Class 9'].includes(o)).map((opt) => (
                      <option key={opt} value={opt} style={{ color: '#000000', background: '#ffffff', fontWeight: '600' }}>
                        {opt}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <span
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    color: '#6b7280',
                    pointerEvents: 'none'
                  }}
                >
                  ▼
                </span>
              </div>
            </div>

            {/* Dual-Auth Google CTA Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              {/* Primary: Sign Up with Google */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="oauthButton"
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                type="button"
                style={{
                  width: '100%',
                  background: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  fontWeight: '900',
                  fontSize: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                  opacity: isAuthenticating ? 0.7 : 1,
                  boxShadow: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <svg className="icon" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>{isAuthenticating ? 'Connecting...' : 'Sign Up with Google'}</span>
              </motion.button>

              {/* Secondary: Log In with Google */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                type="button"
                style={{
                  width: '100%',
                  background: '#ffffff',
                  color: '#000000',
                  border: '1.5px solid #000000',
                  borderRadius: '16px',
                  fontWeight: '900',
                  fontSize: '14px',
                  padding: '13px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                  opacity: isAuthenticating ? 0.7 : 1,
                  boxShadow: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <svg className="icon" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>{isAuthenticating ? 'Connecting...' : 'Log In with Google'}</span>
              </motion.button>
            </div>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', marginTop: '10px' }}>
              Zero passwords • Instant student verification
            </div>

            {/* De-emphasized Manual / Test Accounts Accordion */}
            <div style={{ width: '100%', borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowManualLogin(!showManualLogin)}
                style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', transition: 'color 0.2s' }}
              >
                {showManualLogin ? '▲ Hide Test Accounts' : '▼ Or use username & password (Seed Accounts)'}
              </button>

              {showManualLogin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  <input
                    type="text"
                    placeholder="Handle (e.g., gursharan)"
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#000000', fontSize: '14px', outline: 'none' }}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#000000', fontSize: '14px', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={doPasswordLogin}
                    style={{ padding: '12px', borderRadius: '12px', border: 'none', background: '#000000', color: '#ffffff', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    Login with Password
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Visual Add to Home Screen Onboarding Component (PWA) */}
          <div style={{ marginTop: '14px' }}>
            <AddToHomeScreenGuide installPrompt={installPrompt} />
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
            <p>
              By entering, you agree to our <br />
              <span onClick={() => setLegalView('terms')} style={{ color: '#000000', textDecoration: 'underline', cursor: 'pointer', fontWeight: '600' }}>
                Terms & Conditions
              </span>{' '}
              and{' '}
              <span onClick={() => setLegalView('privacy')} style={{ color: '#000000', textDecoration: 'underline', cursor: 'pointer', fontWeight: '600' }}>
                Privacy Policy
              </span>
            </p>
          </div>
        </motion.div>
      </section>

      {/* 5. Custom FAQ Accordion Section */}
      <section
        id="faq-section"
        style={{
          width: '100%',
          padding: '48px 20px 64px 20px',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderTop: '1px solid #f3f4f6',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ width: '100%', maxWidth: '640px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                color: '#4b5563',
                fontSize: '11px',
                fontWeight: '800',
                padding: '4px 12px',
                borderRadius: '20px',
                letterSpacing: '0.04em',
                display: 'inline-block'
              }}
            >
              ❓ FREQUENTLY ASKED QUESTIONS
            </span>
            <h2
              style={{
                fontSize: 'clamp(24px, 5vw, 32px)',
                fontWeight: 900,
                margin: '12px 0 6px 0',
                color: '#000000',
                letterSpacing: '-0.5px'
              }}
            >
              Got Questions? We've Got Answers.
            </h2>
            <p style={{ color: '#6b7280', fontSize: '13.5px', margin: 0 }}>
              Everything you need to know about CenterInsider and how it works.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '16px',
                    background: isOpen ? '#f9fafb' : '#ffffff',
                    overflow: 'hidden',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(6);
                      setOpenFaqIndex(isOpen ? null : idx);
                    }}
                    style={{
                      width: '100%',
                      padding: '16px 18px',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#000000', lineHeight: 1.4 }}>
                      {faq.q}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div
                          style={{
                            padding: '0 18px 16px 18px',
                            color: '#4b5563',
                            fontSize: '13.5px',
                            lineHeight: 1.6,
                            borderTop: '1px solid #f3f4f6',
                            paddingTop: '12px'
                          }}
                        >
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Legal Modal Overlay */}
      <AnimatePresence>
        {legalView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="gas-modal-overlay"
            onClick={() => setLegalView(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              style={{
                background: '#ffffff',
                color: '#000000',
                padding: '28px',
                borderRadius: '24px',
                maxWidth: '480px',
                width: '100%',
                border: '1px solid #e5e7eb',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ color: '#000000', marginTop: 0, fontSize: '19px', fontWeight: 800 }}>
                {legalView === 'terms' ? 'Terms of Service & User Agreement' : 'Privacy Policy & Data Handling'}
              </h2>
              <div style={{ color: '#4b5563', fontSize: '13px', lineHeight: '1.65', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                {legalView === 'terms' ? (
                  <p style={{ margin: 0 }}>
                    Welcome to CenterInsider. By accessing or using our platform, you agree to be bound by these Terms of Service. CenterInsider operates as a closed-network, peer-to-peer polling application designed exclusively for verified student communities. Users must authenticate via Google OAuth to maintain platform integrity and prevent sybil attacks (fake accounts). You agree to use the platform solely for its intended positive interactions. Any attempt to reverse-engineer, scrape data, harass other users, or manipulate the voting algorithms will result in immediate and permanent account termination. CenterInsider reserves the right to modify, suspend, or discontinue any aspect of the service at any time without prior notice. We do not guarantee uninterrupted access to the platform and shall not be held liable for any data loss, digital goods (e.g., Feed Drops, God Mode status) loss, or service downtimes. All intellectual property, including branding, UI/UX, and proprietary algorithms, remains the sole property of CenterInsider Inc.
                  </p>
                ) : (
                  <p style={{ margin: 0 }}>
                    CenterInsider is committed to protecting your privacy and digital footprint. When you authenticate using Google OAuth, we collect only minimal required data: your email address, name, and profile picture, strictly to verify your identity and map you to your local educational institute. Your voting activity is encrypted and anonymized by default. We do not sell your personal data, email addresses, or voting history to third-party data brokers or advertising networks. The identities behind sent votes remain strictly confidential unless a user explicitly utilizes platform mechanics (such as God Mode or referral milestones) to reveal interactions directed at them. You retain full ownership of your data; you may permanently delete your account and wipe all associated database records at any time via the Profile settings. By using the app, you consent to our secure data storage practices and targeted internal analytics used solely to improve the application experience.
                  </p>
                )}
              </div>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '18px'
                }}
                onClick={() => setLegalView(null)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
