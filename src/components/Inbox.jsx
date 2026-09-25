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
    <div className="gas-inbox-wrapper" style={{ padding: '8px 12px 80px 12px', background: '#ffffff', minHeight: '100%' }}>
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
            border: '1px solid #e5e7eb',
            background: showFriendSearch ? '#f3f4f6' : '#ffffff',
            color: '#000000',
            fontSize: '13.5px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👥</span>
            <span>Find & Add Classmates</span>
          </div>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
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
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '950', color: '#000000' }}>
          {user?.is_pro ? '👑 Names Revealed Inbox' : '📬 Secret Flames Inbox'}
        </h3>
        <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>
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
            background: '#f9fafb',
            borderRadius: '20px',
            padding: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: 'none',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#000000', letterSpacing: '0.5px' }}>
              🎁 Unlock Voter Names
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280' }}>
              {effectiveInvites}/3 invites completed
            </span>
          </div>

          {/* Progress Bar Container */}
          <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: '#000000',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: '1.3' }}>
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
                border: '1px solid #e5e7eb',
                background: '#000000',
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

      {/* 4. Messages List */}
      {inbox.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <p style={{ fontWeight: '700', fontSize: '16px', color: '#000000', margin: '0 0 6px 0' }}>Your flame inbox is empty.</p>
          <p style={{ fontSize: '13px', margin: 0 }}>Answer polls in the feed to get your classmates to vote for you!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {inbox.map((vote, index) => {
            const isRevealed = Boolean(vote.voterHandle) && !vote.isLocked;
            const isGirl = vote.voterGender === 'girl';
            const isBoy = vote.voterGender === 'boy';

            const flameTheme = isGirl
              ? {
                  icon: '🌸',
                  label: 'From a Girl in your Coaching Hub',
                }
              : isBoy
              ? {
                  icon: '💙',
                  label: 'From a Boy in your Coaching Hub',
                }
              : {
                  icon: '✨',
                  label: 'From a Batchmate in your Coaching Hub',
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
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Header: Gender Flame Pill & Reveal Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      background: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>{flameTheme.icon}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#374151', letterSpacing: '0.3px' }}>
                      {flameTheme.label}
                    </span>
                  </div>

                  {isRevealed ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '900',
                        color: '#059669',
                        background: '#f0fdf4',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        border: '1px solid #bbf7d0',
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
                        color: '#ffffff',
                        background: '#000000',
                        padding: '5px 12px',
                        borderRadius: '12px',
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
                      color: '#000000',
                      lineHeight: '1.4',
                    }}
                  >
                    "{vote.question}"
                  </p>

                  {/* Voter Info: STRICTLY HIDDEN UNLESS REVEALED */}
                  <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isRevealed ? (
                      <span style={{ color: '#000000', fontWeight: '800' }}>
                        Voted by: {vote.voterAvatar} {vote.voterName ? `${vote.voterName} (@${vote.voterHandle})` : `@${vote.voterHandle}`}
                      </span>
                    ) : (
                      <span style={{ color: '#6b7280', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      background: '#f9fafb',
                      borderRadius: '14px',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      marginTop: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#374151' }}>
                        🎯 {effectiveInvites}/3 invites completed
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280' }}>
                        {remaining === 0 ? 'Ready to reveal!' : `${remaining} more needed`}
                      </span>
                    </div>

                    {/* Mini Progress Bar on Card */}
                    <div style={{ width: '100%', height: '5px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          background: '#000000',
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
                          border: '1px solid #e5e7eb',
                          background: '#000000',
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
