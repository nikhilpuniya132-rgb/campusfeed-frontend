import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonPollCard from './SkeletonPollCard';
import CooldownScreen from './CooldownScreen';
import SponsorBanner from './SponsorBanner';
import { handleShare } from '../utils/share';
import { MASTER_CLASS_OPTIONS, JUNIOR_CLASS_OPTIONS, SENIOR_CLASS_OPTIONS, isJuniorUser } from '../constants/classes';
import { supabase } from '../supabase';

const JUNIOR_FALLBACK_POLLS = [
  { id: 101, question: "Brings the best lunchbox that everyone attacks at recess?", is_crush_poll: false },
  { id: 102, question: "Always reminds the teacher about yesterday's homework?", is_crush_poll: false },
  { id: 103, question: "Draws the best doodles on the last page of their notebook?", is_crush_poll: false },
  { id: 104, question: "Fastest runner during the sports period?", is_crush_poll: false },
  { id: 105, question: "Carries the heaviest school bag with 10 different gel pens?", is_crush_poll: false },
  { id: 106, question: "Class clown who always makes the teacher smile?", is_crush_poll: false },
  { id: 107, question: "Secret crush in the junior wing", is_crush_poll: true },
  { id: 108, question: "Best handwriting on the blackboard during monitor duty?", is_crush_poll: false },
  { id: 109, question: "Always loses their sharpener or eraser by second period?", is_crush_poll: false },
  { id: 110, question: "First to finish their tiffin box before the recess bell rings?", is_crush_poll: false },
  { id: 111, question: "Most likely to represent the school in the Science Olympiad?", is_crush_poll: false },
  { id: 112, question: "Can solve the hardest Maths questions without hesitation?", is_crush_poll: false }
];

const SENIOR_FALLBACK_POLLS = [
  { id: 1, question: "Always sleeps through 5 PM Physics?", is_crush_poll: false },
  { id: 2, question: "Most likely to crack NEET on the first attempt?", is_crush_poll: false },
  { id: 3, question: "Spends more time at the Maggi point than in class?", is_crush_poll: false },
  { id: 4, question: "Solves HC Verma questions during recess?", is_crush_poll: false },
  { id: 5, question: "Has handwritten formula cheat sheets everyone borrows?", is_crush_poll: false },
  { id: 6, question: "Sells their Allen/Aakash test series analysis for samosas?", is_crush_poll: false },
  { id: 7, question: "Secret crush in the coaching batch", is_crush_poll: true },
  { id: 8, question: "Biggest drip at Ajit Road", is_crush_poll: false },
  { id: 9, question: "Who has the neatest notes in Chemistry?", is_crush_poll: false },
  { id: 10, question: "Most likely to get AIR 1 in JEE Advanced?", is_crush_poll: false },
  { id: 11, question: "Best partner for last-minute exam prep?", is_crush_poll: false },
  { id: 12, question: "Always asks the hardest doubts to confuse the teacher?", is_crush_poll: false }
];

const filterPollsByAudience = (pollsList, isJunior) => {
  const fallback = isJunior ? JUNIOR_FALLBACK_POLLS : SENIOR_FALLBACK_POLLS;
  if (!pollsList || pollsList.length === 0) return fallback;

  const filtered = pollsList.filter(p => {
    if (p.audience === 'junior' || p.category === 'junior' || p.target_group === 'junior') {
      return isJunior;
    }
    if (p.audience === 'senior' || p.category === 'senior' || p.target_group === 'senior') {
      return !isJunior;
    }
    const q = (p.question || '').toLowerCase();
    const isSeniorPoll = q.includes('neet') || q.includes('jee') || q.includes('allen') || q.includes('aakash') || q.includes('hc verma') || q.includes('physics') || q.includes('chemistry') || q.includes('coaching batch');
    const isJuniorPoll = q.includes('tiffin') || q.includes('lunchbox') || q.includes('sports period') || q.includes('junior') || q.includes('blackboard') || q.includes('pencil') || q.includes('recess');
    
    if (isJunior) {
      return isJuniorPoll || !isSeniorPoll;
    } else {
      return isSeniorPoll || !isJuniorPoll;
    }
  });

  return filtered.length >= 4 ? filtered : fallback;
};

