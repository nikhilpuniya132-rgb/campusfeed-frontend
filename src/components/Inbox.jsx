import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FriendSearch from './FriendSearch';

export default function Inbox({
  user,
  inbox = [],
  inviteStats = { effectiveInvites: 0, remaining: 3, canReveal: false },
  onOpenReveal,
  onInviteShare,
  showFriendSearch,
  setShowFriendSearch,
  API,
  supabase,
  onFriendAdded
}) {
  const effectiveInvites = inviteStats?.effectiveInvites || user?.invites || 0;
  const remaining = Math.max(0, 3 - effectiveInvites);
  const progressPercent = Math.min(100, Math.round((effectiveInvites / 3) * 100));

  return (
    <div className="gas-inbox-wrapper" style={{ padding: '8px 12px 80px 12px' }}>
      {/* 1. Find & Add Classmates Collapsible Section */}
      <div style={{ marginBottom: '14px', width: '100%' }}>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowFriendSearch(!showFriendSearch)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            background: showFriendSearch ? 'rgba(255, 85, 0, 0.18)' : 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            fontSize: '13.5px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: showFriendSearch ? '0 0 15px rgba(255, 85, 0, 0.25)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👥</span>
            <span>Find & Add Classmates</span>
          </div>
          <span style={{ fontSize: '12px', color: '#ff8800' }}>
            {showFriendSearch ? '▲ Close' : '▼ Search'}
          </span>
        </motion.button>

        <AnimatePresence>
          {showFriendSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: '10px', overflow: 'hidden' }}
            >
              <FriendSearch
                currentUser={user}
                API={API}
                supabase={supabase}
                onFriendAdded={onFriendAdded}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Inbox Header Title */}
      <div style={{ textAlign: 'center', padding: '4px 0 12px 0' }}>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '950', color: user?.is_pro ? '#fbbf24' : '#fff' }}>
          {user?.is_pro ? '👑 Names Revealed Inbox' : '📬 Secret Flames Inbox'}
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
          {user?.is_pro
            ? 'God mode active: All voter names are visible!'
            : 'Tap any flame card to reveal who secretly voted for you'}
        </p>
      </div>

      {/* 3. Global Viral Invites Progress Banner (If not pro) */}
      {!user?.is_pro && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#1A1A1A',
            borderRadius: '20px',
            padding: '16px',
            border: '1px solid #262626',
            boxShadow: 'none',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.5px' }}>
              🎁 Unlock Voter Names
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#a1a1aa' }}>
              {effectiveInvites}/3 invites completed
            </span>
          </div>

          {/* Progress Bar Container */}
          <div style={{ width: '100%', height: '6px', background: '#262626', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: '#ffffff',
                boxShadow: 'none',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#a1a1aa', lineHeight: '1.3' }}>
              {effectiveInvites >= 3
                ? 'Reward unlocked! Tap any flame to unveil the secret voter.'
                : `Invite ${remaining} more ${remaining === 1 ? 'friend' : 'friends'} to unlock voter identities.`}
            </p>

            {/* Minimalist Share Icon Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onInviteShare}
              aria-label="Share Link"
              title="Share Invite Link"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '1px solid #262626',
                background: '#262626',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: 'none'
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* 4. Messages List with Color-Coded Flames */}
      {inbox.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <p style={{ fontWeight: '700', fontSize: '16px', color: '#fff', margin: '0 0 6px 0' }}>Your flame inbox is empty.</p>
          <p style={{ fontSize: '13px', margin: 0 }}>Answer polls in the feed to get your classmates to vote for you!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {inbox.map((vote, index) => {
            const isRevealed = Boolean(vote.voterHandle) && !vote.isLocked;
            const isGirl = vote.voterGender === 'girl';
            const isBoy = vote.voterGender === 'boy';

            // Gender styling: Muted dark mode palette without bright neons
            const flameTheme = isGirl
              ? {
                  color: '#e4e4e7',
                  accentGradient: '#262626',
                  bgGradient: '#1A1A1A',
                  border: '1px solid #262626',
                  badgeBg: 'rgba(255, 255, 255, 0.05)',
                  badgeBorder: '1px solid #262626',
                  icon: '🌸',
                  label: 'From a Girl in your Coaching Hub',
                  glow: 'none',
                }
              : isBoy
              ? {
                  color: '#e4e4e7',
                  accentGradient: '#262626',
                  bgGradient: '#1A1A1A',
                  border: '1px solid #262626',
                  badgeBg: 'rgba(255, 255, 255, 0.05)',
                  badgeBorder: '1px solid #262626',
                  icon: '💙',
                  label: 'From a Boy in your Coaching Hub',
                  glow: 'none',
                }
              : {
                  color: '#e4e4e7',
                  accentGradient: '#262626',
                  bgGradient: '#1A1A1A',
                  border: '1px solid #262626',
                  badgeBg: 'rgba(255, 255, 255, 0.05)',
                  badgeBorder: '1px solid #262626',
                  icon: '✨',
                  label: 'From a Batchmate in your Coaching Hub',
                  glow: 'none',
                };

            return (
              <motion.div
                key={vote.voteId || index}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => onOpenReveal(vote)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '22px',
                  background: flameTheme.bgGradient,
                  border: flameTheme.border,
                  boxShadow: flameTheme.glow,
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Header: Gender-Coded Flame Pill & Reveal Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: flameTheme.badgeBg,
                      border: flameTheme.badgeBorder,
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>{flameTheme.icon}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: '900', color: flameTheme.color, letterSpacing: '0.3px' }}>
                      {flameTheme.label}
                    </span>
                  </div>

                  {isRevealed ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '900',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.15)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ✓ REVEALED
                    </span>
                  ) : (
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: '950',
                        color: '#fff',
                        background: 'linear-gradient(135deg, #ff5500, #ff2e93)',
                        padding: '5px 12px',
                        borderRadius: '12px',
                        boxShadow: '0 0 10px rgba(255, 85, 0, 0.5)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      REVEAL ➔
                    </div>
                  )}
                </div>

                {/* Poll Question */}
                <div>
                  <p
                    style={{
                      margin: '0 0 6px 0',
                      fontSize: '16px',
                      fontWeight: '900',
                      color: '#fff',
                      lineHeight: '1.4',
                    }}
                  >
                    "{vote.question}"
                  </p>

                  {/* Voter Info: STRICTLY HIDDEN UNLESS REVEALED */}
                  <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isRevealed ? (
                      <span style={{ color: vote.isPro ? '#fbbf24' : flameTheme.color, fontWeight: '800' }}>
                        Voted by: {vote.voterAvatar} {vote.voterName ? `${vote.voterName} (@${vote.voterHandle})` : `@${vote.voterHandle}`}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🔒</span>
                        <span>Secret Voter • Tap to reveal</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Locked Progress Bar & Direct Share CTA */}
                {!isRevealed && !user?.is_pro && (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: '14px',
                      padding: '10px 12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      marginTop: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1' }}>
                        🎯 {effectiveInvites}/3 invites completed
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: flameTheme.color }}>
                        {remaining === 0 ? 'Ready to reveal!' : `${remaining} more needed`}
                      </span>
                    </div>

                    {/* Mini Progress Bar on Card */}
                    <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          background: flameTheme.accentGradient,
                          borderRadius: '3px',
                        }}
                      />
                    </div>

                    {/* Minimalist Share Icon Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onInviteShare();
                        }}
                        aria-label="Share Link"
                        title="Share Invite Link"
                        style={{
                          width: '36px',
                          height: '36px',
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
