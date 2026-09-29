import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonPollCard from './SkeletonPollCard';
import CooldownScreen from './CooldownScreen';
import SponsorBanner from './SponsorBanner';
import { handleShare } from '../utils/share';
import { MASTER_CLASS_OPTIONS } from '../constants/classes';

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
  onSkipCooldown,
  onCooldownUnlocked
}) {
  const [shuffleCount, setShuffleCount] = useState(0);
  const [optimisticVoted, setOptimisticVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isClassesOpen, setIsClassesOpen] = useState(false);
  const classesDropdownRef = useRef(null);

  // Close dropdown on outside click or tap
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (classesDropdownRef.current && !classesDropdownRef.current.contains(e.target)) {
        setIsClassesOpen(false);
      }
    };
    if (isClassesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isClassesOpen]);

  const currentClassLabel = !gradeFilter || gradeFilter === 'all'
    ? 'All Classes'
    : (MASTER_CLASS_OPTIONS.find(c => c.toLowerCase() === gradeFilter.toLowerCase()) || gradeFilter);

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

    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }

    if (onShuffle) onShuffle();
  };

  const handleVoteClick = (candidate) => {
    setShuffleCount(0);
    setSelectedCandidate(candidate);
    setOptimisticVoted(true);

    if (window.navigator?.vibrate) {
      window.navigator.vibrate(15);
    }

    // Dispatch vote asynchronously
    if (onCastVote) {
      onCastVote(candidate.id);
    }
  };

  const handleNextClick = () => {
    setOptimisticVoted(false);
    setSelectedCandidate(null);
    onLoadNextPoll(gradeFilter);
  };

  const handleSharePoll = async () => {
    const handle = (user?.invite_code || user?.handle || 'campus').replace(/^@/, '');
    const questionText = currentPoll?.question || 'Who is most likely to crack NEET?';
    const shareUrl = `${window.location.origin}/?ref=${encodeURIComponent(handle)}`;
    const shareText = `🔥 "${questionText}"\nVote anonymously on CenterInsider!`;

    await handleShare({
      title: 'CenterInsider',
      text: shareText,
      url: shareUrl
    });
  };

  // If in cooldown, show CooldownScreen
  if (isCooldownActive) {
    return (
      <CooldownScreen
        cooldownUntil={cooldownUntil}
        user={user}
        onUpgrade={onUpgrade}
        onCooldownFinished={() => {
          if (onCooldownUnlocked) onCooldownUnlocked();
          else if (onSkipCooldown) onSkipCooldown();
          else onLoadNextPoll(gradeFilter);
        }}
        onCooldownUnlocked={() => {
          if (onCooldownUnlocked) onCooldownUnlocked();
          else if (onSkipCooldown) onSkipCooldown();
          else onLoadNextPoll(gradeFilter);
        }}
      />
    );
  }

  // Exactly 4 items
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
        boxSizing: 'border-box',
        background: '#ffffff'
      }}
    >
      {/* 2. Refactored Classes Dropdown (Vertical & Scrollable) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px', position: 'relative', zIndex: 40 }}>
        <div ref={classesDropdownRef} style={{ position: 'relative', width: '100%', maxWidth: '290px' }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setIsClassesOpen(prev => !prev)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 14px',
              borderRadius: '14px',
              border: '1.5px solid #000000',
              background: '#f9fafb',
              color: '#000000',
              fontWeight: '800',
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span style={{ fontSize: '13px' }}>🎓</span>
              <span style={{ color: '#6b7280', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Classes:
              </span>
              <span style={{ fontWeight: '800', color: '#000000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentClassLabel}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: '#6b7280', transition: 'transform 0.2s ease', transform: isClassesOpen ? 'rotate(180deg)' : 'none' }}>
              ▼
            </span>
          </motion.button>

          <AnimatePresence>
            {isClassesOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  maxHeight: '260px',
                  overflowY: 'auto',
                  background: '#ffffff',
                  border: '1.5px solid #000000',
                  borderRadius: '16px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
                  zIndex: 100,
                  padding: '6px',
                  scrollbarWidth: 'thin'
                }}
              >
                <div style={{ padding: '6px 10px 4px 10px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em' }}>
                  Filter By Class / Stream
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.navigator?.vibrate) window.navigator.vibrate(8);
                    setIsClassesOpen(false);
                    onLoadNextPoll('all');
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: (!gradeFilter || gradeFilter === 'all') ? '#000000' : 'transparent',
                    color: (!gradeFilter || gradeFilter === 'all') ? '#ffffff' : '#111827',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2px',
                    transition: 'background 0.12s ease'
                  }}
                >
                  <span>🏫 All Classes (Institute)</span>
                  {(!gradeFilter || gradeFilter === 'all') && <span>✓</span>}
                </button>

                <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }} />

                {MASTER_CLASS_OPTIONS.map((c) => {
                  const isSelected = gradeFilter?.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        if (window.navigator?.vibrate) window.navigator.vibrate(8);
                        setIsClassesOpen(false);
                        onLoadNextPoll(c);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isSelected ? '#000000' : 'transparent',
                        color: isSelected ? '#ffffff' : '#1f2937',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '2px',
                        transition: 'background 0.12s ease'
                      }}
                    >
                      <span>{c}</span>
                      {isSelected && <span>✓</span>}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isLoadingPoll ? (
        <SkeletonPollCard />
      ) : isVoteFinished ? (
        /* Optimistic Success Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            minHeight: '280px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '24px',
            padding: '32px 20px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ fontSize: '46px', marginBottom: '8px' }}>🔥</div>
          <h2 style={{ color: '#000000', fontSize: '22px', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Flame Sent!
          </h2>
          
          {selectedCandidate && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f3f4f6', padding: '6px 14px', borderRadius: '16px', margin: '6px 0 16px 0', border: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>To:</span>
              <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#000000' }}>
                @{selectedCandidate.handle}
              </span>
            </div>
          )}

          <p style={{ color: '#6b7280', fontSize: '13px', maxWidth: '270px', margin: '0 0 24px 0', lineHeight: '1.4' }}>
            Delivered anonymously. They won't know it was you unless they unlock via 3 recruits or God Mode!
          </p>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleNextClick}
            style={{
              padding: '14px 32px',
              borderRadius: '16px',
              border: '1px solid #000000',
              background: '#000000',
              color: '#ffffff',
              fontSize: '14.5px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: 'none'
            }}
          >
            Next Question ➔
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Question Card */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '24px',
              padding: '22px 18px',
              textAlign: 'center',
              marginBottom: '14px',
              minHeight: '105px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
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
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#6b7280',
                transition: 'all 0.15s ease'
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
                fontWeight: '800',
                color: '#000000',
                lineHeight: '1.35',
                margin: 0,
                padding: '0 24px',
                letterSpacing: '-0.01em'
              }}
            >
              "{currentPoll?.question || 'Who is most likely to crack NEET on the first attempt?'}"
            </h3>
          </motion.div>

          {/* 4 Classmate Candidate Buttons or Empty State */}
          {displayOptions.length < 4 ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '36px 16px',
                textAlign: 'center',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>👥</div>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  lineHeight: '1.5',
                  maxWidth: '320px',
                  margin: '0 0 16px 0'
                }}
              >
                Not enough members in {user?.institute || 'your institute'} to unlock polls. Invite more students to start voting.
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSharePoll}
                style={{
                  background: '#000000',
                  color: '#ffffff',
                  border: '1px solid #000000',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🚀</span>
                <span>Invite Classmates</span>
              </motion.button>
            </motion.div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {displayOptions.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.1 }}
                  onClick={() => handleVoteClick(opt)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '20px',
                    padding: '14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000000',
                    cursor: 'pointer',
                    outline: 'none',
                    minHeight: '100px',
                    boxSizing: 'border-box',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  {renderProfilePic
                    ? renderProfilePic(opt.profile_pic, opt.avatar, opt.is_pro, opt.selected_ring || opt.ring, 48)
                    : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        {opt.avatar || '😎'}
                      </div>
                    )}
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#000000',
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
                    <span style={{ fontSize: '9.5px', color: '#6b7280', fontWeight: '600', marginTop: '2px' }}>
                      {opt.stream}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {/* Bottom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: displayOptions.length < 4 ? 'flex-end' : 'space-between', marginTop: 'auto', paddingTop: '4px' }}>
            {displayOptions.length >= 4 && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                disabled={shuffleCount >= 3}
                onClick={handleShuffleClick}
                style={{
                  background: shuffleCount >= 3 ? '#f3f4f6' : '#f9fafb',
                  border: '1px solid #e5e7eb',
                  color: shuffleCount >= 3 ? '#9ca3af' : '#374151',
                  padding: '10px 16px',
                  borderRadius: '16px',
                  fontSize: '12.5px',
                  fontWeight: '700',
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
            )}

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(8);
                setShuffleCount(0);
                onLoadNextPoll(gradeFilter);
              }}
              style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                color: '#374151',
                padding: '10px 16px',
                borderRadius: '16px',
                fontSize: '12.5px',
                fontWeight: '700',
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

      {/* Dynamic Academic Sponsorship Banner */}
      <SponsorBanner city="Bathinda" hub={user?.coaching_hub || user?.hub || 'Ajit Road Hub'} />
    </div>
  );
}