const filterCandidates = (candidates, gradeFilter, isJunior = false) => {
  // First, enforce strict cohort isolation (Juniors never see Seniors, Seniors never see Juniors)
  const cohortCandidates = (candidates || []).filter(c => {
    const cIsJunior = isJuniorUser(c);
    return isJunior ? cIsJunior : !cIsJunior;
  });

  if (!gradeFilter || gradeFilter === 'all' || gradeFilter === 'All Classes' || gradeFilter.startsWith('All')) {
    return cohortCandidates;
  }

  const f = gradeFilter.toLowerCase().trim();
  const subFiltered = cohortCandidates.filter(c => {
    const s = (c.stream || '').toLowerCase();
    const g = (c.grade || '').toString().toLowerCase();
    return s.includes(f) || g === f || f.includes(g);
  });

  return subFiltered.length >= 4 ? subFiltered : cohortCandidates;
};

const buildPollBatch = (pollsList, candidatesList, targetGrade, count = 12, isJunior = false) => {
  const appropriatePolls = filterPollsByAudience(pollsList, isJunior);
  const eligibleCandidates = filterCandidates(candidatesList, targetGrade, isJunior);

  const shuffledPolls = [...appropriatePolls].sort(() => 0.5 - Math.random());
  const batch = [];

  for (let i = 0; i < count; i++) {
    const poll = shuffledPolls[i % shuffledPolls.length];
    let selectedOptions = [];
    if (eligibleCandidates.length >= 4) {
      selectedOptions = [...eligibleCandidates].sort(() => 0.5 - Math.random()).slice(0, 4);
    } else {
      selectedOptions = [...eligibleCandidates];
    }
    batch.push({
      poll,
      options: selectedOptions
    });
  }

  return batch;
};

const fetchPollsFromSupabase = async (limit = 30, isJunior = false) => {
  const fallback = isJunior ? JUNIOR_FALLBACK_POLLS : SENIOR_FALLBACK_POLLS;
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .limit(limit);
    if (error) throw error;
    if (data && data.length > 0) {
      return filterPollsByAudience(data, isJunior);
    }
  } catch (err) {
    console.warn('Supabase fetch polls warning:', err);
  }
  return fallback;
};

const fetchCandidatesFromSupabase = async (institute, excludeUserId, isJunior = false) => {
  if (!supabase) return [];
  try {
    let query = supabase
      .from('users')
      .select('id, handle, name, avatar, profile_pic, grade, stream, institute, coaching_hub, is_pro, ring, selected_ring')
      .limit(80);

    if (institute) {
      query = query.eq('institute', institute);
    }
    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Filter strictly by Junior vs Senior cohort
    return (data || []).filter(c => {
      const cIsJunior = isJuniorUser(c);
      return isJunior ? cIsJunior : !cIsJunior;
    });
  } catch (err) {
    console.warn('Supabase fetch candidates warning:', err);
    return [];
  }
};

