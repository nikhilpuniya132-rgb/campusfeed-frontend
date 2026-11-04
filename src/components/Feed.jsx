import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SkeletonPollCard from './SkeletonPollCard';
import HamsterLoader from './HamsterLoader';
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



const filterPollsByAudience = (pollsList, isJunior) => {
  if (!pollsList || pollsList.length === 0) return [];

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

  return filtered;
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
  // 2. State variable: active unseen polls
  const [activePolls, setActivePolls] = useState([]);
  const [candidateOptions, setCandidateOptions] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeGradeFilter, setActiveGradeFilter] = useState(propGradeFilter || 'all');
  const [shuffleCount, setShuffleCount] = useState(0);
  const [optimisticVoted, setOptimisticVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isClassesOpen, setIsClassesOpen] = useState(false);

  const classesDropdownRef = useRef(null);
  const candidatesPoolRef = useRef([]);
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

  // 3. useEffect hook: fetch authenticated user's ID, call Supabase RPC get_unseen_polls, set activePolls
  useEffect(() => {
    const fetchUnseenPolls = async () => {
      setIsInitialLoading(true);
      try {
        let currentUserId = user?.id;

        // Fetch authenticated user ID from Supabase Auth if needed
        if (!currentUserId && supabase?.auth) {
          const { data: authData, error: authErr } = await supabase.auth.getUser();
          if (authErr) {
            console.warn('Auth user fetch warning:', authErr.message);
          }
          currentUserId = authData?.user?.id;
        }

        if (!currentUserId || !supabase) {
          setIsInitialLoading(false);
          return;
        }

        const { data, error } = await supabase.rpc('get_unseen_polls', {
          current_user_id: currentUserId
        });

        if (error) {
          console.error('Error fetching unseen polls via get_unseen_polls RPC:', error);
        } else if (data) {
          setActivePolls(data);
        }
      } catch (err) {
        console.error('Failed to load unseen polls:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchUnseenPolls();
  }, [user?.id]);

  // Load candidate pool for current institute & cohort
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const isJuniorCohort = isJuniorUser(user);
        const live = await fetchCandidatesFromSupabase(userInstitute, userId, isJuniorCohort);
        const combined = getCombinedCandidatePool(live, stKabirSeedNames, user);
        candidatesPoolRef.current = combined;
        const currentP = activePolls[0] || propCurrentPoll;
        if (currentP) {
          const filtered = filterCandidates(combined, activeGradeFilter, isJuniorCohort);
          const eligible = filtered.length >= 4 ? filtered : combined;
          setCandidateOptions(generatePollOptions(eligible, 4));
        }
      } catch (e) {
        console.warn('Candidate loading warning:', e);
      }
    };

    if (userId || userInstitute) {
      loadCandidates();
    }
  }, [userId, userInstitute, activeGradeFilter]);

  // When active poll changes, generate fresh 4 candidate options
  useEffect(() => {
    if (activePolls[0]) {
      const isJuniorCohort = isJuniorUser(user);
      const pool = candidatesPoolRef.current?.length >= 4
        ? candidatesPoolRef.current
        : getCombinedCandidatePool([], stKabirSeedNames, user);
      candidatesPoolRef.current = pool;
      const filtered = filterCandidates(pool, activeGradeFilter, isJuniorCohort);
      const eligible = filtered.length >= 4 ? filtered : pool;
      setCandidateOptions(generatePollOptions(eligible, 4));
    }
  }, [activePolls[0]?.id]);

  // 4. Update the handleVote(pollId, selectedOption) function to do two things:
  //    - Insert the vote into Supabase using: supabase.from('votes').insert([{ poll_id: pollId, voter_id: user.id }])
  //    - Immediately update the local UI state by filtering out the answered poll from activePolls.
  const handleVote = async (pollId, selectedOption) => {
    if (!pollId) return;

    // Immediately update the local UI state by filtering out the answered poll from activePolls
    setActivePolls(prevPolls => prevPolls.filter(p => p.id !== pollId));

    // Determine authenticated user's ID
    let voterId = user?.id;
    if (!voterId && supabase?.auth) {
      const { data: authData } = await supabase.auth.getUser();
      voterId = authData?.user?.id;
    }

    if (supabase && voterId) {
      try {
        const { error } = await supabase.from('votes').insert([{
          poll_id: pollId,
          voter_id: voterId
        }]);

        if (error) {
          console.warn('Supabase vote insert notification:', error.message);
        }
      } catch (err) {
        console.warn('Supabase vote insert error:', err);
      }
    }

    // Dispatch to parent if onCastVote prop is provided
    if (onCastVote) {
      const isRealUserUuid = Boolean(
        selectedOption?.id &&
        !selectedOption?.is_seed &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(selectedOption.id))
      );
      try {
        onCastVote(isRealUserUuid ? selectedOption.id : null, pollId);
      } catch (_) {}
    }
  };

  const handleVoteClick = (candidate) => {
    if (!candidate || optimisticVoted || !currentPoll) return;

    setShuffleCount(0);
    setSelectedCandidate(candidate);
    setOptimisticVoted(true);

    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      try { window.navigator.vibrate(15); } catch (_) {}
    }

    // Call handleVote with poll ID and candidate
    handleVote(currentPoll.id, candidate);

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
  };

  const handleSkipClick = async () => {
    if (window.navigator?.vibrate) {
      try { window.navigator.vibrate(8); } catch (_) {}
    }
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }

    const pollId = currentPoll?.id;
    if (!pollId) return;

    // Immediately update local UI state by filtering out skipped poll from activePolls
    setActivePolls(prevPolls => prevPolls.filter(p => p.id !== pollId));

    let voterId = user?.id;
    if (!voterId && supabase?.auth) {
      const { data: authData } = await supabase.auth.getUser();
      voterId = authData?.user?.id;
    }

    if (supabase && voterId) {
      try {
        await supabase.from('votes').insert([{
          poll_id: pollId,
          voter_id: voterId,
          receiver_id: null,
          status: 'skipped'
        }]);
      } catch (_) {}
    }

    setShuffleCount(0);
    setOptimisticVoted(false);
    setSelectedCandidate(null);
  };

  const handleRefreshUnseen = async () => {
    setIsInitialLoading(true);
    let voterId = user?.id;
    if (!voterId && supabase?.auth) {
      const { data: authData } = await supabase.auth.getUser();
      voterId = authData?.user?.id;
    }
    if (voterId && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_unseen_polls', {
          current_user_id: voterId
        });
        if (!error && data) {
          setActivePolls(data);
        }
      } catch (e) {
        console.warn('Refresh error:', e);
      }
    }
    setIsInitialLoading(false);
  };

  const handleShuffleClick = () => {
    if (shuffleCount >= 3) return;
    setShuffleCount(prev => prev + 1);

    if (window.navigator?.vibrate) {
      try { window.navigator.vibrate(10); } catch (_) {}
    }

    const currentCandidatePool = candidatesPoolRef.current?.length >= 4
      ? candidatesPoolRef.current
      : getCombinedCandidatePool([], stKabirSeedNames, user);
    candidatesPoolRef.current = currentCandidatePool;

    const isJuniorCohort = isJuniorUser(user);
    const filtered = filterCandidates(currentCandidatePool, activeGradeFilter, isJuniorCohort);
    const eligible = filtered.length >= 4 ? filtered : currentCandidatePool;
    const shuffledOptions = generatePollOptions(eligible, 4);
    setCandidateOptions(shuffledOptions);

    if (onShuffle) onShuffle();
  };

  const handleGradeFilterSelect = (selectedGrade) => {
    if (window.navigator?.vibrate) {
      try { window.navigator.vibrate(8); } catch (_) {}
    }
    setIsClassesOpen(false);
    setActiveGradeFilter(selectedGrade);
    setOptimisticVoted(false);
    setSelectedCandidate(null);
    setShuffleCount(0);

    const isJuniorCohort = isJuniorUser(user);
    const pool = candidatesPoolRef.current?.length >= 4
      ? candidatesPoolRef.current
      : getCombinedCandidatePool([], stKabirSeedNames, user);
    const filtered = filterCandidates(pool, selectedGrade, isJuniorCohort);
    const eligible = filtered.length >= 4 ? filtered : pool;
    setCandidateOptions(generatePollOptions(eligible, 4));

    if (onLoadNextPoll) {
      onLoadNextPoll(selectedGrade);
    }
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

  // Active Poll and Options from activePolls
  const currentPoll = activePolls[0] || null;
  const options = (candidateOptions && candidateOptions.length >= 4)
    ? candidateOptions
    : (propOptions && propOptions.length >= 4)
      ? propOptions
      : generatePollOptions(candidatesPoolRef.current?.length >= 4 ? candidatesPoolRef.current : getCombinedCandidatePool([], stKabirSeedNames, user), 4);
  const displayOptions = (options || []).slice(0, 4);

  // States
  const isLoading = isInitialLoading;
  const isVoteFinished = optimisticVoted;
  const isNoMorePolls = !isLoading && !isVoteFinished && (!currentPoll || activePolls.length === 0);

  const handleSharePoll = async () => {
    const handle = (user?.invite_code || user?.handle || 'campus').replace(/^@/, '');
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://centerinsider.vercel.app';
    const shareUrl = `${baseOrigin}/?ref=${encodeURIComponent(handle)}`;
    const qText = currentPoll?.question || 'Vote anonymously with your classmates!';
    const shareText = `🔥 "${qText}"\nVote anonymously on CenterInsider!`;

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
      className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center gap-2 md:gap-3 box-border overflow-hidden"
      style={{
        boxSizing: 'border-box',
        color: '#ffffff'
      }}
    >
      {/* 1. Classes Filter Floating Pill */}
      <div className="relative z-40 w-full shrink-0">
        <div ref={classesDropdownRef} className="relative w-full">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setIsClassesOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-full bg-black text-white font-black text-xs shadow-xl border border-white/10 hover:border-white/25 transition-all cursor-pointer box-border"
            style={{
              boxShadow: '0 8px 25px -4px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="text-xs">🎓</span>
              <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
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
                className="absolute top-[calc(100%+6px)] left-0 right-0 max-h-56 overflow-y-auto bg-black border border-zinc-800 rounded-3xl shadow-2xl p-2 z-50 box-border"
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
                  className={`w-full text-left px-3.5 py-2 rounded-xl border-none font-extrabold text-xs cursor-pointer flex items-center justify-between mb-1 transition-colors ${
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
                      className={`w-full text-left px-3.5 py-2 rounded-xl border-none font-bold text-xs cursor-pointer flex items-center justify-between mb-1 transition-colors ${
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
        <div className="w-full flex-1 flex items-center justify-center min-h-[360px]">
          <HamsterLoader message="Loading fresh polls..." color="#000000" />
        </div>
      ) : isVoteFinished ? (
        /* Optimistic Success Screen - Floating Pitch Black Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="w-full bg-black rounded-3xl md:rounded-[2.5rem] shadow-2xl p-4 md:p-8 text-center flex flex-col items-center justify-center relative border-2 border-black box-border"
          style={{
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 10px 25px -5px rgba(0, 0, 0, 0.45)'
          }}
        >
          <div className="text-4xl md:text-5xl mb-1.5 animate-bounce">🔥</div>
          <h2 className="text-white text-xl md:text-2xl font-black tracking-tight mb-1">
            Flame Sent!
          </h2>

          {selectedCandidate && (
            <div className="inline-flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-700/80 my-2 shadow-md">
              <span className="text-[11px] text-zinc-400 font-bold">To:</span>
              <span className="text-xs md:text-sm font-black text-white">
                @{selectedCandidate.handle || selectedCandidate.name}
              </span>
            </div>
          )}

          <p className="text-zinc-400 text-[11px] md:text-xs max-w-[260px] mx-auto mb-4 md:mb-6 leading-relaxed">
            Delivered anonymously. They won't know it was you unless they unlock via 3 recruits or God Mode!
          </p>

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleNextClick}
            className="w-full py-3 md:py-3.5 px-6 rounded-full bg-[#00ff41] text-black font-black text-sm md:text-base shadow-[0_0_20px_rgba(0,255,65,0.5)] hover:brightness-110 cursor-pointer transition-all border-none"
          >
            Next Question ➔
          </motion.button>
        </motion.div>
      ) : isNoMorePolls ? (
        /* No More Polls State - Clean Pitch Black Floating Card */
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="w-full bg-black rounded-3xl md:rounded-[2.5rem] shadow-2xl p-6 md:p-8 text-center flex flex-col items-center justify-center relative border-2 border-black box-border min-h-[380px]"
          style={{
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 10px 25px -5px rgba(0, 0, 0, 0.45)'
          }}
        >
          <div className="text-4xl md:text-5xl mb-3 animate-pulse">✨</div>
          <h2 className="text-white text-xl md:text-2xl font-black tracking-tight mb-2">
            No More Polls!
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm max-w-[280px] mx-auto mb-6 leading-relaxed">
            You've answered or skipped all available polls for your school. Check back tomorrow for new drama or invite classmates!
          </p>

          <div className="w-full flex flex-col gap-2.5 max-w-[280px]">
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleRefreshUnseen}
              className="w-full py-3 px-6 rounded-full bg-[#00ff41] text-black font-black text-xs md:text-sm shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:brightness-110 cursor-pointer transition-all border-none"
            >
              Check for New Polls 🔄
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleSharePoll}
              className="w-full py-3 px-6 rounded-full bg-zinc-900 text-white font-extrabold text-xs md:text-sm border border-zinc-700/80 hover:border-zinc-500 cursor-pointer transition-all"
            >
              Invite Classmates 👥
            </motion.button>
          </div>
        </motion.div>
      ) : (
        /* 2. Central Floating Poll Card (Obsidian Contrast on Neon Green) */
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="w-full bg-black rounded-3xl md:rounded-[2.5rem] shadow-2xl p-4 md:p-8 flex flex-col justify-between relative text-white border-2 border-black box-border"
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
            className="absolute top-3.5 right-3.5 md:top-6 md:right-6 w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
          >
            <Share2 size={16} strokeWidth={2.2} />
          </motion.button>

          {/* Poll Tag Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00ff41]/15 text-[#00ff41] border border-[#00ff41]/40">
              <span>⚡</span> QUESTION
            </span>
          </div>

          {/* Question Text with Tightened Leading & Responsive Mobile Font */}
          <h3 className="text-lg md:text-2xl font-black text-white text-center leading-tight tracking-tight my-2 md:my-3 px-1 min-h-[44px] md:min-h-[56px] flex items-center justify-center">
            "{currentPoll?.question || 'Who is most likely to crack NEET on the first attempt?'}"
          </h3>

          {/* 3. 4 Choice Candidate Buttons with 2px Solid Neon Borders */}
          {displayOptions.length < 4 ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 text-center flex flex-col items-center justify-center my-2"
            >
              <div className="text-2xl mb-1">👥</div>
              <p className="text-xs text-zinc-300 font-semibold max-w-[280px] mb-3 leading-relaxed">
                Not enough members in {user?.institute || 'your institute'} to unlock polls. Invite more students to start voting.
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSharePoll}
                className="bg-white text-black font-extrabold text-xs px-4 py-2 rounded-full inline-flex items-center gap-2 cursor-pointer hover:bg-zinc-200 transition-colors border-none"
              >
                <Share2 size={13} strokeWidth={2.2} />
                <span>Invite Classmates</span>
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-2 md:mb-4">
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
                    className="relative bg-black rounded-2xl py-2 px-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[76px] md:min-h-[96px] select-none group border-2 box-border"
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
                      ? renderProfilePic(opt.profile_pic, opt.avatar, opt.is_pro, opt.selected_ring || opt.ring, 34, Boolean(opt.invites >= 25 || opt.recruits >= 25 || opt.is_god_mode || opt.is_legend))
                      : (
                        <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-lg">
                          {opt.avatar || '😎'}
                        </div>
                      )}
                    <span className="font-black text-xs md:text-sm tracking-tight text-white mt-1 text-center leading-tight truncate max-w-full px-1">
                      @{opt.handle || opt.name}
                    </span>
                    {opt.stream && (
                      <span className="text-[9px] md:text-[10px] text-zinc-400 font-semibold truncate max-w-full leading-none">
                        {opt.stream}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* 4. Bottom Controls: Shuffle & Skip */}
          <div className="flex items-center justify-between pt-0.5">
            {displayOptions.length >= 4 && (
              <motion.button
                whileTap={{ scale: 0.94 }}
                disabled={shuffleCount >= 3}
                onClick={handleShuffleClick}
                className={`flex items-center gap-1 px-3 py-1.5 md:py-2 rounded-full text-xs font-bold transition-all border ${
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
              className="flex items-center gap-1 px-3.5 py-1.5 md:py-2 rounded-full text-xs font-bold bg-zinc-900/90 text-zinc-200 border border-zinc-700/80 hover:border-zinc-500 cursor-pointer ml-auto transition-all"
            >
              <span>Skip</span>
              <span>⏭️</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Dynamic Academic Sponsorship Banner */}
      <div className="w-full shrink-0">
        <SponsorBanner isJunior={isJunior} user={user} city="Bathinda" hub={user?.coaching_hub || user?.hub || 'Ajit Road Hub'} />
      </div>
    </div>
  );
}
