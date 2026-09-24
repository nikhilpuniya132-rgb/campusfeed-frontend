import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import HamsterLoader from './HamsterLoader';
import CooldownScreen from './CooldownScreen';
import SponsorBanner from './SponsorBanner';

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
  // Optimistic UI state for instant local transition
  const [optimisticVoted, setOptimisticVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Check if active cooldown is in the future
  const isCooldownActive = Boolean(
    !user?.is_pro &&
    cooldownUntil &&
    new Date(cooldownUntil).getTime() > Date.now()
  );

  // Reset shuffle and optimistic vote when poll changes or parent hasVoted changes
  useEffect(() => {
    setShuffleCount(0);
    setOptimisticVoted(false);
    setSelectedCandidate(null);
  }, [currentPoll?.id]);

  useEffect(() => {
    if (!hasVoted) {
      setOptimisticVoted(false);
      setSelectedCandidate(null);
    }
  }, [hasVoted]);

  const handleShuffleClick = () => {
    if (shuffleCount >= 3) return;
    setShuffleCount(prev => prev + 1);
    if (onShuffle) onShuffle();
  };

  // Optimistic vote handler: updates local state immediately before network resolution
  const handleVoteClick = (candidate) => {
    setShuffleCount(0);
    setSelectedCandidate(candidate);
    setOptimisticVoted(true);

    // Instant micro-haptic confetti burst
    try {
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.55 },
        colors: ['#ff5500', '#ff2e93', '#fbbf24', '#00f0ff']
      });
    } catch (_) {}

    // Dispatch vote in background asynchronously
    if (onCastVote) {
      onCastVote(candidate.id);
    }
  };

  const handleNextClick = () => {
    setOptimisticVoted(false);
    setSelectedCandidate(null);
    if (onLoadNextPoll) {
      onLoadNextPoll(gradeFilter);
    }
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

  // Strictly limit candidate options to exactly 4 items for lightweight DOM rendering
  const displayOptions = (options || []).slice(0, 4);
  const isVoteFinished = optimisticVoted || hasVoted;

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
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer',
            background: gradeFilter === user.grade?.toString() ? '#ffffff' : '#141414',
            color: gradeFilter === user.grade?.toString() ? '#000000' : '#71717a',
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
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              background: gradeFilter === g && gradeFilter !== user.grade?.toString() ? '#ffffff' : '#141414',
              color: gradeFilter === g && gradeFilter !== user.grade?.toString() ? '#000000' : '#71717a',
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
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer',
            background: gradeFilter === 'all' ? '#ffffff' : '#141414',
            color: gradeFilter === 'all' ? '#000000' : '#71717a',
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
      ) : isVoteFinished ? (
        /* Optimistic Success Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '280px',
            background: '#121214',
            border: '1px solid #27272a',
            borderRadius: '24px',
            padding: '32px 20px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ fontSize: '46px', marginBottom: '8px' }}>🔥</div>
          <h2 style={{ color: '#ffffff', fontSize: '22px', fontWeight: '900', margin: '0 0 6px 0' }}>
            Flame Sent!
          </h2>
          
          {selectedCandidate && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#18181b', padding: '6px 14px', borderRadius: '16px', margin: '6px 0 16px 0', border: '1px solid #27272a' }}>
              <span style={{ fontSize: '14px' }}>To:</span>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#fbbf24' }}>
                @{selectedCandidate.handle}
              </span>
            </div>
          )}

          <p style={{ color: '#71717a', fontSize: '13px', maxWidth: '270px', margin: '0 0 24px 0', lineHeight: '1.4' }}>
            Delivered anonymously. They won't know it was you unless they unlock via 3 invites or God Mode!
          </p>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleNextClick}
            style={{
              padding: '14px 32px',
              borderRadius: '16px',
              border: 'none',
              background: '#ffffff',
              color: '#000000',
              fontSize: '14.5px',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)'
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
              background: '#121214',
              border: '1px solid #27272a',
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
          {displayOptions.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#71717a', padding: '30px 0' }}>
              <p style={{ fontSize: '13.5px', margin: '0 0 12px 0' }}>Not enough classmates found in this class.</p>
              <button
                onClick={() => onLoadNextPoll('all')}
                style={{
                  padding: '10px 18px',
                  borderRadius: '14px',
                  background: '#18181b',
                  color: '#ffffff',
                  border: '1px solid #27272a',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                Try Whole School
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {displayOptions.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleVoteClick(opt)}
                  style={{
                    background: '#141416',
                    border: '1px solid #27272a',
                    borderRadius: '20px',
                    padding: '14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minHeight: '96px',
                    boxSizing: 'border-box',
                    userSelect: 'none',
                    transition: 'border-color 0.15s ease'
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
                background: shuffleCount >= 3 ? '#121214' : '#18181b',
                border: '1px solid #27272a',
                color: shuffleCount >= 3 ? '#52525b' : '#a1a1aa',
                padding: '10px 16px',
                borderRadius: '16px',
                fontSize: '12.5px',
                fontWeight: '800',
                cursor: shuffleCount >= 3 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: shuffleCount >= 3 ? 0.6 : 1,
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
                background: '#18181b',
                border: '1px solid #27272a',
                color: '#a1a1aa',
                padding: '10px 16px',
                borderRadius: '16px',
                fontSize: '12.5px',
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

      {/* Dynamic City-Based Sponsorship Banner (Directly Beneath Core Poll) */}
      <SponsorBanner city={user?.city || user?.district || 'Bathinda'} />
    </div>
  );
}
