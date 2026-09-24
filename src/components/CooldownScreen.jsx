import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CooldownScreen({
  cooldownUntil,
  onSkip,
  onUpgrade,
  onCooldownFinished,
  user
}) {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!cooldownUntil) return 0;
    return Math.max(0, Math.floor((new Date(cooldownUntil).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!cooldownUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(cooldownUntil).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onCooldownFinished) onCooldownFinished();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil, onCooldownFinished]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleShareToSkip = async () => {
    const handle = (user?.handle || 'campus').replace(/^@/, '');
    const shareData = {
      title: 'CenterInsider',
      text: `Someone from your coaching hub voted for you on CenterInsider! Join to see who it is! Use my invite link: ${window.location.origin}/?ref=${handle}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // User closed or fallback
      }
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareData.text)}`, '_blank');
    }

    // Act of sharing clears cooldown for viral burst
    if (onSkip) onSkip();
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: '#1A1A1A',
          border: '1px solid #262626',
          borderRadius: '24px',
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
          boxShadow: 'none'
        }}
      >
        <span style={{ fontSize: '44px', marginBottom: '8px' }}>⏱️</span>
        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', margin: '0 0 6px 0' }}>
          Cooldown Active
        </h2>
        <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 20px 0', lineHeight: '1.4' }}>
          You've answered 12 polls! Take a breather while your classmates vote on you.
        </p>

        {/* Live Ticking Countdown Timer */}
        <div
          style={{
            background: '#0F0F0F',
            border: '1px solid #262626',
            borderRadius: '18px',
            padding: '16px 28px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '44px',
              fontWeight: '900',
              color: '#ffffff',
              letterSpacing: '2px',
            }}
          >
            {formattedTime}
          </div>
          <span style={{ fontSize: '11px', color: '#71717a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Next Poll Batch In
          </span>
        </div>

        {/* Bypass Paywall Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {/* Button 1: Minimalist Share Icon to Skip */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={handleShareToSkip}
              aria-label="Share Link"
              title="Share Link to Skip"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '1px solid #262626',
                background: '#262626',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'none'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </motion.button>
            <span style={{ fontSize: '11px', color: '#71717a' }}>Tap icon to share & skip</span>
          </div>

          {/* Button 2: Monetization (₹99/week God Mode) */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onUpgrade && onUpgrade(99)}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '14px',
              border: 'none',
              background: '#ffffff',
              color: '#000000',
              fontSize: '13.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'none'
            }}
          >
            <span>⚡</span> Pay ₹99 / Week for God Mode
          </motion.button>
        </div>
      </div>
    </div>
  );
}
