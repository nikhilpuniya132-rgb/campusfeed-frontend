import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AddToHomeScreenGuide from './AddToHomeScreenGuide';

export default function Landing({
  isAuthenticating,
  loginWithGoogle,
  loginWithPassword,
  handle,
  setHandle,
  password,
  setPassword,
  installPrompt
}) {
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [legalView, setLegalView] = useState(null);

  return (
    <div
      style={{
        minHeight: '100svh',
        width: '100%',
        maxWidth: '100%',
        background: '#0F0F0F',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}
    >
      {/* 1. Ultra-Clean Top Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 15, 15, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 50,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '900', letterSpacing: '0.04em' }}>
          <span style={{ fontSize: '18px' }}>🔥</span>
          <span style={{ color: '#ffffff' }}>CENTERINSIDER</span>
        </div>

        <div style={{
          background: 'rgba(255, 85, 0, 0.1)',
          border: '1px solid rgba(255, 85, 0, 0.3)',
          color: '#ff7700',
          padding: '4px 10px',
          borderRadius: '16px',
          fontSize: '11px',
          fontWeight: '800',
          letterSpacing: '0.04em'
        }}>
          🔥 BATHINDA
        </div>
      </header>

      {/* 2. Focused Main Card Area */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 18px 48px 18px',
          maxWidth: '420px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Hero Tagline */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#d4d4d8',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '16px'
            }}
          >
            <span>✦</span> The Coaching Loop
          </div>

          <h1
            style={{
              fontSize: 'clamp(28px, 7vw, 40px)',
              fontWeight: '900',
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              margin: '0 0 10px 0',
              color: '#ffffff'
            }}
          >
            STOP GUESSING.<br />
            <span style={{
              background: 'linear-gradient(135deg, #ffffff 40%, #ff5500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              START KNOWING.
            </span>
          </h1>

          <p style={{ fontSize: '13.5px', color: '#888888', margin: 0, lineHeight: 1.5, maxWidth: '320px', marginInline: 'auto' }}>
            The 100% anonymous compliment network for Bathinda coaching institutes & tuition hubs.
          </p>
        </div>

        {/* 3. Minimalist Auth Card (True Deep Dark #141416 / #1A1A1A) */}
        <div
          style={{
            width: '100%',
            background: '#141416',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '24px 20px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', margin: '0 0 4px 0' }}>
              Enter the Loop
            </h2>
            <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>
              One tap to see who voted for you
            </p>
          </div>

          {/* Primary Action: One-Tap with Google */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={loginWithGoogle}
            disabled={isAuthenticating}
            type="button"
            style={{
              width: '100%',
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '16px',
              padding: '14px 18px',
              fontSize: '14px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: isAuthenticating ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.1)',
              transition: 'transform 0.15s ease, opacity 0.15s ease',
              opacity: isAuthenticating ? 0.7 : 1
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '19px', height: '19px' }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span>{isAuthenticating ? 'Connecting...' : 'One-Tap with Google'}</span>
          </motion.button>

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#71717a', marginTop: '10px' }}>
            Zero passwords • Verified coaching identity
          </div>

          {/* Secondary Action: Username & Password for Seed / Test Accounts */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', marginTop: '18px', paddingTop: '14px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowManualLogin(!showManualLogin)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
            >
              {showManualLogin ? '▲ Hide manual login' : '▼ Use username & password (Seed Accounts)'}
            </button>

            {showManualLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}
              >
                <input
                  type="text"
                  placeholder="Username / Handle (e.g. gursharan)"
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid #27272a',
                    background: '#18181b',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid #27272a',
                    background: '#18181b',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={loginWithPassword}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#27272a',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#3f3f46'}
                  onMouseLeave={e => e.currentTarget.style.background = '#27272a'}
                >
                  Log In with Password
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* 4. Lightweight Add To Home Screen Widget */}
        <div style={{ width: '100%', marginTop: '14px' }}>
          <AddToHomeScreenGuide installPrompt={installPrompt} />
        </div>

        {/* 5. Minimalist Footer Disclaimer */}
        <footer style={{ marginTop: '20px', textAlign: 'center', fontSize: '11.5px', color: '#52525b', lineHeight: 1.5 }}>
          <span>By entering, you agree to our </span>
          <button
            type="button"
            onClick={() => setLegalView('terms')}
            style={{ background: 'none', border: 'none', padding: 0, color: '#a1a1aa', textDecoration: 'underline', cursor: 'pointer', fontSize: '11.5px' }}
          >
            Terms
          </button>
          <span> & </span>
          <button
            type="button"
            onClick={() => setLegalView('privacy')}
            style={{ background: 'none', border: 'none', padding: 0, color: '#a1a1aa', textDecoration: 'underline', cursor: 'pointer', fontSize: '11.5px' }}
          >
            Privacy Policy
          </button>
        </footer>
      </main>

      {/* Legal Modal Overlay */}
      <AnimatePresence>
        {legalView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLegalView(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#141416',
                color: '#fff',
                padding: '28px',
                borderRadius: '24px',
                maxWidth: '400px',
                width: '100%',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
              }}
            >
              <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '800' }}>
                {legalView === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
              </h2>
              <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                CenterInsider is an anonymous positive voting network built for coaching hubs & student communities. All compliments are pre-moderated to maintain a supportive environment.
              </p>
              <button
                type="button"
                onClick={() => setLegalView(null)}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#000000',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
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