export default function Feed({
  user,
  currentPoll: propCurrentPoll,
  options: propOptions = [],
  gradeFilter: propGradeFilter = 'all',
  isLoadingPoll: propIsLoadingPoll,
  hasVoted,
  cooldownUntil,
  onLoadNextPoll,
  onCastVote,
  onShuffle,
  renderProfilePic,
  onUpgrade,
  onSkipCooldown,
  onCooldownUnlocked,
  onOpenCaptains,
  onToggleNotifications,
  pendingRequestsCount = 0
}) {
  // Local Batch Queue State
  const [pollQueue, setPollQueue] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeGradeFilter, setActiveGradeFilter] = useState(propGradeFilter || 'all');
  const [shuffleCount, setShuffleCount] = useState(0);
  const [optimisticVoted, setOptimisticVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isClassesOpen, setIsClassesOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const classesDropdownRef = useRef(null);
  const menuRef = useRef(null);
  const pollsPoolRef = useRef([]);
  const candidatesPoolRef = useRef([]);
  const isFetchingRef = useRef(false);
  const isRefillingRef = useRef(false);
  const initialFetchedRef = useRef(false);
  const lastFetchedUserRef = useRef('');
  const lastFetchedInstituteRef = useRef('');
  const autoAdvanceRef = useRef(null);

  const userId = user?.id;
  const userInstitute = (user?.institute || user?.school || '').trim();
  const isJunior = isJuniorUser(user);
  const availableClassOptions = isJunior ? JUNIOR_CLASS_OPTIONS : SENIOR_CLASS_OPTIONS;

  // Synchronize grade filter prop if parent changes it
  useEffect(() => {
    if (propGradeFilter && propGradeFilter !== activeGradeFilter) {
      setActiveGradeFilter(propGradeFilter);
    }
  }, [propGradeFilter]);

  // Close dropdown on outside click or tap
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (classesDropdownRef.current && !classesDropdownRef.current.contains(e.target)) {
        setIsClassesOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isClassesOpen || isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isClassesOpen, isMenuOpen]);

  // Clean up auto advance timer
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  // INITIAL BATCH PRE-FETCH: exactly once on mount per user/institute, zero loops
  useEffect(() => {
    if (!userId) return;

    if (
      initialFetchedRef.current &&
      lastFetchedUserRef.current === userId &&
      lastFetchedInstituteRef.current === userInstitute
    ) {
      return;
    }

    initialFetchedRef.current = true;
    lastFetchedUserRef.current = userId;
    lastFetchedInstituteRef.current = userInstitute;

    fetchInitialBatch(userInstitute, userId, activeGradeFilter);
  }, [userId, userInstitute]);

  const fetchInitialBatch = async (institute, voterId, grade) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsInitialLoading(true);

    try {
      const [polls, candidates] = await Promise.all([
        fetchPollsFromSupabase(30, isJunior),
        fetchCandidatesFromSupabase(institute, voterId, isJunior)
      ]);

      pollsPoolRef.current = polls;
      candidatesPoolRef.current = candidates;

      const batch = buildPollBatch(polls, candidates, grade, 12, isJunior);
      setPollQueue(batch);
    } catch (err) {
      console.error('Initial batch fetch failed:', err);
      const fallbackList = isJunior ? JUNIOR_FALLBACK_POLLS : SENIOR_FALLBACK_POLLS;
      const fallbackBatch = buildPollBatch(fallbackList, candidatesPoolRef.current || [], grade, 12, isJunior);
      setPollQueue(fallbackBatch);
    } finally {
      setIsInitialLoading(false);
      isFetchingRef.current = false;
    }
  };

  // BACKGROUND REFILL: silently pre-fetches next 10 polls when remaining <= 3
  const triggerBackgroundRefill = async (grade = activeGradeFilter) => {
    if (isRefillingRef.current) return;
    isRefillingRef.current = true;

    try {
      let polls = pollsPoolRef.current;
      if (!polls || polls.length === 0) {
        polls = await fetchPollsFromSupabase(30, isJunior);
        pollsPoolRef.current = polls;
      }

      let candidates = candidatesPoolRef.current;
      if (!candidates || candidates.length === 0) {
        candidates = await fetchCandidatesFromSupabase(userInstitute, userId, isJunior);
        candidatesPoolRef.current = candidates;
      }

      const nextBatch = buildPollBatch(polls, candidates, grade, 10, isJunior);
      setPollQueue(prev => [...prev, ...nextBatch]);
    } catch (err) {
      console.warn('Background refill error:', err);
    } finally {
      isRefillingRef.current = false;
    }
  };

  // INSTANT ADVANCE: zero network delay, pop from local state array
  const advanceToNextPoll = () => {
    setPollQueue(prevQueue => {
      const nextQueue = prevQueue.slice(1);
      // Background refill triggered when reaching last 3 polls in queue
      if (nextQueue.length <= 3 && !isRefillingRef.current) {
        triggerBackgroundRefill(activeGradeFilter);
      }
      return nextQueue;
    });
  };

  const currentClassLabel = !activeGradeFilter || activeGradeFilter === 'all'
    ? (isJunior ? 'All Junior Classes (6-9)' : 'All Senior Classes')
    : (availableClassOptions.find(c => c.toLowerCase() === activeGradeFilter.toLowerCase()) || activeGradeFilter);

  // Check if active cooldown is in the future
  const isCooldownActive = Boolean(
    !user?.is_pro &&
    cooldownUntil &&
    new Date(cooldownUntil).getTime() > Date.now()
  );

  // Active Poll and Options from pre-fetched queue (with prop fallback)
  const currentItem = pollQueue[0] || null;
  const currentPoll = currentItem?.poll || propCurrentPoll || null;
  const options = currentItem?.options || propOptions || [];
  const displayOptions = (options || []).slice(0, 4);

  // Only show skeleton loader when initial batch is truly loading and no poll exists yet
  const isLoading = pollQueue.length === 0 && isInitialLoading && !currentPoll;
  const isVoteFinished = optimisticVoted;

  const handleShuffleClick = () => {
    if (shuffleCount >= 3) return;
    setShuffleCount(prev => prev + 1);

    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }

    if (candidatesPoolRef.current && candidatesPoolRef.current.length >= 4) {
      const filtered = filterCandidates(candidatesPoolRef.current, activeGradeFilter, isJunior);
      const cohortPool = (candidatesPoolRef.current || []).filter(c => isJunior ? isJuniorUser(c) : !isJuniorUser(c));
      const eligible = filtered.length >= 4 ? filtered : cohortPool;
      const shuffledOptions = [...eligible].sort(() => 0.5 - Math.random()).slice(0, 4);

      setPollQueue(prev => {
        if (!prev.length) return prev;
        const [first, ...rest] = prev;
        return [{ ...first, options: shuffledOptions }, ...rest];
      });
    } else {
      setPollQueue(prev => {
        if (!prev.length) return prev;
        const [first, ...rest] = prev;
        return [{ ...first, options: [...first.options].sort(() => 0.5 - Math.random()) }, ...rest];
      });
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

    // Fire-and-forget asynchronous vote dispatch
    if (onCastVote) {
      onCastVote(candidate.id, currentPoll?.id);
    }
    if (supabase && user?.id && currentPoll?.id) {
      supabase.from('votes').insert([{
        poll_id: currentPoll.id,
        voter_id: user.id,
        receiver_id: candidate.id
      }]).catch(err => console.warn('Vote background insert warning:', err));
    }

    // Auto-advance after 1.2s if user doesn't manually tap "Next Question ➔"
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    autoAdvanceRef.current = setTimeout(() => {
      handleNextClick();
    }, 1200);
  };

  const handleNextClick = () => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    setOptimisticVoted(false);
    setSelectedCandidate(null);
    setShuffleCount(0);
    advanceToNextPoll();
  };

  const handleSkipClick = () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(8);
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    setShuffleCount(0);
    setOptimisticVoted(false);
    setSelectedCandidate(null);
    advanceToNextPoll();
  };

  const handleGradeFilterSelect = (selectedGrade) => {
    if (window.navigator?.vibrate) window.navigator.vibrate(8);
    setIsClassesOpen(false);
    setActiveGradeFilter(selectedGrade);

    // Instantly rebuild local queue from in-memory pool
    if (pollsPoolRef.current.length > 0) {
      const newBatch = buildPollBatch(
        pollsPoolRef.current,
        candidatesPoolRef.current,
        selectedGrade,
        12
      );
      setPollQueue(newBatch);
      setOptimisticVoted(false);
      setSelectedCandidate(null);
      setShuffleCount(0);
    } else {
      fetchInitialBatch(userInstitute, userId, selectedGrade);
    }

    if (onLoadNextPoll) {
      onLoadNextPoll(selectedGrade);
    }
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

  const handleCaptainsClick = () => {
    setIsMenuOpen(false);
    if (onOpenCaptains) {
      onOpenCaptains();
    } else if (typeof window !== 'undefined') {
      window.location.hash = '#/captains';
    }
  };

  const handleNotificationsClick = () => {
    setIsMenuOpen(false);
    if (onToggleNotifications) {
      onToggleNotifications();
    }
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
          else advanceToNextPoll();
        }}
        onCooldownUnlocked={() => {
          if (onCooldownUnlocked) onCooldownUnlocked();
          else if (onSkipCooldown) onSkipCooldown();
          else advanceToNextPoll();
        }}
      />
    );
  }

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
      {/* Top Header Controls: Classes Filter & Top-Right Hamburger Menu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          position: 'relative',
          zIndex: 40,
          width: '100%',
          gap: '8px'
        }}
      >
        {/* Classes Dropdown */}
        <div ref={classesDropdownRef} style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
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
                  onClick={() => handleGradeFilterSelect('all')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: (!activeGradeFilter || activeGradeFilter === 'all') ? '#000000' : 'transparent',
                    color: (!activeGradeFilter || activeGradeFilter === 'all') ? '#ffffff' : '#111827',
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
                  <span>🏫 {isJunior ? 'All Junior Classes (6-9)' : 'All Senior Classes (10-12+)'}</span>
                  {(!activeGradeFilter || activeGradeFilter === 'all') && <span>✓</span>}
                </button>

                <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }} />

                {availableClassOptions.map((c) => {
                  const isSelected = activeGradeFilter?.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleGradeFilterSelect(c)}
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

        {/* Top-Right Hamburger Menu Dropdown Trigger */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setIsMenuOpen(prev => !prev)}
            aria-label="Open navigation menu"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '14px',
              border: '1.5px solid #000000',
              background: isMenuOpen ? '#000000' : '#f9fafb',
              color: isMenuOpen ? '#ffffff' : '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            {/* Hamburger Icon: 3 horizontal lines */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>

            {/* Notification Badge indicator on Hamburger */}
            {pendingRequestsCount > 0 && !isMenuOpen && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '9.5px',
                  fontWeight: '900',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff'
                }}
              >
                {pendingRequestsCount}
              </span>
            )}
          </motion.button>

          {/* Sub-menu Dropdown */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '220px',
                  background: '#ffffff',
                  border: '1.5px solid #000000',
                  borderRadius: '18px',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.16)',
                  zIndex: 100,
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 2px 8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em' }}>
                    Quick Menu
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    aria-label="Close menu"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      padding: '2px 4px'
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* 1. Flame Icon / Score */}
                <div
                  className="gas-header-votes"
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px' }}>🔥</span>
                    <span style={{ fontWeight: '800', fontSize: '12px', color: '#111827' }}>Flames</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '900', fontSize: '13px', color: '#000000' }}>{user?.total_votes || 0}</span>
                    {user?.is_pro && <span style={{ fontSize: '13px' }}>👑</span>}
                  </div>
                </div>

                {/* 2. Captains Button */}
                <button
                  type="button"
                  onClick={handleCaptainsClick}
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    color: '#374151',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '800',
                    width: '100%',
                    transition: 'all 0.15s ease'
                  }}
                  title="Batch Captains Leaderboard"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>👑</span>
                    <span>Captains</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>➔</span>
                </button>

                {/* 3. Bell (Notifications) Button */}
                <button
                  type="button"
                  onClick={handleNotificationsClick}
                  style={{
                    position: 'relative',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    color: '#000000',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '800',
                    width: '100%',
                    transition: 'all 0.15s ease'
                  }}
                  title="Friend Requests"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>🔔</span>
                    <span>Notifications</span>
                  </div>
                  {pendingRequestsCount > 0 ? (
                    <span
                      style={{
                        background: '#000000',
                        color: '#ffffff',
                        borderRadius: '10px',
                        padding: '1px 7px',
                        fontSize: '10px',
                        fontWeight: '900'
                      }}
                    >
                      {pendingRequestsCount}
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: '600' }}>0</span>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isLoading ? (
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
              onClick={handleSkipClick}
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
      <SponsorBanner isJunior={isJunior} user={user} city="Bathinda" hub={user?.coaching_hub || user?.hub || 'Ajit Road Hub'} />
    </div>
  );
}
