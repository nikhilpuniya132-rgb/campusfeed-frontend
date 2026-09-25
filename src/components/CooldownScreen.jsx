import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from '../supabase';
import { handleShare, showShareToast } from '../utils/share';

const API = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://localhost:5000/api'
  : 'https://campusfeed-backend-po4g.onrender.com/api';

export default function CooldownScreen({
  cooldownUntil,
  onSkip,
  onUpgrade,
  onCooldownFinished,
  onCooldownUnlocked,
  user
}) {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!cooldownUntil) return 0;
    return Math.max(0, Math.floor((new Date(cooldownUntil).getTime() - Date.now()) / 1000));
  });

  const [hasShared, setHasShared] = useState(false);
  const isUnlockedRef = useRef(false);

  // Local tick-down interval for countdown display
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

  // Real-time backend polling & Supabase subscription to auto-unlock when friend joins
  useEffect(() => {
    if (!user?.id || !cooldownUntil) return;

    let isMounted = true;

    const handleUnlockSuccess = () => {
      if (isUnlockedRef.current) return;
      isUnlockedRef.current = true;

      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#10b981', '#34d399', '#fbbf24', '#ffffff']
      });

      showShareToast('Friend joined! Voting unlocked.');

      if (onCooldownUnlocked) {
        onCooldownUnlocked();
      } else if (onCooldownFinished) {
        onCooldownFinished();
      }
    };

    // 1. Polling interval every 6 seconds checking user's database record
    const pollInterval = setInterval(async () => {
      if (!isMounted || isUnlockedRef.current) return;
      try {
        // Direct Supabase query check
        const { data: dbUser } = await supabase
          .from('users')
          .select('cooldown_until, cooldown_expires_at, session_vote_count')
          .eq('id', user.id)
          .maybeSingle();

        if (dbUser) {
          const activeCd = dbUser.cooldown_until || dbUser.cooldown_expires_at;
          if (!activeCd || new Date(activeCd).getTime() <= Date.now()) {
            handleUnlockSuccess();
            return;
          }
        }

        // Secondary check against backend endpoint
        const res = await fetch(`${API}/user/cooldown/${user.id}`);
        if (res.ok) {
          const status = await res.json();
          if (status && !status.is_cooldown_active && !status.cooldown_until) {
            handleUnlockSuccess();
            return;
          }
        }
      } catch (pollErr) {
        console.warn('Cooldown polling check:', pollErr);
      }
    }, 6000);

    // 2. Real-time Supabase postgres_changes listener
    const channel = supabase
      .channel(`cooldown-user-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (!isMounted || isUnlockedRef.current) return;
          const updated = payload.new;
          if (updated) {
            const activeCd = updated.cooldown_until || updated.cooldown_expires_at;
            if (!activeCd || new Date(activeCd).getTime() <= Date.now()) {
              handleUnlockSuccess();
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [user?.id, cooldownUntil, onCooldownUnlocked, onCooldownFinished]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleShareToSkip = async () => {
    // Generate trackable share link appending current user's invite code
    const inviteCode = (user?.inviteCode || user?.invite_code || user?.my_invite_code || user?.handle || 'campus').replace(/^@/, '');
    const baseOrigin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'https://centerinsider.vercel.app';
    const shareUrl = `${baseOrigin}/?ref=${encodeURIComponent(inviteCode)}`;
    const shareText = `Someone from your coaching hub voted for you on CenterInsider! Join to see who it is! Use my invite link: ${shareUrl}`;

    await handleShare({
      title: 'CenterInsider',
      text: shareText,
      url: shareUrl
    });

    setHasShared(true);

    // CRITICAL: REMOVED client-side cooldown skip!
    // The UI remains strictly locked until the database confirms a friend logged in using this ref code.
    showShareToast('Invite link shared! Timer unlocks once a friend logs in.');
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
            marginBottom: '20px',
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

        {/* Real-time referral loop helper status */}
        <div
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid #262626',
            borderRadius: '14px',
            padding: '10px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '11.5px',
            color: '#a1a1aa'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: hasShared ? '#10b981' : '#f59e0b',
              boxShadow: hasShared ? '0 0 10px #10b981' : '0 0 8px #f59e0b',
              display: 'inline-block'
            }}
          />
          <span>
            {hasShared
              ? 'Waiting for friend to log in with your link...'
              : 'Share invite link — timer unlocks when a friend joins!'}
          </span>
        </div>

        {/* Buttons: Trackable Share & VIP Bypass */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          {/* Button 1: Trackable Share with Friend */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleShareToSkip}
              aria-label="Share Link to Unlock"
              title="Share Link to Unlock"
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: '14px',
                border: '1px solid #3b82f6',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%)',
                color: '#60a5fa',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: '800',
                fontSize: '13px',
                boxShadow: 'none'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <span>{hasShared ? 'Share Invite Link Again' : 'Share Link to Unlock'}</span>
            </motion.button>
            <span style={{ fontSize: '11px', color: '#71717a' }}>
              Unlocks automatically the moment your friend logs in
            </span>
          </div>

          {/* Button 2: Monetization (₹99/wk and ₹149/mo God Mode) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px', width: '100%' }}>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpgrade && onUpgrade(99)}
              style={{
                width: '100%',
                padding: '12px 6px',
                borderRadius: '14px',
                border: '1px solid #3f3f46',
                background: '#27272a',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxShadow: 'none'
              }}
            >
              <span>⚡</span> ₹99 / Wk
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpgrade && onUpgrade(149)}
              style={{
                width: '100%',
                padding: '12px 6px',
                borderRadius: '14px',
                border: 'none',
                background: '#fbbf24',
                color: '#000000',
                fontSize: '12.5px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                boxShadow: 'none'
              }}
            >
              <span>👑</span> ₹149 / Mo
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
