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
            background: 'linear-gradient(135deg, rgba(255, 85, 0, 0.15), rgba(0, 240, 255, 0.1))',
            borderRadius: '20px',
            padding: '16px',
            border: '1.5px solid rgba(255, 85, 0, 0.35)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🎁 Unlock Voter Names
            </span>
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#00f0ff' }}>
              {effectiveInvites}/3 invites completed
            </span>
          </div>

          {/* Progress Bar Container */}
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #ff5500, #00f0ff)',
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.8)',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.3' }}>
              {effectiveInvites >= 3
                ? '🎉 Reward unlocked! Tap any flame to unveil the secret voter.'
                : `Invite ${remaining} more ${remaining === 1 ? 'friend' : 'friends'} on WhatsApp to unlock voter identities.`}
            </p>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={onInviteShare}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #00f0ff, #0088ff)',
                color: '#050c1e',
                fontSize: '12px',
                fontWeight: '950',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.5)',
              }}
            >
              📲 Invite
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

            // Gender styling: Blue flame for Boy, Pink flame for Girl, Purple for Other
            const flameTheme = isGirl
              ? {
                  color: '#ff2e93',
                  accentGradient: 'linear-gradient(135deg, #ff2e93, #f43f5e)',
                  bgGradient: 'linear-gradient(145deg, rgba(255, 46, 147, 0.12), rgba(20, 20, 32, 0.9))',
                  border: '1.5px solid rgba(255, 46, 147, 0.35)',
                  badgeBg: 'rgba(255, 46, 147, 0.18)',
                  badgeBorder: '1px solid rgba(255, 46, 147, 0.4)',
                  icon: '🌸🔥',
                  label: 'From a Girl in your Coaching Hub',
                  glow: '0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(255, 46, 147, 0.15)',
                }
              : isBoy
              ? {
                  color: '#00f0ff',
                  accentGradient: 'linear-gradient(135deg, #00f0ff, #3b82f6)',
                  bgGradient: 'linear-gradient(145deg, rgba(0, 240, 255, 0.12), rgba(20, 20, 32, 0.9))',
                  border: '1.5px solid rgba(0, 240, 255, 0.35)',
                  badgeBg: 'rgba(0, 240, 255, 0.18)',
                  badgeBorder: '1px solid rgba(0, 240, 255, 0.4)',
                  icon: '💙🔥',
                  label: 'From a Boy in your Coaching Hub',
                  glow: '0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(0, 240, 255, 0.15)',
                }
              : {
                  color: '#a855f7',
                  accentGradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  bgGradient: 'linear-gradient(145deg, rgba(168, 85, 247, 0.12), rgba(20, 20, 32, 0.9))',
                  border: '1.5px solid rgba(168, 85, 247, 0.35)',
                  badgeBg: 'rgba(168, 85, 247, 0.18)',
                  badgeBorder: '1px solid rgba(168, 85, 247, 0.4)',
                  icon: '✨🔥',
                  label: 'From a Batchmate in your Coaching Hub',
                  glow: '0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(168, 85, 247, 0.15)',
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

                    {/* Direct WhatsApp Share Button on Card */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onInviteShare();
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${flameTheme.color}55`,
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: flameTheme.color,
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>📲</span> Share Invite Link on WhatsApp
                    </motion.button>
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
