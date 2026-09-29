import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ReferralInviteSnippet
 * User dashboard snippet to generate and display unique invite link:
 * https://[our-domain]/signup?ref=[user_id]
 * Includes native clipboard copy with fallback, WhatsApp direct share,
 * and live progress tracking towards the 25-invite God Mode auto-unlock.
 */
export default function ReferralInviteSnippet({ user }) {
  const [copyStatus, setCopyStatus] = useState(false);

  // User ID fallback hierarchy: uuid -> google_id -> handle -> 'user'
  const userId = user?.id || user?.google_id || user?.handle || '';
  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://centerinsider.app';
  const inviteLink = `${domain}/signup?ref=${encodeURIComponent(userId)}`;

  const currentInvites = user?.invites || user?.recruits || 0;
  const targetForGodMode = 25;
  const progressPercent = Math.min(100, Math.round((currentInvites / targetForGodMode) * 100));
  const isGodModeUnlocked = Boolean(user?.is_god_mode || user?.is_pro || currentInvites >= targetForGodMode);

  const handleCopy = async () => {
    const streamText = user?.stream || 'our coaching batch';
    const message = `Someone from ${streamText} secretly voted for you on CenterInsider! Join to see who voted: ${inviteLink}`;

    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(message);
        copied = true;
      } catch (_) {}
    }

    if (!copied && typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = message;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copied = true;
      } catch (_) {}
    }

    setCopyStatus(true);
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
    setTimeout(() => setCopyStatus(false), 2500);
  };

  const handleWhatsApp = () => {
    const streamText = user?.stream || 'our coaching batch';
    const msg = `🔥 *CenterInsider*: Someone in ${streamText} just secretly voted for you! 🤫\n\nFind out who voted for you and see your compliments here:\n👉 ${inviteLink}\n\n(Takes 10 seconds to join • Free)`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1.5px solid #000000',
        borderRadius: '20px',
        padding: '18px 16px',
        boxSizing: 'border-box',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        marginBottom: '20px',
        textAlign: 'left'
      }}
    >
      {/* Title & Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⚡</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '900', color: '#000000', letterSpacing: '-0.3px' }}>
              Your Unique Invite Link
            </h3>
            <span style={{ fontSize: '10.5px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Viral Referral Tracker
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: '800',
            background: isGodModeUnlocked ? '#fef3c7' : '#f3f4f6',
            color: isGodModeUnlocked ? '#b45309' : '#374151',
            border: isGodModeUnlocked ? '1px solid #fde68a' : '1px solid #e5e7eb',
            padding: '3px 8px',
            borderRadius: '10px'
          }}
        >
          {isGodModeUnlocked ? '👑 God Mode Active' : `${currentInvites}/25 for God Mode`}
        </span>
      </div>

      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
        Share your link with classmates. When 25 join, you automatically unlock permanent <strong style={{ color: '#000000' }}>God Mode</strong> & AI custom polls.
      </p>

      {/* Progress Bar towards 25 invites */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: '700', color: '#4b5563', marginBottom: '4px' }}>
          <span>God Mode Auto-Upgrade Progress</span>
          <span>{currentInvites} / 25 Invites</span>
        </div>
        <div style={{ width: '100%', height: '7px', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: isGodModeUnlocked ? 'linear-gradient(90deg, #f59e0b, #e11d48)' : '#000000',
              borderRadius: '10px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Display Invite Link Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '8px 10px',
          marginBottom: '10px'
        }}
      >
        <span style={{ fontSize: '12px', color: '#6b7280' }}>🔗</span>
        <input
          type="text"
          readOnly
          value={inviteLink}
          onClick={(e) => e.target.select()}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '12px',
            fontWeight: '700',
            color: '#111827',
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        />

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleCopy}
          style={{
            flexShrink: 0,
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid #000000',
            background: copyStatus ? '#16a34a' : '#000000',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
        >
          {copyStatus ? '✓ Copied' : 'Copy'}
        </motion.button>
      </div>

      {/* Direct WhatsApp Share Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleWhatsApp}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '12px',
          border: '1px solid #22c55e',
          background: '#22c55e',
          color: '#ffffff',
          fontSize: '12.5px',
          fontWeight: '800',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 2px 10px rgba(34, 197, 94, 0.2)'
        }}
      >
        <span>💬</span>
        <span>Share on WhatsApp</span>
      </motion.button>
    </div>
  );
}
