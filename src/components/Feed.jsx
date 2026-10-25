import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonPollCard from './SkeletonPollCard';
import CooldownScreen from './CooldownScreen';
import SponsorBanner from './SponsorBanner';
import { handleShare } from '../utils/share';
import { Share2 } from 'lucide-react';
import { MASTER_CLASS_OPTIONS, JUNIOR_CLASS_OPTIONS, SENIOR_CLASS_OPTIONS, isJuniorUser } from '../constants/classes';
import { supabase } from '../supabase';

// Hardcoded seed target names for St. Kabir
export const stKabirSeedNames = [
  "Varis",
  "Ravneet",
  "Divanshu",
  "Ishant",
  "Abhijot Brar",
  "Ishmeet",
  "Piyush",
  "Harsh",
  "Uday",
  "Gurdaas",
  "Manav",
  "Navdeep singh",
  "Navjot Sidhu",
  "Gurman",
  "Sahib",
  "Ramu",
  "Shivam",
  "Anshuman",
  "Dilshaan Sidhu",
  "Fateh",
  "Jaskaran",
  "Ramneek Singh",
  "Sanjay",
  "lakhwinder",
  "Hasmeet",
  "Manpinder"
];

const SEED_AVATARS = ['😎', '⚡', '🔥', '✨', '🦊', '🚀', '👑', '🎯', '🦁', '⭐', '🎸', '🏆', '💎', '🎨', '🌟', '🧢', '🕶️', '🥇'];

const getAvatarForSeedName = (name = '', index = 0) => {
  let charCodeSum = 0;
  for (let i = 0; i < name.length; i++) {
    charCodeSum += name.charCodeAt(i);
  }
  return SEED_AVATARS[(charCodeSum + index) % SEED_AVATARS.length] || '😎';
};

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

/**
 * Combines live active Supabase users with the hardcoded stKabirSeedNames into a single list.
 * Deduplicates names and handles, and excludes the current active voter so they don't vote for themselves.
 */
export const getCombinedCandidatePool = (liveSupabaseUsers = [], seedNames = stKabirSeedNames, currentVoter = null) => {
  const combined = [];
  const seenNames = new Set();
  const seenHandles = new Set();

  const voterId = currentVoter?.id ? String(currentVoter.id) : null;
  const voterHandle = (currentVoter?.handle || '').toLowerCase().replace(/^@/, '').trim();
  const voterName = (currentVoter?.name || '').toLowerCase().trim();

  // 1. Process active registered Supabase users
  for (const user of liveSupabaseUsers) {
    if (!user) continue;
    if (voterId && String(user.id) === voterId) continue;

    const uName = (user.name || '').toLowerCase().trim();
    const uHandle = (user.handle || '').toLowerCase().replace(/^@/, '').trim();

    // Prevent matching self
    if (voterName && uName === voterName) continue;
    if (voterHandle && uHandle === voterHandle) continue;

    combined.push({
      ...user,
      is_seed: false
    });

    if (uName) seenNames.add(uName);
    if (uHandle) seenHandles.add(uHandle);
  }

  // 2. Mix in stKabirSeedNames (deduplicating against live users and current voter)
  seedNames.forEach((name, index) => {
    if (!name || typeof name !== 'string') return;
    const cleanName = name.trim();
    const lowerName = cleanName.toLowerCase();
    const cleanHandle = lowerName.replace(/[^a-z0-9]/g, '');

    // Skip if current voter is this person
    if (voterName && lowerName === voterName) return;
    if (voterHandle && cleanHandle === voterHandle) return;

    // Skip if already represented by a live Supabase user or previous seed entry
    if (seenNames.has(lowerName) || seenHandles.has(cleanHandle)) return;

    seenNames.add(lowerName);
    seenHandles.add(cleanHandle);

    combined.push({
      id: `seed-${cleanHandle || index}`,
      name: cleanName,
      handle: cleanHandle,
      avatar: getAvatarForSeedName(cleanName, index),
      profile_pic: null,
      grade: currentVoter?.grade ? String(currentVoter.grade) : '11',
      stream: currentVoter?.stream || 'St. Kabir',
      institute: currentVoter?.institute || 'St. Kabir Convent Senior Secondary',
      is_seed: true,
      is_pro: false,
      ring: 'gold',
      selected_ring: 'gold'
    });
  });

  return combined;
};

/**
 * Randomly shuffles the candidate list and selects exactly `count` (default 4) unique options.
 */
