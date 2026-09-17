import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import HamsterLoader from './HamsterLoader';
import CooldownScreen from './CooldownScreen';

export default function Feed({
  user,
  currentPoll,
  options = [],
  gradeFilter,
  isLoadingPoll,
  hasVoted,
  cooldownUntil,
  onLoadNextPoll,
  onCastVote,
  onShuffle,
  renderProfilePic,
  onUpgrade,
  onSkipCooldown
}) {
  const [shuffleCount, setShuffleCount] = useState(0);

  // Check if active cooldown is in the future
  const isCooldownActive = Boolean(
    !user?.is_pro &&
    cooldownUntil &&
    new Date(cooldownUntil).getTime() > Date.now()
  );

  // Reset shuffle count when poll changes or user casts a vote
  useEffect(() => {
    setShuffleCount(0);
  }, [currentPoll?.id, hasVoted]);

  const handleShuffleClick = () => {
    if (shuffleCount >= 3) return;
    setShuffleCount(prev => prev + 1);
    if (onShuffle) onShuffle();
  };

  const handleVoteClick = (candidateId) => {
    setShuffleCount(0);
    onCastVote(candidateId);
  };

  // 1. If in cooldown, show CooldownScreen
  if (isCooldownActive) {
    return (
      <CooldownScreen
        cooldownUntil={cooldownUntil}
        user={user}
        onSkip={onSkipCooldown}
        onUpgrade={onUpgrade}
        onCooldownFinished={() => onLoadNextPoll(gradeFilter)}
      />
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '440px', margin: '0 auto', padding: '8px 16px 80px 16px', boxSizing: 'border-box' }}>
      {/* Grade Switcher Pills (Flat & Minimalist) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '16px' }}>
        <button
          onClick={() => onLoadNextPoll(user.grade?.toString() || '11')}
          style={{
            padding: '7px 12px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: gradeFilter === user.grade?.toString() ? '#ffffff' : '#161616',
            color: gradeFilter === user.grade?.toString() ? '#000000' : '#888888',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
        >
          My Class ({user.grade || '11'})
        </button>

        {['9', '10', '11', '12'].map((g) => (
          <button
            key={g}
            onClick={() => onLoadNextPoll(g)}
            style={{
              padding: '7px 12px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              background: gradeFilter === g && gradeFilter !== user.grade?.toString() ? '#ffffff' : '#161616',
              color: gradeFilter === g && gradeFilter !== user.grade?.toString() ? '#000000' : '#888888',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            Class {g}
          </button>
        ))}

        <button
          onClick={() => onLoadNextPoll('all')}
          style={{
            padding: '7px 12px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: gradeFilter === 'all' ? '#ffffff' : '#161616',
            color: gradeFilter === 'all' ? '#000000' : '#888888',
            transition: 'background 0.15s ease, color 0.15s ease',
          }}
        >
          Whole School
        </button>
      </div>

      {isLoadingPoll ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px' }}>
          <HamsterLoader message="Finding classmates..." />
        </div>
      ) : hasVoted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '280px',
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: '24px',
            padding: '32px 20px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
          <h2 style={{ color: '#ffffff', fontSize: '24px', fontWeight: '900', margin: '0 0 6px 0' }}>Flame Sent!</h2>
          <p style={{ color: '#888888', fontSize: '14px', maxWidth: '260px', margin: '0 0 24px 0' }}>
            Delivered anonymously. They won't know it was you unless they unlock!
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onLoadNextPoll(gradeFilter)}
            style={{
              padding: '14px 28px',
              borderRadius: '16px',
              border: 'none',
              background: '#ffffff',
              color: '#000000',
              fontSize: '15px',
              fontWeight: '900',
              cursor: 'pointer',
            }}
          >
            Next Question ➔
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Question Card (Flat Solid Surface) */}
          <div
            style={{
              background: '#111111',
              border: '1px solid #222222',
              borderRadius: '24px',
              padding: '24px 18px',
              textAlign: 'center',
              marginBottom: '16px',
              minHeight: '110px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <h3
              style={{
                fontSize: 'clamp(17px, 4.5vw, 21px)',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1.35',
                margin: 0,
              }}
            >
              "{currentPoll?.question || 'Who is most likely to light up the room?'}"
            </h3>
          </div>

          {/* 4 Classmate Candidate Buttons */}
          {options.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888888', padding: '30px 0' }}>
              <p style={{ fontSize: '14px', margin: '0 0 12px 0' }}>Not enough classmates found in this filter.</p>
              <button
                onClick={() => onLoadNextPoll('all')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '14px',
                  background: '#222222',
                  color: '#ffffff',
                  border: '1px solid #333333',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Try Whole School
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {options.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVoteClick(opt.id)}
                  style={{
                    background: '#141414',
                    border: '1px solid #222222',
                    borderRadius: '20px',
                    padding: '14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minHeight: '94px',
                    boxSizing: 'border-box',
                    userSelect: 'none',
                  }}
                >
                  {renderProfilePic
                    ? renderProfilePic(opt.profile_pic, opt.avatar, opt.is_pro, opt.selected_ring || opt.ring, 48)
                    : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        {opt.avatar || '😎'}
                      </div>
                    )}
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#ffffff',
                      marginTop: '6px',
                      textAlign: 'center',
                      lineHeight: '1.2',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                      padding: '0 4px',
                    }}
                  >
                    @{opt.handle}
                  </span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Bottom Controls: Shuffle (with 3-count limit) & Skip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px' }}>
            <button
              disabled={shuffleCount >= 3}
              onClick={handleShuffleClick}
              style={{
                background: shuffleCount >= 3 ? '#111111' : '#181818',
                border: '1px solid #262626',
                color: shuffleCount >= 3 ? '#555555' : '#cbd5e1',
                padding: '10px 16px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: shuffleCount >= 3 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: shuffleCount >= 3 ? 0.5 : 1,
              }}
            >
              <span>🔀</span>
              <span>
                {shuffleCount >= 3 ? 'No shuffles left' : `Shuffle (${3 - shuffleCount} left)`}
              </span>
            </button>

            <button
              onClick={() => {
                setShuffleCount(0);
                onLoadNextPoll(gradeFilter);
              }}
              style={{
                background: '#181818',
                border: '1px solid #262626',
                color: '#cbd5e1',
                padding: '10px 16px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Skip ⏭️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
