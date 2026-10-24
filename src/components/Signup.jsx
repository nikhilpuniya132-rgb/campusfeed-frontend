import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '../useNavigate';
import { ShieldCheck, Sparkles, Flame, Users, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

export default function Signup({
  loginWithGoogle,
  isAuthenticating: propIsAuthenticating = false,
  legalView: propLegalView,
  setLegalView: propSetLegalView
}) {
  const navigate = useNavigate();
  const [localLegalView, setLocalLegalView] = useState(null);
  const legalView = propLegalView !== undefined ? propLegalView : localLegalView;
  const setLegalView = propSetLegalView || setLocalLegalView;
  const [referralCode, setReferralCode] = useState('');
  const [localIsAuthenticating, setLocalIsAuthenticating] = useState(false);
  const isAuthenticating = Boolean(propIsAuthenticating || localIsAuthenticating);

  // Capture ?ref= query parameter from ad URL and persist
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
      console.error('Error capturing referral parameter on /signup:', e);
    }
  }, []);

  const handleSignUpClick = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    // Physical multi-click prevention guard
    if (isAuthenticating) return;

    // 1. Instant UI Feedback: Triggers the exact millisecond the button is tapped
    setLocalIsAuthenticating(true);

    // Synchronous storage preparation (0ms delay)
    try {
      localStorage.removeItem('pre_selected_school');
      localStorage.removeItem('campus_institute');
      localStorage.removeItem('campus_stream');
      localStorage.removeItem('campus_grade');
      localStorage.removeItem('campus_hub');
      sessionStorage.removeItem('pre_selected_school');

      if (referralCode) {
        localStorage.setItem('referred_by', referralCode);
        localStorage.setItem('campus_ref_code', referralCode);
        sessionStorage.setItem('referred_by', referralCode);
        sessionStorage.setItem('campus_ref_code', referralCode);
      }
    } catch (_) {}

    // 2. Synchronous Execution: Trigger supabase.auth.signInWithOAuth() immediately inside onClick handler
    // Strip out all pre-flight DB checks and asynchronous state delay
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://centerinsider.vercel.app/onboarding',
          skipBrowserRedirect: false,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          },
        },
      });

      if (error) {
        alert("Login Failed: " + error.message);
        setLocalIsAuthenticating(false);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setLocalIsAuthenticating(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100svh',
        width: '100%',
        backgroundColor: '#000000',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 20px',
        position: 'relative',
        overflowX: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '400px',
          background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.18) 0%, rgba(59, 130, 246, 0.12) 40%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Top Header / Brand Logo */}
      <header
        style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1,
          paddingTop: '8px'
        }}
      >
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '20px' }}>🔥</span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: '900',
              letterSpacing: '-0.5px',
              color: '#ffffff'
            }}
          >
            CampusFeed
          </span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid #27272a',
            color: '#a1a1aa',
            fontSize: '12px',
            fontWeight: '700',
            padding: '6px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#3f3f46';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#a1a1aa';
            e.currentTarget.style.borderColor = '#27272a';
          }}
        >
          Explore App
        </button>
      </header>

      {/* Main Authentication Card */}
      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '420px',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          margin: 'auto 0',
          padding: '24px 0'
        }}
      >
        {/* Pill Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '9999px',
            padding: '6px 14px',
            marginBottom: '18px',
            fontSize: '12px',
            fontWeight: '800',
            color: '#e4e4e7',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)'
          }}
        >
          <Sparkles size={13} style={{ color: '#fbbf24' }} />
          <span>The 100% Anonymous School Network</span>
        </div>

        {/* Dynamic Referral Banner */}
        {referralCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'rgba(22, 101, 52, 0.25)',
              border: '1px solid #166534',
              color: '#4ade80',
              fontSize: '12px',
              fontWeight: '800',
              padding: '6px 14px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px'
            }}
          >
            <span>🎁</span> Invited by @{referralCode} • Priority Access
          </motion.div>
        )}

        {/* Hero Title */}
        <h1
          style={{
            fontSize: 'clamp(28px, 7vw, 36px)',
            fontWeight: '900',
            lineHeight: 1.15,
            letterSpacing: '-0.8px',
            margin: '0 0 12px 0',
            color: '#ffffff'
          }}
        >
          Answer viral polls.<br />
          <span style={{ color: '#a1a1aa' }}>Discover admirers.</span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '14.5px',
            color: '#a1a1aa',
            lineHeight: 1.5,
            margin: '0 0 28px 0',
            maxWidth: '340px',
            fontWeight: '500'
          }}
        >
          See who voted for you in school polls, vote anonymously for your classmates, and enter the inner campus circle.
        </p>

        {/* Minimal Auth Card Container */}
        <div
          style={{
            width: '100%',
            background: 'rgba(15, 15, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid #27272a',
            borderRadius: '28px',
            padding: '28px 22px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.04)',
            boxSizing: 'border-box'
          }}
        >
          {/* Keyframes for smooth instant spinner */}
          <style>{`
            @keyframes spin-fast {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>

          {/* Frictionless One-Touch CTA Button */}
          <motion.button
            whileTap={isAuthenticating ? {} : { scale: 0.98 }}
            whileHover={isAuthenticating ? {} : { scale: 1.01 }}
            onClick={handleSignUpClick}
            disabled={isAuthenticating}
            type="button"
            id="ad-signup-google-btn"
            style={{
              width: '100%',
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '18px',
              fontWeight: '900',
              fontSize: '15px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: isAuthenticating ? 'not-allowed' : 'pointer',
              pointerEvents: isAuthenticating ? 'none' : 'auto',
              opacity: isAuthenticating ? 0.75 : 1,
              boxShadow: isAuthenticating 
                ? '0 2px 10px rgba(255, 255, 255, 0.1)' 
                : '0 4px 20px rgba(255, 255, 255, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            {isAuthenticating ? (
              <>
                <Loader2
                  size={20}
                  style={{
                    animation: 'spin-fast 0.8s linear infinite',
                    color: '#000000',
                    flexShrink: 0
                  }}
                />
                <span style={{ letterSpacing: '-0.2px' }}>Connecting...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" style={{ width: '22px', height: '22px', flexShrink: 0 }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span style={{ letterSpacing: '-0.2px' }}>Sign Up with Google</span>
              </>
            )}
          </motion.button>

          {/* Social Proof Badges under CTA */}
          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              fontSize: '11.5px',
              color: '#71717a',
              fontWeight: '700'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} style={{ color: '#22c55e' }} /> 100% Anonymous
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} style={{ color: '#fbbf24' }} /> Free Forever
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Users size={14} style={{ color: '#60a5fa' }} /> 12.4k+ Votes
            </span>
          </div>
        </div>

        {/* Simple alternate option */}
        <p
          style={{
            marginTop: '20px',
            fontSize: '13px',
            color: '#71717a',
            fontWeight: '600'
          }}
        >
          Already have an account?{' '}
          <span
            onClick={isAuthenticating ? undefined : handleSignUpClick}
            style={{
              color: '#ffffff',
              fontWeight: '800',
              cursor: isAuthenticating ? 'not-allowed' : 'pointer',
              pointerEvents: isAuthenticating ? 'none' : 'auto',
              opacity: isAuthenticating ? 0.6 : 1,
              textDecoration: 'underline'
            }}
          >
            Log in with Google
          </span>
        </p>
      </motion.main>

      {/* Footer Navigation & Legal Links */}
      <footer
        style={{
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center',
          fontSize: '11px',
          color: '#52525b',
          fontWeight: '600',
          zIndex: 1,
          paddingBottom: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
          <span
            onClick={() => setLegalView('terms')}
            style={{ cursor: 'pointer', color: '#71717a', textDecoration: 'underline' }}
          >
            Terms of Service
          </span>
          <span>•</span>
          <span
            onClick={() => setLegalView('privacy')}
            style={{ cursor: 'pointer', color: '#71717a', textDecoration: 'underline' }}
          >
            Privacy Policy
          </span>
        </div>
        <div>By continuing, you agree to CampusFeed's Community Standards.</div>
      </footer>

      {/* Terms & Privacy Slide-Over / Modal */}
      <AnimatePresence>
        {legalView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setLegalView(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '24px',
                padding: '28px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '80vh',
                overflowY: 'auto',
                color: '#ffffff',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>
                  {legalView === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </h3>
                <button
                  type="button"
                  onClick={() => setLegalView(null)}
                  style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.6 }}>
                {legalView === 'terms' ? (
                  <>
                    <p><strong>1. Anonymous Polling Community:</strong> CampusFeed provides an uplifting, positive polling network for schools and coaching institutes. Bullying, defamation, targeted harassment, or explicit content results in immediate permanent bans.</p>
                    <p><strong>2. Account & Eligibility:</strong> You are responsible for maintaining the confidentiality of your credentials. Each user may hold only one active account linked to their authentic campus identity.</p>
                    <p><strong>3. Content & Moderation:</strong> All user-generated polls pass through automated filtering and human review. Inappropriate poll submissions will be discarded.</p>
                  </>
                ) : (
                  <>
                    <p><strong>1. Data Encryption:</strong> Your voter identity is cryptographically pseudonymized on poll submissions. Classmates cannot see who cast individual votes unless you are revealed via legitimate in-app features.</p>
                    <p><strong>2. Information We Collect:</strong> We collect your email and basic Google profile name for identity verification, and your self-reported school and grade to route relevant campus polls.</p>
                    <p><strong>3. Data Deletion:</strong> You have full rights to request complete account deletion at any time via Settings, which wipes your profile and friendships permanently.</p>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setLegalView(null)}
                style={{
                  marginTop: '22px',
                  width: '100%',
                  padding: '12px',
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
