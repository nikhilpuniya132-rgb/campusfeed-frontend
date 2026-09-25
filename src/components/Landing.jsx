import React, { useRef, useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion';
import AddToHomeScreenGuide from './AddToHomeScreenGuide';
import InstituteCombobox, { findHubForInstitute } from './InstituteCombobox';

const InteractivePollDemo = lazy(() => import('./InteractivePollDemo'));
const HolographicCard = lazy(() => import('./HolographicCard'));

export default function Landing({
  grade = '11',
  setGrade = () => {},
  stream = '11th Medical',
  setStream = () => {},
  institute = 'Kapil Institute',
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
    <div className="gas-landing-wrapper" style={{ background: '#0F0F0F', color: '#ffffff' }}>
      {/* 1. Top Navbar */}
      <header className="gas-landing-nav" style={{ background: 'rgba(15, 15, 15, 0.9)', borderBottom: '1px solid #262626' }}>
        <div className="gas-logo">
          <span className="flame-icon">🔥</span>
          <span style={{ color: '#ffffff' }}>CENTERINSIDER</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="gas-school-badge" style={{ border: '1px solid #262626', background: 'rgba(255, 255, 255, 0.04)', color: '#a1a1aa', fontWeight: '800', letterSpacing: '0.04em' }}>
            🔥 BATHINDA COACHING NETWORK
          </span>

          <div className="tooltip-wrapper">
            <li className="nav-link" style={{ listStyle: 'none' }}>
              <div className="tooltip-tab" style={{ color: '#a1a1aa', border: '1px solid #262626', background: '#1A1A1A' }}>
                <span>Support</span>
                <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', fill: 'currentColor' }}><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" /></svg>
              </div>
              <div className="tooltip" style={{ background: '#1A1A1A', border: '1px solid #262626', boxShadow: 'none' }}>
                <ul className="tooltip-menu-with-icon" style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                  <div style={{ padding: '8px 12px', fontSize: '11px', color: '#71717a', borderBottom: '1px solid #262626', textAlign: 'center' }}>
                    Available 3 PM - 6 PM
                  </div>
                  <li className="tooltip-link">
                    <a href="https://instagram.com/_nikhilpuniyaai" target="_blank" rel="noreferrer" style={{ color: '#a1a1aa' }}>
                      @_nikhilpuniyaai
                    </a>
                  </li>
                  <li className="tooltip-link">
                    <a href="mailto:nikhilpuniya132@gmail.com" style={{ color: '#a1a1aa' }}>
                      nikhilpuniya132@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
            </li>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section ref={heroRef} className="gas-hero-section">
        <motion.div
          className="gas-hero-text"
          style={{
            opacity: heroTextOpacity,
            y: heroTextY
          }}
        >
          <div className="gas-pill-badge" style={{ border: '1px solid #262626', background: 'rgba(255, 255, 255, 0.04)', color: '#a1a1aa' }}>
            <span>✦</span> The Anonymous Loop for Bathinda Coaching Hubs
          </div>

          <h1 className="gas-hero-title">
            STOP GUESSING.<br />
            <span style={{ color: '#ffffff' }}>START KNOWING.</span>
          </h1>

          <p className="gas-hero-subtitle" style={{ color: '#a1a1aa' }}>
            The 100% anonymous school voting network. Answer viral polls about your classmates, see who voted for you, and discover your secret admirers.
          </p>

          <div className="gas-desktop-only">
            <div className="gas-hero-stats">
              <div className="gas-stat-card" style={{ background: '#1A1A1A', border: '1px solid #262626', boxShadow: 'none' }}>
                <span className="gas-stat-number" style={{ color: '#ffffff' }}>12,480+</span>
                <span className="gas-stat-label" style={{ color: '#71717a' }}>Votes Cast</span>
              </div>
              <div className="gas-stat-card" style={{ background: '#1A1A1A', border: '1px solid #262626', boxShadow: 'none' }}>
                <span className="gas-stat-number" style={{ color: '#ffffff' }}>100%</span>
                <span className="gas-stat-label" style={{ color: '#71717a' }}>Anonymous</span>
              </div>
              <div className="gas-stat-card" style={{ background: '#1A1A1A', border: '1px solid #262626', boxShadow: 'none' }}>
                <span className="gas-stat-number" style={{ color: '#ffffff', fontSize: '13px' }}>Class 11, 12 & Droppers</span>
                <span className="gas-stat-label" style={{ color: '#71717a' }}>Bathinda Hubs</span>
              </div>
            </div>

            <div className="gas-hero-cta-group">
              <button
                className="magic-btn"
                onClick={() => document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: '#ffffff', color: '#000000', border: 'none', boxShadow: 'none', fontWeight: '800' }}
              >
                ENTER NETWORK ➔
              </button>
            </div>
          </div>
        </motion.div>

        {/* 3D Showcase Interactive Stage with Chips */}
        <motion.div
          className="gas-hero-3d-stage"
          style={{
            scale: stageScale,
            rotateX: stageRotateX,
            opacity: stageOpacity
          }}
        >
          <div className="gas-float-chip gas-float-chip-1" style={{ background: '#1A1A1A', border: '1px solid #262626', color: '#e4e4e7', boxShadow: 'none' }}>
            <span>🔥</span> Someone secretly picked you
          </div>
          <div className="gas-float-chip gas-float-chip-2" style={{ background: '#1A1A1A', border: '1px solid #262626', color: '#e4e4e7', boxShadow: 'none' }}>
            <span>👑</span> 100% Private & Anonymous
          </div>

          <Suspense fallback={<div style={{ minHeight: '340px' }} />}>
            <InteractivePollDemo onVoteAction={() => document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' })} />
          </Suspense>
        </motion.div>

        {/* Mobile-Only CTA */}
        <div className="gas-mobile-only" style={{ width: '100%', marginTop: '20px' }}>
          <div className="gas-hero-cta-group">
            <button
              className="magic-btn"
              onClick={() => document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: '#ffffff', color: '#000000', border: 'none', boxShadow: 'none', fontWeight: '800' }}
            >
              ENTER NETWORK ➔
            </button>
          </div>

          <div className="gas-hero-stats">
            <div className="gas-stat-card" style={{ background: '#1A1A1A', border: '1px solid #262626', boxShadow: 'none' }}>
              <span className="gas-stat-number" style={{ color: '#ffffff' }}>12,480+</span>
              <span className="gas-stat-label" style={{ color: '#71717a' }}>Votes</span>
            </div>
            <div className="gas-stat-card" style={{ background: '#1A1A1A', border: '1px solid #262626', boxShadow: 'none' }}>
              <span className="gas-stat-number" style={{ color: '#ffffff' }}>100%</span>
              <span className="gas-stat-label" style={{ color: '#71717a' }}>Anonymous</span>
            </div>
            <div className="gas-stat-card" style={{ background: '#1A1A1A', border: '1px solid #262626', boxShadow: 'none' }}>
              <span className="gas-stat-number" style={{ color: '#ffffff', fontSize: '13px' }}>Class 11, 12 & Droppers</span>
              <span className="gas-stat-label" style={{ color: '#71717a' }}>Bathinda Hubs</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Pricing Portal Section (Restored: ₹99/week and ₹149/month side-by-side) */}
      <section id="pricing-portal" ref={pricingRef} className="pricing-section">
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
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span className="gas-pill-badge" style={{ border: '1px solid #262626', background: 'rgba(255, 255, 255, 0.04)', color: '#a1a1aa' }}>
              👑 VIP Access
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 900, margin: '12px 0', color: '#ffffff', letterSpacing: '-1px' }}>
              Unlock God Mode.
            </h2>
            <p style={{ color: '#a1a1aa', maxWidth: '440px', margin: '0 auto', fontSize: '14px', lineHeight: 1.5 }}>
              Stop wondering who voted for you. Reveal real names, equip exclusive aura rings, and dominate the school leaderboard.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '900px' }}>
            <div className="gas-pricing-desktop-only">
              <Suspense fallback={<div style={{ minHeight: '380px' }} />}>
                <HolographicCard
                  title="GOD MODE"
                  subtitle="See Who Voted For You"
                  price={activePlan === 'weekly' ? '₹99' : activePlan === 'monthly' ? '₹149' : '₹0'}
                  period={activePlan === 'weekly' ? '/week' : activePlan === 'monthly' ? '/month' : '/forever'}
                  onAction={() => {
                    if (activePlan === 'basic') {
                      document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      handleUpgrade(activePlan === 'weekly' ? 99 : 149);
                    }
                  }}
                  actionText={activePlan === 'basic' ? 'Get Started Free ➔' : `Pay ₹${activePlan === 'weekly' ? '99' : '149'} Instantly ⚡`}
                />
              </Suspense>
            </div>

            <div className="pricing-modal" style={{ background: '#1A1A1A', border: '1px solid #262626', boxShadow: 'none' }}>
              <h3 className="pricing-title" style={{ color: '#ffffff' }}>Choose Your Access</h3>
              <p className="pricing-description" style={{ color: '#a1a1aa' }}>Instantly activates across all Bathinda Coaching Hub polls.</p>

              {/* Side-by-Side Paid Tiers (₹99/week & ₹149/month) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginBottom: '14px' }}>
                <div
                  onClick={() => setActivePlan('weekly')}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '14px',
                    border: activePlan === 'weekly' ? '2px solid #ffffff' : '1px solid #262626',
                    background: activePlan === 'weekly' ? 'rgba(255, 255, 255, 0.08)' : '#121214',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: '800', color: activePlan === 'weekly' ? '#ffffff' : '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Weekly Pass
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', margin: '4px 0' }}>
                    ₹99
                    <span style={{ fontSize: '11px', color: '#71717a', fontWeight: '600' }}>/wk</span>
                  </div>
                  <div style={{ fontSize: '10px', color: activePlan === 'weekly' ? '#e4e4e7' : '#71717a', fontWeight: '700' }}>
                    ⚡ 7 Days Access
                  </div>
                </div>

                <div
                  onClick={() => setActivePlan('monthly')}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '14px',
                    border: activePlan === 'monthly' ? '2px solid #fbbf24' : '1px solid #262626',
                    background: activePlan === 'monthly' ? 'rgba(251, 191, 36, 0.09)' : '#121214',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-9px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#fbbf24',
                    color: '#000000',
                    fontSize: '8.5px',
                    fontWeight: '900',
                    padding: '2px 7px',
                    borderRadius: '6px',
                    letterSpacing: '0.03em',
                    whiteSpace: 'nowrap'
                  }}>
                    SAVE 62%
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: activePlan === 'monthly' ? '#fbbf24' : '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Monthly Pass
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', margin: '4px 0' }}>
                    ₹149
                    <span style={{ fontSize: '11px', color: '#71717a', fontWeight: '600' }}>/mo</span>
                  </div>
                  <div style={{ fontSize: '10px', color: activePlan === 'monthly' ? '#fbbf24' : '#71717a', fontWeight: '700' }}>
                    👑 Best Value (~₹37/wk)
                  </div>
                </div>
              </div>

              {/* Pricing Tabs: Basic vs God Mode options */}
              <div className="tab-container" style={{ background: '#0F0F0F', border: '1px solid #262626', marginBottom: '14px' }}>
                <button
                  className="tab"
                  data-active={activePlan === 'basic'}
                  onClick={() => setActivePlan('basic')}
                  style={{
                    background: activePlan === 'basic' ? '#262626' : 'transparent',
                    color: activePlan === 'basic' ? '#ffffff' : '#71717a',
                    fontWeight: '800'
                  }}
                >
                  Basic (Free)
                </button>
                <button
                  className="tab"
                  data-active={activePlan === 'weekly'}
                  onClick={() => setActivePlan('weekly')}
                  style={{
                    background: activePlan === 'weekly' ? '#262626' : 'transparent',
                    color: activePlan === 'weekly' ? '#ffffff' : '#71717a',
                    fontWeight: '800'
                  }}
                >
                  Weekly (₹99)
                </button>
                <button
                  className="tab"
                  data-active={activePlan === 'monthly'}
                  onClick={() => setActivePlan('monthly')}
                  style={{
                    background: activePlan === 'monthly' ? '#262626' : 'transparent',
                    color: activePlan === 'monthly' ? '#ffffff' : '#71717a',
                    fontWeight: '800'
                  }}
                >
                  Monthly (₹149)
                </button>
              </div>

              <div className="benefits" style={{ borderTop: '1px solid #262626' }}>
                <span style={{ color: '#71717a' }}>What's included</span>
                <ul style={{ padding: 0, margin: '8px 0 0 0', listStyle: 'none' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d4d4d8', fontSize: '13px', margin: '8px 0' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Unlimited Poll Votes (No 30m Cooldowns)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d4d4d8', fontSize: '13px', margin: '8px 0' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Instant Real Name Reveals (Bypass 3 Recruits)</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d4d4d8', fontSize: '13px', margin: '8px 0' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Exclusive Verified VIP Crown Badge</span>
                  </li>
                  {activePlan !== 'basic' && (
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d4d4d8', fontSize: '13px', margin: '8px 0' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Equip Animated God Mode Aura Rings</span>
                    </li>
                  )}
                  {activePlan === 'monthly' && (
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '13px', margin: '8px 0' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span style={{ fontWeight: '700' }}>Save 62% vs Weekly Pass (~₹37/week)</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="modal--footer" style={{ borderTop: '1px solid #262626', paddingTop: '16px' }}>
                <div className="price" style={{ color: '#ffffff' }}>
                  <sup style={{ color: '#71717a' }}>₹</sup>{activePlan === 'basic' ? '0' : activePlan === 'weekly' ? '99' : '149'}
                  <sub style={{ color: '#71717a' }}>/{activePlan === 'basic' ? 'forever' : activePlan === 'weekly' ? 'week' : 'month'}</sub>
                </div>

                {activePlan === 'basic' ? (
                  <button
                    className="upgrade-btn"
                    style={{ background: '#262626', color: '#ffffff', border: '1px solid #3f3f46', borderRadius: '12px', padding: '12px 20px', fontWeight: '800', cursor: 'pointer' }}
                    onClick={() => document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Start Free
                  </button>
                ) : (
                  <button
                    className="upgrade-btn"
                    style={{
                      background: activePlan === 'monthly' ? '#fbbf24' : '#ffffff',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 20px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleUpgrade(activePlan === 'weekly' ? 99 : 149)}
                  >
                    Pay ₹{activePlan === 'weekly' ? '99' : '149'} {activePlan === 'monthly' ? '/ Month' : '/ Week'} ⚡
                  </button>
                )}
              </div>
            </div>
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
          position: 'relative'
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
              background: '#1A1A1A',
              border: '1px solid #262626',
              borderRadius: '24px',
              padding: '24px 20px',
              boxShadow: 'none'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid #262626',
                  color: '#a1a1aa',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  letterSpacing: '0.04em'
                }}
              >
                ⚡ 1-TAP ONE-TOUCH ACCESS
              </span>
            </div>

            <p style={{ marginTop: '8px', textAlign: 'center', fontSize: '14px', color: '#ffffff' }}>
              Join the Loop.
              <span style={{ color: '#a1a1aa', fontWeight: '600', display: 'block', marginTop: '2px', fontSize: '12.5px' }}>
                Select your Coaching Hub to enter the loop.
              </span>
            </p>

            {/* Searchable Institute Combobox */}
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                Coaching Institute
              </label>
              <InstituteCombobox
                value={institute}
                onChange={(val) => {
                  setInstitute(val);
                  setCoachingHub(findHubForInstitute(val));
                }}
                onSelectHub={(hub) => setCoachingHub(hub)}
              />
              <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#a1a1aa', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>📍 Hub:</span>
                <span style={{ color: '#ffffff' }}>{coachingHub || findHubForInstitute(institute)}</span>
              </div>
            </div>

            {/* Stream Selection Pills (Single Horizontal Scrolling Row per Task 2) */}
            <div style={{ marginBottom: '18px', textAlign: 'left' }}>
              <label style={{ fontSize: '11px', fontWeight: '800', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                Batch / Stream
              </label>
              <div
                className="flex flex-nowrap overflow-x-auto hide-scrollbar"
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  overflowX: 'auto',
                  gap: '8px',
                  paddingBottom: '4px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {['11th Medical', '11th Non-Med', '12th Commerce', 'Dropper'].map((s) => {
                  const isSelected = stream === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        if (window.navigator?.vibrate) window.navigator.vibrate(8);
                        setStream(s);
                        setGrade(s.includes('12') ? '12' : s.includes('drop') ? 'dropper' : '11');
                      }}
                      style={{
                        flexShrink: 0,
                        padding: '9px 14px',
                        borderRadius: '12px',
                        border: isSelected ? '1px solid #ffffff' : '1px solid #262626',
                        background: isSelected ? '#262626' : '#141416',
                        color: isSelected ? '#ffffff' : '#71717a',
                        fontWeight: '800',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prioritized One-Tap Google Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="oauthButton"
              onClick={loginWithGoogle}
              disabled={isAuthenticating}
              type="button"
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#000000',
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
                boxShadow: 'none'
              }}
            >
              <svg className="icon" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>{isAuthenticating ? 'Connecting...' : 'One-Tap with Google'}</span>
            </motion.button>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#71717a', marginTop: '8px' }}>
              Zero passwords • Instant student verification
            </div>

            {/* De-emphasized Manual / Test Accounts Accordion */}
            <div style={{ width: '100%', borderTop: '1px solid #262626', paddingTop: '16px', marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowManualLogin(!showManualLogin)}
                style={{ background: 'transparent', border: 'none', color: '#71717a', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', transition: 'color 0.2s' }}
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
                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid #262626', background: '#141416', color: '#fff', fontSize: '14px', outline: 'none' }}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ padding: '12px', borderRadius: '12px', border: '1px solid #262626', background: '#141416', color: '#fff', fontSize: '14px', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={doPasswordLogin}
                    style={{ padding: '12px', borderRadius: '12px', border: 'none', background: '#262626', color: '#ffffff', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s' }}
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

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#71717a' }}>
            <p>
              By entering, you agree to our <br />
              <span onClick={() => setLegalView('terms')} style={{ color: '#a1a1aa', textDecoration: 'underline', cursor: 'pointer' }}>
                Terms & Conditions
              </span>{' '}
              and{' '}
              <span onClick={() => setLegalView('privacy')} style={{ color: '#a1a1aa', textDecoration: 'underline', cursor: 'pointer' }}>
                Privacy Policy
              </span>
            </p>
          </div>
        </motion.div>
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
              background: 'rgba(0, 0, 0, 0.85)',
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
                background: '#1A1A1A',
                color: '#fff',
                padding: '28px',
                borderRadius: '24px',
                maxWidth: '420px',
                width: '100%',
                border: '1px solid #262626',
                boxShadow: 'none'
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ color: '#ffffff', marginTop: 0, fontSize: '20px', fontWeight: 800 }}>
                {legalView === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
              </h2>
              <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: '1.6' }}>
                CenterInsider is an anonymous positive voting platform built for coaching hubs & student communities. Compliments are moderated to promote positivity.
              </p>
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '16px'
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