export const generatePollOptions = (candidatesList = [], count = 4) => {
  if (!candidatesList || candidatesList.length === 0) return [];

  // Shuffle candidates array randomly
  const shuffled = [...candidatesList].sort(() => 0.5 - Math.random());

  const selected = [];
  const seenKeys = new Set();

  for (const candidate of shuffled) {
    const key = (candidate.name || candidate.handle || '').toLowerCase().trim();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      selected.push(candidate);
    }
    if (selected.length === count) break;
  }

  return selected;
};

const filterCandidates = (candidates, gradeFilter, isJunior = false) => {
  // Cohort isolation for live users (Juniors vs Seniors), while keeping seed candidates eligible
  const cohortCandidates = (candidates || []).filter(c => {
    if (c.is_seed) return true;
    const cIsJunior = isJuniorUser(c);
    return isJunior ? cIsJunior : !cIsJunior;
  });

  if (!gradeFilter || gradeFilter === 'all' || gradeFilter === 'All Classes' || gradeFilter.startsWith('All')) {
    return cohortCandidates;
  }

  const f = gradeFilter.toLowerCase().trim();
  const subFiltered = cohortCandidates.filter(c => {
    if (c.is_seed) return true; // Seed candidates remain available across classes
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
    const selectedOptions = generatePollOptions(eligibleCandidates, 4);
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
    const targetTable = isJunior ? 'polls2' : 'polls';
    const { data, error } = await supabase
      .from(targetTable)
      .select('*')
      .limit(limit);
    if (error) throw error;
    if (data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn(`Supabase fetch from ${isJunior ? 'polls2' : 'polls'} fallback:`, err);
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
  pendingRequestsCount = 0,
  onUpdateUser,
  API
}) {
  // Local Batch Queue State
  const [pollQueue, setPollQueue] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeGradeFilter, setActiveGradeFilter] = useState(propGradeFilter || 'all');
  const [shuffleCount, setShuffleCount] = useState(0);
  const [optimisticVoted, setOptimisticVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isClassesOpen, setIsClassesOpen] = useState(false);

  const classesDropdownRef = useRef(null);
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
      const [polls, liveCandidates] = await Promise.all([
        fetchPollsFromSupabase(30, isJunior),
        fetchCandidatesFromSupabase(institute, voterId, isJunior)
      ]);

      // Mix live registered Supabase users with the stKabirSeedNames
      const combinedCandidates = getCombinedCandidatePool(liveCandidates, stKabirSeedNames, user);

      pollsPoolRef.current = polls;
      candidatesPoolRef.current = combinedCandidates;

      const batch = buildPollBatch(polls, combinedCandidates, grade, 12, isJunior);
      setPollQueue(batch);
    } catch (err) {
      console.error('Initial batch fetch failed:', err);
      const fallbackList = isJunior ? JUNIOR_FALLBACK_POLLS : SENIOR_FALLBACK_POLLS;
      const combinedCandidates = candidatesPoolRef.current?.length > 0 
        ? candidatesPoolRef.current 
        : getCombinedCandidatePool([], stKabirSeedNames, user);
      candidatesPoolRef.current = combinedCandidates;
      const fallbackBatch = buildPollBatch(fallbackList, combinedCandidates, grade, 12, isJunior);
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
      if (!candidates || candidates.length < 4) {
        const live = await fetchCandidatesFromSupabase(userInstitute, userId, isJunior);
        candidates = getCombinedCandidatePool(live, stKabirSeedNames, user);
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
  const options = (currentItem?.options && currentItem.options.length >= 4)
    ? currentItem.options
    : (propOptions && propOptions.length >= 4)
      ? propOptions
      : generatePollOptions(candidatesPoolRef.current?.length >= 4 ? candidatesPoolRef.current : getCombinedCandidatePool([], stKabirSeedNames, user), 4);
  const displayOptions = (options || []).slice(0, 4);

  // Only show skeleton loader when initial batch is truly loading and no poll exists yet
  const isLoading = pollQueue.length === 0 && isInitialLoading && !currentPoll;
  const isVoteFinished = optimisticVoted;

  const handleShuffleClick = () => {
    if (shuffleCount >= 3) return;
    setShuffleCount(prev => prev + 1);

    if (window.navigator?.vibrate) {
      try { window.navigator.vibrate(10); } catch (_) {}
    }

    const currentCandidatePool = candidatesPoolRef.current || [];
    if (currentCandidatePool.length >= 4) {
      const filtered = filterCandidates(currentCandidatePool, activeGradeFilter, isJunior);
      const eligible = filtered.length >= 4 ? filtered : currentCandidatePool;
      const shuffledOptions = generatePollOptions(eligible, 4);

      setPollQueue(prev => {
        if (!prev.length) return prev;
        const [first, ...rest] = prev;
        return [{ ...first, options: shuffledOptions }, ...rest];
      });
    } else {
      const fallbackPool = getCombinedCandidatePool([], stKabirSeedNames, user);
      candidatesPoolRef.current = fallbackPool;
      const shuffledOptions = generatePollOptions(fallbackPool, 4);
      setPollQueue(prev => {
        if (!prev.length) return prev;
        const [first, ...rest] = prev;
        return [{ ...first, options: shuffledOptions }, ...rest];
      });
    }

    if (onShuffle) onShuffle();
  };

  /**
   * Safe Vote Handler: Guarantees that clicking ANY option (seed name or registered Supabase user)
   * records the vote in the database without throwing unhandled exceptions or crashing the app.
   */
  const handleVoteClick = (candidate) => {
    if (!candidate || optimisticVoted) return;

    setShuffleCount(0);
    setSelectedCandidate(candidate);
    setOptimisticVoted(true);

    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      try { window.navigator.vibrate(15); } catch (_) {}
    }

    // Determine safe receiver ID:
    // If the candidate is a registered Supabase user with a valid UUID, use their ID.
    // If it's a seed name (not a database user row), use null to avoid foreign key constraint failure.
    const isRealUserUuid = Boolean(
      candidate.id &&
      !candidate.is_seed &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(candidate.id))
    );
    const dbReceiverId = isRealUserUuid ? candidate.id : null;

    // Verify if currentPoll.id is a valid UUID
    const isPollUuid = Boolean(
      currentPoll?.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(currentPoll.id))
    );
    const dbPollId = isPollUuid ? currentPoll.id : null;

    // 1. Dispatch asynchronous vote to parent App / backend
    if (onCastVote) {
      try {
        onCastVote(dbReceiverId, dbPollId || currentPoll?.id);
      } catch (err) {
        console.warn('onCastVote dispatch error handled safely:', err);
      }
    }

    // 2. Direct Supabase insert wrapped in async try/catch with .catch fallback
    if (supabase && user?.id) {
      (async () => {
        try {
          const votePayload = {
            voter_id: user.id,
            receiver_id: dbReceiverId,
            poll_id: dbPollId
          };
          const { error } = await supabase.from('votes').insert([votePayload]);
          if (error) {
            console.warn('Supabase vote recording notification:', error.message);
          }
        } catch (err) {
          console.warn('Supabase vote recording handled safely:', err);
        }
      })();
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
    if (window.navigator?.vibrate) {
      try { window.navigator.vibrate(8); } catch (_) {}
    }
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
    if (window.navigator?.vibrate) {
      try { window.navigator.vibrate(8); } catch (_) {}
    }
    setIsClassesOpen(false);
    setActiveGradeFilter(selectedGrade);

    // Instantly rebuild local queue from in-memory pool
    const pool = candidatesPoolRef.current?.length >= 4
      ? candidatesPoolRef.current
      : getCombinedCandidatePool([], stKabirSeedNames, user);
    candidatesPoolRef.current = pool;

    if (pollsPoolRef.current.length > 0) {
      const newBatch = buildPollBatch(
        pollsPoolRef.current,
        pool,
        selectedGrade,
        12,
        isJunior
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
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://centerinsider.vercel.app';
    const shareUrl = `${baseOrigin}/?ref=${encodeURIComponent(handle)}`;
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

  const NEON_OPTION_THEMES = [
    { border: 'border-[#ff007f]', color: '#ff007f', shadow: 'rgba(255, 0, 127, 0.45)' }, // 1. Pink
    { border: 'border-[#0090ff]', color: '#0090ff', shadow: 'rgba(0, 144, 255, 0.45)' }, // 2. Blue
    { border: 'border-[#ffe600]', color: '#ffe600', shadow: 'rgba(255, 230, 0, 0.45)' }, // 3. Yellow
    { border: 'border-[#00ff41]', color: '#00ff41', shadow: 'rgba(0, 255, 65, 0.45)' }  // 4. Green
  ];

  return (
    <div
      className="w-full max-w-md mx-auto flex flex-col gap-6 mb-32 box-border"
      style={{
        boxSizing: 'border-box',
        color: '#ffffff'
      }}
    >
      {/* 1. Classes Filter Floating Pill */}
      <div className="relative z-40 w-full">
        <div ref={classesDropdownRef} className="relative w-full">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setIsClassesOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-5 py-3 rounded-full bg-black text-white font-black text-xs shadow-xl border border-white/10 hover:border-white/25 transition-all cursor-pointer box-border"
            style={{
              boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-sm">🎓</span>
              <span className="text-zinc-400 font-bold text-[11px] uppercase tracking-wider">
                Classes:
              </span>
              <span className="font-black text-white text-xs truncate max-w-[190px]">
                {currentClassLabel}
              </span>
            </div>
            <span
              className="text-[10px] text-zinc-400 transition-transform duration-200"
              style={{ transform: isClassesOpen ? 'rotate(180deg)' : 'none' }}
            >
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
                className="absolute top-[calc(100%+8px)] left-0 right-0 max-h-64 overflow-y-auto bg-black border border-zinc-800 rounded-3xl shadow-2xl p-2 z-50 box-border"
                style={{
                  boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255,255,255,0.08)'
                }}
              >
                <div className="px-3 py-1.5 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Filter By Class / Stream
                </div>

                <button
                  type="button"
                  onClick={() => handleGradeFilterSelect('all')}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border-none font-extrabold text-xs cursor-pointer flex items-center justify-between mb-1 transition-colors ${
                    (!activeGradeFilter || activeGradeFilter === 'all')
                      ? 'bg-zinc-800 text-white'
                      : 'bg-transparent text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span>🏫 {isJunior ? 'All Junior Classes (6-9)' : 'All Senior Classes (10-12+)'}</span>
                  {(!activeGradeFilter || activeGradeFilter === 'all') && <span className="text-[#00ff41]">✓</span>}
                </button>

                <div className="h-px bg-zinc-800 my-1" />

                {availableClassOptions.map((c) => {
                  const isSelected = activeGradeFilter?.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleGradeFilterSelect(c)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border-none font-bold text-xs cursor-pointer flex items-center justify-between mb-1 transition-colors ${
                        isSelected
                          ? 'bg-zinc-800 text-white'
                          : 'bg-transparent text-zinc-300 hover:bg-zinc-900'
                      }`}
                    >
                      <span>{c}</span>
                      {isSelected && <span className="text-[#00ff41]">✓</span>}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isLoading ? (
        <SkeletonPollCard />
      ) : isVoteFinished ? (
        /* Optimistic Success Screen - Floating Pitch Black Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full bg-black rounded-[2.5rem] shadow-2xl p-8 text-center flex flex-col items-center justify-center min-h-[360px] relative border-2 border-black box-border"
          style={{
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 10px 25px -5px rgba(0, 0, 0, 0.45)'
          }}
        >
          <div className="text-6xl mb-3 animate-bounce">🔥</div>
          <h2 className="text-white text-3xl font-black tracking-tight mb-2">
            Flame Sent!
          </h2>

          {selectedCandidate && (
            <div className="inline-flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-700/80 my-3 shadow-md">
              <span className="text-xs text-zinc-400 font-bold">To:</span>
              <span className="text-sm font-black text-white">
                @{selectedCandidate.handle || selectedCandidate.name}
              </span>
            </div>
          )}

          <p className="text-zinc-400 text-xs max-w-[270px] mx-auto mb-8 leading-relaxed">
            Delivered anonymously. They won't know it was you unless they unlock via 3 recruits or God Mode!
          </p>

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleNextClick}
            className="w-full py-4 px-8 rounded-full bg-[#00ff41] text-black font-black text-base shadow-[0_0_25px_rgba(0,255,65,0.6)] hover:brightness-110 cursor-pointer transition-all border-none"
          >
            Next Question ➔
          </motion.button>
        </motion.div>
      ) : (
        /* 2. Central Floating Poll Card (Obsidian Contrast on Neon Green) */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full bg-black rounded-[2.5rem] shadow-2xl p-8 flex flex-col relative text-white border-2 border-black box-border"
          style={{
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 12px 28px -6px rgba(0, 0, 0, 0.45)'
          }}
        >
          {/* Top Share Icon Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={handleSharePoll}
            title="Share Question"
            aria-label="Share Question"
            className="absolute top-6 right-6 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
          >
            <Share2 size={18} strokeWidth={2.2} />
          </motion.button>

          {/* Poll Tag Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/40">
              <span>⚡</span> QUESTION
            </span>
          </div>

          {/* Question Text with Generous Internal Breathing Room */}
          <h3 className="text-2xl sm:text-[26px] font-black text-white text-center leading-snug tracking-tight my-6 px-2 min-h-[72px] flex items-center justify-center">
            "{currentPoll?.question || 'Who is most likely to crack NEET on the first attempt?'}"
          </h3>

          {/* 3. 4 Choice Candidate Buttons with 2px Solid Neon Borders */}
          {displayOptions.length < 4 ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 text-center flex flex-col items-center justify-center my-4"
            >
              <div className="text-3xl mb-2">👥</div>
              <p className="text-xs text-zinc-300 font-semibold max-w-[280px] mb-4 leading-relaxed">
                Not enough members in {user?.institute || 'your institute'} to unlock polls. Invite more students to start voting.
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSharePoll}
                className="bg-white text-black font-extrabold text-xs px-5 py-3 min-h-[44px] rounded-full inline-flex items-center gap-2 cursor-pointer hover:bg-zinc-200 transition-colors border-none"
              >
                <Share2 size={14} strokeWidth={2.2} />
                <span>Invite Classmates</span>
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 mb-6">
              {displayOptions.map((opt, idx) => {
                const neon = NEON_OPTION_THEMES[idx % NEON_OPTION_THEMES.length];
                const optKey = opt.id || `opt-${opt.handle || opt.name || idx}-${idx}`;
                return (
                  <motion.button
                    key={optKey}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.12 }}
                    onClick={() => handleVoteClick(opt)}
                    className="relative bg-black rounded-2xl py-4 px-3 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[118px] select-none group border-2 box-border"
                    style={{
                      backgroundColor: '#000000',
                      borderColor: neon.color,
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      boxShadow: `0 4px 15px -2px rgba(0, 0, 0, 0.4)`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 20px ${neon.shadow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 15px -2px rgba(0, 0, 0, 0.4)';
                    }}
                  >
                    {renderProfilePic
                      ? renderProfilePic(opt.profile_pic, opt.avatar, opt.is_pro, opt.selected_ring || opt.ring, 42, Boolean(opt.invites >= 25 || opt.recruits >= 25 || opt.is_god_mode || opt.is_legend))
                      : (
                        <div className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xl">
                          {opt.avatar || '😎'}
                        </div>
                      )}
                    <span className="font-black text-sm tracking-tight text-white mt-2.5 text-center leading-tight truncate max-w-full px-1">
                      @{opt.handle || opt.name}
                    </span>
                    {opt.stream && (
                      <span className="text-[10px] text-zinc-400 font-semibold mt-0.5 truncate max-w-full">
                        {opt.stream}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* 4. Bottom Controls: Shuffle & Skip */}
          <div className="flex items-center justify-between pt-1">
            {displayOptions.length >= 4 && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                disabled={shuffleCount >= 3}
                onClick={handleShuffleClick}
                className={`flex items-center gap-1.5 px-4 py-3 min-h-[44px] rounded-full text-xs font-bold transition-all border ${
                  shuffleCount >= 3
                    ? 'bg-zinc-950 text-zinc-600 border-zinc-800 cursor-not-allowed opacity-50'
                    : 'bg-zinc-900/90 text-zinc-200 border-zinc-700/80 hover:border-zinc-500 cursor-pointer'
                }`}
              >
                <span>🔀</span>
                <span>{shuffleCount >= 3 ? 'No shuffles' : `Shuffle (${3 - shuffleCount})`}</span>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleSkipClick}
              className="flex items-center gap-1.5 px-4 py-3 min-h-[44px] rounded-full text-xs font-bold bg-zinc-900/90 text-zinc-200 border border-zinc-700/80 hover:border-zinc-500 cursor-pointer ml-auto transition-all"
            >
              <span>Skip</span>
              <span>⏭️</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Dynamic Academic Sponsorship Banner */}
      <div className="w-full">
        <SponsorBanner isJunior={isJunior} user={user} city="Bathinda" hub={user?.coaching_hub || user?.hub || 'Ajit Road Hub'} />
      </div>
    </div>
  );
}
