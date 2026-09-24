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
          background: '#111111',
          border: '1px solid #222222',
          borderRadius: '24px',
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ fontSize: '44px', marginBottom: '8px' }}>⏱️</span>
        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '0 0 6px 0' }}>
          Cooldown Active
        </h2>
        <p style={{ fontSize: '13px', color: '#888888', margin: '0 0 20px 0', lineHeight: '1.4' }}>
          You've answered 12 polls! Take a breather while your classmates vote on you.
        </p>

        {/* Live Ticking Countdown Timer */}
        <div
          style={{
            background: '#0a0a0a',
            border: '1px solid #1f1f1f',
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
              color: '#fff',
              letterSpacing: '2px',
            }}
          >
            {formattedTime}
          </div>
          <span style={{ fontSize: '11px', color: '#777777', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Next Poll Batch In
          </span>
        </div>

        {/* Bypass Paywall Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Button 1: Viral Loop */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleShareToSkip}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              border: 'none',
              background: '#25D366',
              color: '#000',
              fontSize: '14px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>📲</span> Invite Friends to Skip
          </motion.button>

          {/* Button 2: Monetization */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onUpgrade && onUpgrade(99)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid #333333',
              background: '#18181b',
              color: '#fbbf24',
              fontSize: '14px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>👑</span> Buy God Mode (₹99) • Zero Wait
          </motion.button>
        </div>
      </div>
    </div>
  );
}
