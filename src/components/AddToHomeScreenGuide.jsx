import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddToHomeScreenGuide({ installPrompt, onInstallDirect }) {
  const [platform, setPlatform] = useState(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
      if (/android/i.test(ua)) return 'android';
    }
    return 'ios';
  });

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ width: '100%', maxWidth: '380px', margin: '16px auto', boxSizing: 'border-box' }}>
      {/* Trigger Pill / Compact Banner */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'linear-gradient(135deg, rgba(255, 85, 0, 0.12), rgba(251, 191, 36, 0.08))',
          border: '1px solid rgba(255, 85, 0, 0.3)',
          borderRadius: '16px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(255, 85, 0, 0.08)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff5500, #ff2e93)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 0 12px rgba(255, 85, 0, 0.4)'
            }}
          >
            📲
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Get the Full App Experience</span>
              <span style={{ background: 'rgba(255,255,255,0.15)', fontSize: '10px', padding: '2px 6px', borderRadius: '6px', color: '#fbbf24' }}>
                PWA
              </span>
            </div>
            <div style={{ color: '#a1a1aa', fontSize: '11px', marginTop: '1px' }}>
              Add to Home Screen (iOS & Android Guide)
            </div>
          </div>
        </div>

        <span style={{ color: '#ff7700', fontSize: '14px', fontWeight: '900' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </motion.div>

      {/* Expandable Step-by-Step Visual Onboarding Modal / Accordion */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            style={{
              overflow: 'hidden',
              background: '#121214',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '18px 16px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
              textAlign: 'left'
            }}
          >
            {/* Platform Selector Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setPlatform('ios')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: platform === 'ios' ? '1px solid #ff5500' : '1px solid #27272a',
                  background: platform === 'ios' ? 'rgba(255, 85, 0, 0.18)' : '#18181b',
                  color: platform === 'ios' ? '#ffffff' : '#71717a',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🍏</span>
                <span>iPhone (Safari)</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform('android')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '12px',
                  border: platform === 'android' ? '1px solid #ff5500' : '1px solid #27272a',
                  background: platform === 'android' ? 'rgba(255, 85, 0, 0.18)' : '#18181b',
                  color: platform === 'android' ? '#ffffff' : '#71717a',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🤖</span>
                <span>Android (Chrome)</span>
              </button>
            </div>

            {/* iOS Instructions */}
            {platform === 'ios' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#27272a', color: '#ff5500', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    1
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#d4d4d8', lineHeight: '1.4' }}>
                    Open in <strong>Safari</strong> and tap the <strong>Share button</strong>{' '}
                    <span style={{ display: 'inline-flex', padding: '2px 6px', background: '#27272a', borderRadius: '6px', color: '#38bdf8', fontWeight: '700' }}>
                      ⎋ (Box with arrow)
                    </span>{' '}
                    at the bottom of your screen.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#27272a', color: '#ff5500', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    2
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#d4d4d8', lineHeight: '1.4' }}>
                    Scroll down in the share sheet and tap{' '}
                    <strong style={{ color: '#ffffff' }}>"Add to Home Screen"</strong>{' '}
                    <span style={{ display: 'inline-flex', padding: '2px 6px', background: '#27272a', borderRadius: '6px', color: '#fbbf24', fontWeight: '900' }}>
                      [+]
                    </span>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#27272a', color: '#ff5500', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    3
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#d4d4d8', lineHeight: '1.4' }}>
                    Tap <strong style={{ color: '#ffffff' }}>"Add"</strong> in the top right. Launch CampusFeed directly from your home screen with zero browser bars!
                  </div>
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {platform === 'android' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {installPrompt && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => {
                      if (onInstallDirect) onInstallDirect();
                      else installPrompt.prompt();
                    }}
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #ff5500, #ff2e93)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(255, 85, 0, 0.3)',
                      marginBottom: '6px'
                    }}
                  >
                    <span>⚡</span>
                    <span>1-Click Install to Home Screen</span>
                  </motion.button>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#27272a', color: '#ff5500', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    1
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#d4d4d8', lineHeight: '1.4' }}>
                    In <strong>Chrome</strong>, tap the <strong>three dots menu</strong>{' '}
                    <span style={{ display: 'inline-flex', padding: '2px 6px', background: '#27272a', borderRadius: '6px', color: '#ffffff', fontWeight: '900' }}>
                      ⋮
                    </span>{' '}
                    in the top right.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#27272a', color: '#ff5500', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    2
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#d4d4d8', lineHeight: '1.4' }}>
                    Tap <strong style={{ color: '#ffffff' }}>"Install app"</strong> or{' '}
                    <strong style={{ color: '#ffffff' }}>"Add to Home screen"</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#27272a', color: '#ff5500', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    3
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#d4d4d8', lineHeight: '1.4' }}>
                    Confirm with <strong style={{ color: '#ffffff' }}>"Install"</strong>. CampusFeed will open full screen with native app performance!
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
