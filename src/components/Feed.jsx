import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import SkeletonPollCard from './SkeletonPollCard';
import CooldownScreen from './CooldownScreen';
import SponsorBanner from './SponsorBanner';

const COACHING_FILTER_PILLS = [
  { id: '11th Medical', label: '11th Medical' },
  { id: '11th Non-Med', label: '11th Non-Med' },
  { id: '12th Board', label: '12th Board' },
  { id: 'NEET Droppers', label: 'NEET Droppers' },
  { id: 'all', label: 'All Bathinda' }
];

export default function Feed({
  user,
  currentPoll,
  options = [],
  gradeFilter = 'all',
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

    // Haptic tick
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }

    if (onShuffle) onShuffle();
  };

  // Optimistic vote handler: updates local state immediately before network resolution
  const handleVoteClick = (candidate) => {
    setShuffleCount(0);
    setSelectedCandidate(candidate);
    setOptimisticVoted(true);

    // Instagram / FB level tactile haptic pulse
    if (window.navigator?.vibrate) {
      window.navigator.vibrate([20, 35, 20]);
    }

    // Instant micro-haptic confetti burst
    try {
      confetti({
        particleCount: 85,
        spread: 65,
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

    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }

    if (onLoadNextPoll) {
      onLoadNextPoll(gradeFilter);
    }
  };

  const handleSharePoll = async () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(8);
    const questionText = currentPoll?.question || 'Who is most likely to crack NEET on the first attempt?';
    const shareData = {
      title: 'CenterInsider',
      text: `🔥 "${questionText}"\nVote anonymously on CenterInsider!`,
      url: window.location.origin
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard?.writeText(`${shareData.text} ${shareData.url}`);
        }
      }
    } else {
      navigator.clipboard?.writeText(`${shareData.text} ${shareData.url}`);
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
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto',
        padding: '6px 14px 75px 14px',
        boxSizing: 'border-box'
      }}
    >
      {/* Category Pills: 11th Medical, 11th Non-Med, 12th Board, NEET Droppers, All Bathinda */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          justifyContent: 'center',
          marginBottom: '16px'
        }}
      >
        {COACHING_FILTER_PILLS.map((pill) => {
          const isActive = gradeFilter?.toLowerCase() === pill.id.toLowerCase() ||
            (pill.id === 'all' && (!gradeFilter || gradeFilter === 'all'));
          return (
            <motion.button
              key={pill.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(8);
                onLoadNextPoll(pill.id);
              }}
              style={{
                padding: '7px 12px',
                borderRadius: '12px',
                border: isActive ? '1px solid #ff5500' : '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '11.5px',
                fontWeight: '800',
                cursor: 'pointer',
                background: isActive ? '#ff5500' : '#161616',
                color: isActive ? '#ffffff' : '#a1a1aa',
                boxShadow: isActive ? '0 0 12px rgba(255, 85, 0, 0.25)' : 'none',
                transition: 'background 0.15s ease, color 0.15s ease'
              }}
            >
              {pill.label}
            </motion.button>
          );
        })}
      </div>

      {isLoadingPoll ? (
        <SkeletonPollCard />
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
            background: '#161616',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '32px 20px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)'
          }}
        >
          <div style={{ fontSize: '46px', marginBottom: '8px' }}>🔥</div>
          <h2 style={{ color: '#ffffff', fontSize: '22px', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Flame Sent!
          </h2>
          
          {selectedCandidate && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#222222', padding: '6px 14px', borderRadius: '16px', margin: '6px 0 16px 0', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <span style={{ fontSize: '13px', color: '#a1a1aa' }}>To:</span>
              <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#ff7700' }}>
                @{selectedCandidate.handle}
              </span>
            </div>
          )}

          <p style={{ color: '#71717a', fontSize: '13px', maxWidth: '270px', margin: '0 0 24px 0', lineHeight: '1.4' }}>
            Delivered anonymously. They won't know it was you unless they unlock via 3 recruits or God Mode!
          </p>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleNextClick}
            style={{
              padding: '14px 32px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #ff5500 0%, #ff2e93 100%)',
              color: '#ffffff',
              fontSize: '14.5px',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(255, 85, 0, 0.35)'
            }}
          >
            Next Question ➔
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Question Card (Premium Solid Surface with subtle gradient border & unified share icon) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background: '#161616',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '24px',
              padding: '22px 18px',
              textAlign: 'center',
              marginBottom: '14px',
              minHeight: '105px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none',
              position: 'relative'
            }}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSharePoll}
              title="Share Question"
              aria-label="Share Question"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid #262626',
                borderRadius: '10px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#a1a1aa',
                transition: 'color 0.15s ease, background 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = '#262626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#a1a1aa';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </motion.button>

            <h3
              style={{
                fontSize: 'clamp(16px, 4.2vw, 20px)',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1.35',
                margin: 0,
                padding: '0 24px',
                letterSpacing: '-0.01em'
              }}
            >
              "{currentPoll?.question || 'Who is most likely to crack NEET on the first attempt?'}"
            </h3>
          </motion.div>

          {/* 4 Classmate Candidate Buttons */}
          {displayOptions.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#71717a', padding: '30px 0' }}>
              <p style={{ fontSize: '13.5px', margin: '0 0 12px 0' }}>Not enough classmates found in this stream.</p>
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
                Try All Bathinda
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {displayOptions.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  onClick={() => handleVoteClick(opt)}
                  style={{
                    background: '#161616',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                    minHeight: '100px',
                    boxSizing: 'border-box',
                    userSelect: 'none',
                    transition: 'border-color 0.15s ease, background 0.15s ease',
                    boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3f3f46';
                    e.currentTarget.style.background = '#222226';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#262626';
                    e.currentTarget.style.background = '#1A1A1A';
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
                  {opt.stream && (
                    <span style={{ fontSize: '9.5px', color: '#a1a1aa', fontWeight: '700', marginTop: '2px' }}>
                      {opt.stream}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {/* Bottom Controls: Shuffle (with 3-count limit) & Skip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px' }}>
            <motion.button
              whileTap={{ scale: 0.94 }}
              disabled={shuffleCount >= 3}
              onClick={handleShuffleClick}
              style={{
                background: shuffleCount >= 3 ? '#121214' : '#18181b',
                border: '1px solid rgba(255, 255, 255, 0.08)',
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
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(8);
                setShuffleCount(0);
                onLoadNextPoll(gradeFilter);
              }}
              style={{
                background: '#18181b',
                border: '1px solid rgba(255, 255, 255, 0.08)',
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
            </motion.button>
          </div>
        </div>
      )}

      {/* Dynamic City-Based Academic Sponsorship Banner (Directly Beneath Core Poll) */}
      <SponsorBanner city="Bathinda" hub={user?.coaching_hub || user?.hub || 'Ajit Road Hub'} />
    </div>
  );
}
