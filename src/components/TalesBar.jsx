import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles, Plus } from 'lucide-react';
import { supabase as defaultSupabase } from '../supabase';

export default function TalesBar({
  user: propUser,
  supabase: propSupabase,
  userHasActiveTale = false,
  onOpenUpload
}) {
  const supabase = propSupabase || defaultSupabase;

  const [talesUsers, setTalesUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Story Viewer Overlay State
  const [activeStoryUser, setActiveStoryUser] = useState(null);
  const [currentTaleIndex, setCurrentTaleIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Helper for human-readable time ago
  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch (_) {
      return 'Recently';
    }
  };

  // 2. Fetch Logic: query public.tales where expires_at > now(), join with public.users
  const fetchActiveTales = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const nowIso = new Date().toISOString();

      // First attempt: Joined query with users, including audio_url and song_name
      const { data: joinedData, error: joinError } = await supabase
        .from('tales')
        .select(`
          id,
          author_id,
          image_url,
          audio_url,
          song_name,
          created_at,
          expires_at,
          users:author_id (
            id,
            handle,
            bio,
            profile_pic_url
          )
        `)
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false });

      let talesList = joinedData;

      // Fallback if join syntax is not configured as foreign key in Supabase
      if (joinError || !talesList) {
        const { data: rawTales, error: rawError } = await supabase
          .from('tales')
          .select('*')
          .gt('expires_at', nowIso)
          .order('created_at', { ascending: false });

        if (rawError || !rawTales) {
          console.warn('Error fetching tales:', rawError || joinError);
          setTalesUsers([]);
          return;
        }

        // Fetch user records manually for matching author_ids
        const authorIds = [...new Set(rawTales.map(t => t.author_id).filter(Boolean))];
        let usersMap = {};
        if (authorIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, handle, bio, profile_pic_url')
            .in('id', authorIds);

          (usersData || []).forEach(u => {
            usersMap[u.id] = u;
          });
        }

        talesList = rawTales.map(t => ({
          ...t,
          users: usersMap[t.author_id] || null
        }));
      }

      // 3. Group the active tales by author_id
      const grouped = {};
      (talesList || []).forEach(tale => {
        const authorId = tale.author_id;
        if (!authorId) return;

        if (!grouped[authorId]) {
          grouped[authorId] = {
            authorId,
            handle: tale.users?.handle || 'Classmate',
            profilePicUrl: tale.users?.profile_pic_url || '',
            bio: tale.users?.bio || '',
            tales: []
          };
        }
        grouped[authorId].tales.push(tale);
      });

      // Sort current user first if they have a tale, otherwise recent
      const sortedUsers = Object.values(grouped);
      if (propUser?.id) {
        sortedUsers.sort((a, b) => (a.authorId === propUser.id ? -1 : b.authorId === propUser.id ? 1 : 0));
      }

      setTalesUsers(sortedUsers);
    } catch (err) {
      console.error('Failed to fetch tales:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTales();

    // Listen for custom event when a user adds a post to their Tale
    const handleTalePosted = () => {
      fetchActiveTales();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('campus-tale-posted', handleTalePosted);
      return () => window.removeEventListener('campus-tale-posted', handleTalePosted);
    }
  }, [propUser?.id]);

  // Story Viewer Timer for auto-advancing
  useEffect(() => {
    if (!activeStoryUser || isPaused) return;

    timerRef.current = setTimeout(() => {
      handleNextTale();
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeStoryUser, currentTaleIndex, isPaused]);

  // Story Navigation
  const handleOpenStory = (userGroup) => {
    setActiveStoryUser(userGroup);
    setCurrentTaleIndex(0);
    setIsPaused(false);
  };

  const handleCloseStory = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveStoryUser(null);
    setCurrentTaleIndex(0);
    setIsPaused(false);
  };

  const handleNextTale = () => {
    if (!activeStoryUser) return;
    if (currentTaleIndex < activeStoryUser.tales.length - 1) {
      setCurrentTaleIndex(prev => prev + 1);
    } else {
      // Find next user in tales list or close
      const currentIdx = talesUsers.findIndex(u => u.authorId === activeStoryUser.authorId);
      if (currentIdx !== -1 && currentIdx < talesUsers.length - 1) {
        setActiveStoryUser(talesUsers[currentIdx + 1]);
        setCurrentTaleIndex(0);
      } else {
        handleCloseStory();
      }
    }
  };

  const handlePrevTale = () => {
    if (!activeStoryUser) return;
    if (currentTaleIndex > 0) {
      setCurrentTaleIndex(prev => prev - 1);
    } else {
      // Find previous user in tales list
      const currentIdx = talesUsers.findIndex(u => u.authorId === activeStoryUser.authorId);
      if (currentIdx > 0) {
        const prevUser = talesUsers[currentIdx - 1];
        setActiveStoryUser(prevUser);
        setCurrentTaleIndex(prevUser.tales.length - 1);
      }
    }
  };

  const activeTale = activeStoryUser?.tales?.[currentTaleIndex];
  const currentUserHasTaleInList = propUser?.id && talesUsers.some(u => u.authorId === propUser.id);
  const showCurrentUserPill = !currentUserHasTaleInList && (propUser || userHasActiveTale);

  return (
    <div className="w-full relative z-20 select-none">
      {/* 1. Horizontal scrolling container like Instagram Stories */}
      <div className="w-full flex items-center gap-3 overflow-x-auto py-2.5 px-3 scrollbar-none border-b border-white/10 bg-black/40 backdrop-blur-md rounded-2xl">
        
        {/* Current User "+ Your Tale" avatar bubble if they have no active tales in the fetched list */}
        {showCurrentUserPill && (
          <div
            onClick={() => {
              if (onOpenUpload) onOpenUpload();
            }}
            className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group"
          >
            <div className="relative">
              {/* Colorful gradient border ring when userHasActiveTale is dynamically active */}
              <div
                className={`w-14 h-14 rounded-full p-[2.5px] transition-all ${
                  userHasActiveTale
                    ? 'bg-gradient-to-tr from-[#f59e0b] via-[#ec4899] to-[#8b5cf6] shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                    : 'bg-zinc-800 group-hover:bg-zinc-700'
                }`}
              >
                <div className="w-full h-full bg-black rounded-full overflow-hidden p-[2px] flex items-center justify-center">
                  {propUser?.profile_pic || propUser?.profile_pic_url ? (
                    <img
                      src={propUser.profile_pic || propUser.profile_pic_url}
                      alt="Your profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-xl">{propUser?.avatar || '😎'}</span>
                  )}
                </div>
              </div>

              {/* Plus Badge */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#ff007f] border-2 border-black rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-md">
                +
              </div>
            </div>
            <span className="text-[10.5px] font-bold text-zinc-300 max-w-[58px] truncate text-center">
              Your Tale
            </span>
          </div>
        )}

        {/* 4. UI Rendering: Map grouped tales into horizontal list with colorful gradient border */}
        {talesUsers.map((userGroup) => {
          const isCurrentUser = propUser?.id && userGroup.authorId === propUser.id;
          return (
            <motion.div
              key={userGroup.authorId}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleOpenStory(userGroup)}
              className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group"
            >
              {/* Colorful gradient border (pink/orange/purple ring) */}
              <div className="w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-[#f59e0b] via-[#ec4899] to-[#8b5cf6] shadow-[0_0_14px_rgba(236,72,153,0.4)] group-hover:brightness-110 transition-all">
                <div className="w-full h-full bg-black rounded-full overflow-hidden p-[2px] flex items-center justify-center">
                  {userGroup.profilePicUrl ? (
                    <img
                      src={userGroup.profilePicUrl}
                      alt={userGroup.handle}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-full flex items-center justify-center text-sm font-black text-white">
                      {userGroup.handle?.charAt(0).toUpperCase() || '✨'}
                    </div>
                  )}
                </div>
              </div>

              {/* Author Handle */}
              <span className="text-[10.5px] font-bold text-zinc-300 max-w-[62px] truncate text-center">
                {isCurrentUser ? 'Your Tale' : `@${userGroup.handle}`}
              </span>
            </motion.div>
          );
        })}

        {/* Empty placeholder if no active tales at all */}
        {!showCurrentUserPill && talesUsers.length === 0 && !isLoading && (
          <div className="flex items-center gap-2 px-3 py-1 text-xs text-zinc-400">
            <Sparkles size={14} className="text-[#ec4899]" />
            <span>No active tales yet. Add yours!</span>
          </div>
        )}
      </div>

      {/* Task 2.1: Full-Screen Modal/Overlay Displaying User's Active Tale */}
      <AnimatePresence>
        {activeStoryUser && activeTale && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center"
            onClick={handleCloseStory}
          >
            {/* Task 2.2: Hidden Audio Element for Auto-Playing Tale Music */}
            {activeTale.audio_url && (
              <audio
                key={activeTale.id || activeTale.audio_url}
                src={activeTale.audio_url}
                autoPlay
                loop
                style={{ display: 'none' }}
              />
            )}

            {/* Tale Container Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md h-[92vh] max-h-[780px] bg-zinc-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-zinc-800"
            >
              {/* Progress Bars at Top */}
              <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
                {activeStoryUser.tales.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full transition-all duration-200 ${
                        idx < currentTaleIndex
                          ? 'w-full bg-white'
                          : idx === currentTaleIndex
                          ? 'w-full bg-[#ec4899] animate-pulse'
                          : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Header: Author Info + Close Button */}
              <div className="absolute top-6 inset-x-4 z-30 flex items-center justify-between text-white drop-shadow">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-[#f59e0b] via-[#ec4899] to-[#8b5cf6]">
                    <div className="w-full h-full bg-black rounded-full overflow-hidden flex items-center justify-center">
                      {activeStoryUser.profilePicUrl ? (
                        <img
                          src={activeStoryUser.profilePicUrl}
                          alt={activeStoryUser.handle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-black text-white">
                          {activeStoryUser.handle?.charAt(0).toUpperCase() || '✨'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white leading-tight">
                      @{activeStoryUser.handle}
                    </span>
                    <span className="text-[10px] text-zinc-300 font-medium">
                      {formatTimeAgo(activeTale.created_at)}
                    </span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleCloseStory}
                  className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/90 flex items-center justify-center cursor-pointer transition-all"
                  aria-label="Close Story"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Task 2.3: Music Sticker Overlay (Styled visual sticker with music note icon) */}
              {activeTale.song_name && (
                <div className="absolute top-20 left-4 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-xl animate-pulse pointer-events-none select-none">
                  <span className="text-sm">🎵</span>
                  <span className="text-xs font-black tracking-wide max-w-[220px] truncate">
                    {activeTale.song_name}
                  </span>
                </div>
              )}

              {/* Active Tale Image */}
              <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                <img
                  src={activeTale.image_url}
                  alt={`Tale by ${activeStoryUser.handle}`}
                  className="w-full h-full object-cover select-none"
                />

                {/* Left / Right Tap zones for Story navigation */}
                <div
                  onClick={handlePrevTale}
                  className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-pointer"
                  title="Previous"
                />
                <div
                  onClick={handleNextTale}
                  className="absolute right-0 inset-y-0 w-1/3 z-20 cursor-pointer"
                  title="Next"
                />

                {/* Navigation Arrows for desktop clarity */}
                <button
                  type="button"
                  onClick={handlePrevTale}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hidden md:flex items-center justify-center cursor-pointer hover:bg-black/80"
                  aria-label="Previous Tale"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleNextTale}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hidden md:flex items-center justify-center cursor-pointer hover:bg-black/80"
                  aria-label="Next Tale"
                >
                  <ChevronRight size={18} />
                </button>

                {/* Gradient shade at top for header readability */}
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
