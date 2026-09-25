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
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: 'none',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
          >
            📲
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#000000', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Get the Full App Experience</span>
              <span style={{ background: '#e5e7eb', fontSize: '10px', padding: '2px 6px', borderRadius: '6px', color: '#111827', fontWeight: '700' }}>
                PWA
              </span>
            </div>
            <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '1px' }}>
              Add to Home Screen (iOS & Android Guide)
            </div>
          </div>
        </div>

        <span style={{ color: '#000000', fontSize: '14px', fontWeight: '900' }}>
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
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '20px',
              padding: '18px 16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
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
                  border: platform === 'ios' ? '1px solid #000000' : '1px solid #e5e7eb',
                  background: platform === 'ios' ? '#000000' : '#f3f4f6',
                  color: platform === 'ios' ? '#ffffff' : '#4b5563',
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
                  border: platform === 'android' ? '1px solid #000000' : '1px solid #e5e7eb',
                  background: platform === 'android' ? '#000000' : '#f3f4f6',
                  color: platform === 'android' ? '#ffffff' : '#4b5563',
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
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f3f4f6', color: '#000000', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                    1
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#374151', lineHeight: '1.4' }}>
                    Open in <strong>Safari</strong> and tap the <strong>Share button</strong>{' '}
                    <span style={{ display: 'inline-flex', padding: '2px 6px', background: '#f3f4f6', borderRadius: '6px', color: '#111827', fontWeight: '700' }}>
                      ⎋ (Box with arrow)
                    </span>{' '}
                    at the bottom of your screen.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f3f4f6', color: '#000000', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                    2
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#374151', lineHeight: '1.4' }}>
                    Scroll down in the share sheet and tap{' '}
                    <strong style={{ color: '#000000' }}>"Add to Home Screen"</strong>{' '}
                    <span style={{ display: 'inline-flex', padding: '2px 6px', background: '#f3f4f6', borderRadius: '6px', color: '#111827', fontWeight: '900' }}>
                      [+]
                    </span>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f3f4f6', color: '#000000', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                    3
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#374151', lineHeight: '1.4' }}>
                    Tap <strong style={{ color: '#000000' }}>"Add"</strong> in the top right. Launch CenterInsider directly from your home screen with zero browser bars!
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
                      background: '#000000',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: 'none',
                      marginBottom: '6px'
                    }}
                  >
                    <span>⚡</span>
                    <span>1-Click Install to Home Screen</span>
                  </motion.button>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f3f4f6', color: '#000000', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                    1
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#374151', lineHeight: '1.4' }}>
                    In <strong>Chrome</strong>, tap the <strong>three dots menu</strong>{' '}
                    <span style={{ display: 'inline-flex', padding: '2px 6px', background: '#f3f4f6', borderRadius: '6px', color: '#111827', fontWeight: '900' }}>
                      ⋮
                    </span>{' '}
                    in the top right.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f3f4f6', color: '#000000', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                    2
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#374151', lineHeight: '1.4' }}>
                    Tap <strong style={{ color: '#000000' }}>"Install app"</strong> or{' '}
                    <strong style={{ color: '#000000' }}>"Add to Home screen"</strong>.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f3f4f6', color: '#000000', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                    3
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#374151', lineHeight: '1.4' }}>
                    Confirm with <strong style={{ color: '#000000' }}>"Install"</strong>. CenterInsider will open full screen with native app performance!
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
