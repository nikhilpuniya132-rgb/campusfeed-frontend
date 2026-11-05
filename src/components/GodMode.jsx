import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Repeat,
  Share2,
  BookOpen,
  ChevronDown,
  Send,
  X,
  Sparkles,
  CheckCircle2,
  Bookmark,
  Music,
  Search,
  Play,
  Pause
} from 'lucide-react';
import { supabase as defaultSupabase } from '../supabase';
import TalesBar from './TalesBar';

export default function GodMode({
  user: propUser,
  supabase: propSupabase
}) {
  const supabase = propSupabase || defaultSupabase;

  // 3. State: posts (array) and currentIndex (number)
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Interaction feedback states
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [repostedPostIds, setRepostedPostIds] = useState(new Set());
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [taleAddedPostIds, setTaleAddedPostIds] = useState(new Set());
  const [userHasActiveTale, setUserHasActiveTale] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Comment Submenu / Modal State
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Task 1: Spotify Search & Add to Tale Modal State
  const [showTaleModal, setShowTaleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPostingTale, setIsPostingTale] = useState(false);
  const [previewingTrackId, setPreviewingTrackId] = useState(null);
  const audioPreviewRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Helper to fetch user ID
  const getUserId = async () => {
    if (propUser?.id) return propUser.id;
    if (supabase?.auth) {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id || null;
    }
    return null;
  };

  // 4. Fetch Logic: query photo_posts where is_archived = false ordered by created_at descending
  const fetchPhotoPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('photo_posts')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching spotlight photo posts:', error);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch photo posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotoPosts();

    // Listen for photo upload event dispatched from the Sidebar + menu
    const handleNewPhoto = () => {
      fetchPhotoPosts();
      setCurrentIndex(0);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('campus-photo-posted', handleNewPhoto);
      return () => window.removeEventListener('campus-photo-posted', handleNewPhoto);
    }
  }, []);

  // 5. Skip Mechanism: increments currentIndex by 1
  const handleNext = () => {
    setShowCommentModal(false);
    setShowTaleModal(false);
    setCurrentIndex(prev => prev + 1);
  };

  const handleStartOver = () => {
    setShowCommentModal(false);
    setShowTaleModal(false);
    setCurrentIndex(0);
  };

  const currentPost = posts[currentIndex] || null;

  // 6. Post Actions UI & Logic
  // Action a: ❤️ Like (inserts into photo_votes)
  const handleLike = async () => {
    if (!currentPost || likedPostIds.has(currentPost.id)) return;

    setLikedPostIds(prev => new Set(prev).add(currentPost.id));
    showToast('Liked post! ❤️');

    try {
      const userId = await getUserId();
      if (!userId || !supabase) return;

      const { error } = await supabase
        .from('photo_votes')
        .insert([{
          post_id: currentPost.id,
          voter_id: userId
        }]);

      if (error) {
        console.warn('Like insert notification:', error.message);
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  // Action b: 💬 Comment (opens simple input to insert into comments)
  const openComments = async () => {
    if (!currentPost) return;
    setShowCommentModal(true);
    setIsLoadingComments(true);

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', currentPost.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setCommentsList(data);
        }
      }
    } catch (err) {
      console.warn('Fetch comments warning:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async (e) => {
    e?.preventDefault();
    if (!commentText.trim() || !currentPost) return;

    setIsPostingComment(true);
    try {
      const userId = await getUserId();
      if (!userId || !supabase) {
        showToast('Please sign in to comment');
        setIsPostingComment(false);
        return;
      }

      const content = commentText.trim();
      const newComment = {
        post_id: currentPost.id,
        author_id: userId,
        content
      };

      const { error } = await supabase
        .from('comments')
        .insert([newComment]);

      if (error) {
        throw error;
      }

      setCommentsList(prev => [newComment, ...prev]);
      setCommentText('');
      showToast('Comment posted! 💬');
    } catch (err) {
      console.error('Failed to post comment:', err);
      showToast('Could not post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Action c: 🔄 Repost (inserts into reposts)
  const handleRepost = async () => {
    if (!currentPost || repostedPostIds.has(currentPost.id)) return;

    setRepostedPostIds(prev => new Set(prev).add(currentPost.id));
    showToast('Reposted! 🔄');

    try {
      const userId = await getUserId();
      if (!userId || !supabase) return;

      const { error } = await supabase
        .from('reposts')
        .insert([{
          post_id: currentPost.id,
          user_id: userId
        }]);

      if (error) {
        console.warn('Repost notification:', error.message);
      }
    } catch (err) {
      console.error('Failed to repost:', err);
    }
  };

  // Action d: 💾 Save Button (inserts into saved_posts with success toast)
  const handleSave = async () => {
    if (!currentPost || savedPostIds.has(currentPost.id)) return;

    setSavedPostIds(prev => new Set(prev).add(currentPost.id));
    showToast('Saved to your collection! 💾');

    try {
      const userId = await getUserId();
      if (!userId || !supabase) {
        showToast('Please sign in to save');
        return;
      }

      const { error } = await supabase
        .from('saved_posts')
        .insert([{
          post_id: currentPost.id,
          user_id: userId
        }]);

      if (error) {
        console.warn('Save post notification:', error.message);
      }
    } catch (err) {
      console.error('Failed to save post:', err);
    }
  };

  // Action e: 📤 Share (uses native navigator.share or copies URL)
  const handleShare = async () => {
    if (!currentPost) return;

    const shareUrl = currentPost.image_url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareText = currentPost.caption || 'Check out this spotlight post on CenterInsider!';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'CenterInsider Spotlight',
          text: shareText,
          url: shareUrl
        });
        showToast('Shared! 📤');
      } catch (_) {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard! 📋');
    } else {
      showToast('Link copied! 📋');
    }
  };

  // Task 1.3: Spotify Auth Helper
  const getSpotifyToken = async () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '89e25dda422048b6847b20c322ce9197';
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '16a4002448f74f7497fe1e08b3de7eb0';

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
      },
      body: 'grant_type=client_credentials'
    });

    if (!res.ok) {
      throw new Error(`Spotify auth token failed with status: ${res.status}`);
    }

    const data = await res.json();
    return data.access_token;
  };

  // Task 1.4: Spotify Search Logic
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const token = await getSpotifyToken();
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        throw new Error(`Spotify search failed with status: ${res.status}`);
      }

      const data = await res.json();
      // Filter the returned tracks.items to ONLY include tracks where preview_url is not null
      const filtered = (data?.tracks?.items || []).filter(track => track.preview_url);
      setSearchResults(filtered);
    } catch (err) {
      console.error('Spotify Search Error:', err);
      showToast('Spotify search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Task 1.1: Update 📖 "Add to Tale" button to open modal overlay
  const handleOpenTaleModal = () => {
    if (!currentPost) return;
    setShowTaleModal(true);
    setSearchQuery('');
    setSearchResults([]);
    setPreviewingTrackId(null);
  };

  // Track Audio Preview toggle in search list
  const toggleTrackPreview = (track) => {
    if (previewingTrackId === track.id) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setPreviewingTrackId(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(track.preview_url);
      audioPreviewRef.current = audio;
      audio.play().catch(() => {});
      audio.onended = () => setPreviewingTrackId(null);
      setPreviewingTrackId(track.id);
    }
  };

  // Task 1.6: Post Logic when "Select" track is clicked
  const handleSelectTrack = async (track) => {
    if (!currentPost) return;
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setIsPostingTale(true);

    try {
      const userId = await getUserId();
      if (!userId || !supabase) {
        showToast('Please sign in to add to Tale');
        setIsPostingTale(false);
        return;
      }

      // Insert into public.tales with author_id, image_url, audio_url, song_name
      const { error } = await supabase
        .from('tales')
        .insert([{
          author_id: userId,
          image_url: currentPost.image_url,
          audio_url: track.preview_url,
          song_name: track.name
        }]);

      if (error) {
        console.warn('Add to Tale insert warning:', error.message);
      }

      setTaleAddedPostIds(prev => new Set(prev).add(currentPost.id));
      setUserHasActiveTale(true);
      setShowTaleModal(false);
      showToast('Added to your Tale! 🎵');

      // Dispatch event for TalesBar to refresh immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('campus-tale-posted'));
      }
    } catch (err) {
      console.error('Failed to post tale with music:', err);
      showToast('Could not add to Tale');
    } finally {
      setIsPostingTale(false);
    }
  };

  // Optional: Post to Tale without soundtrack
  const handlePostWithoutMusic = async () => {
    if (!currentPost) return;
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setIsPostingTale(true);

    try {
      const userId = await getUserId();
      if (!userId || !supabase) {
        showToast('Please sign in to add to Tale');
        return;
      }

      const { error } = await supabase
        .from('tales')
        .insert([{
          author_id: userId,
          image_url: currentPost.image_url
        }]);

      if (error) {
        console.warn('Add to Tale insert warning:', error.message);
      }

      setTaleAddedPostIds(prev => new Set(prev).add(currentPost.id));
      setUserHasActiveTale(true);
      setShowTaleModal(false);
      showToast('Added to your Tale! 📖');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('campus-tale-posted'));
      }
    } catch (err) {
      console.error('Failed to add to tale:', err);
      showToast('Could not add to Tale');
    } finally {
      setIsPostingTale(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-[calc(100vh-140px)] min-h-[560px] max-h-[800px] flex flex-col items-center relative select-none pb-12 text-white box-border gap-2">
      {/* 1. Mount TalesBar Component at the Absolute Top of the Feed Viewport */}
      <div className="w-full flex-shrink-0">
        <TalesBar
          user={propUser}
          supabase={supabase}
          userHasActiveTale={userHasActiveTale}
        />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-20 z-50 bg-[#00ff41] text-black font-black text-xs px-4 py-2 rounded-full shadow-[0_0_20px_rgba(0,255,65,0.6)] flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Loading State */}
      {isLoading ? (
        <div className="w-full flex-1 bg-black border border-zinc-800 rounded-3xl md:rounded-[2.5rem] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#ff007f] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-zinc-400">Loading spotlight reel...</span>
        </div>
      ) : currentIndex >= posts.length || !currentPost ? (
        /* 5. End of Array State: "You're caught up!" */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full flex-1 bg-black border-2 border-zinc-800 rounded-3xl md:rounded-[2.5rem] p-8 text-center flex flex-col items-center justify-center gap-4 shadow-2xl"
        >
          <div className="text-5xl animate-bounce">✨</div>
          <h2 className="text-2xl font-black text-white tracking-tight">You're caught up!</h2>
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
            You've seen all the spotlight posts for now. Tap "+" on the top menu to share your own photo!
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStartOver}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ff007f] text-white font-black text-xs shadow-[0_0_20px_rgba(255,0,127,0.5)] hover:brightness-110 cursor-pointer border-none transition-all"
          >
            <span>Start Over 🔄</span>
          </motion.button>
        </motion.div>
      ) : (
        /* 2. Full-height Reels/Spotlight Card (ONLY ONE post on screen at a time) */
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPost.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className="relative w-full flex-1 bg-black border-2 border-zinc-800 rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col box-border"
            style={{
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 0, 0, 0.8)'
            }}
          >
            {/* Full-bleed Photo */}
            <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
              <img
                src={currentPost.image_url}
                alt={currentPost.caption || 'Spotlight photo'}
                className="w-full h-full object-cover select-none"
              />

              {/* Cinematic Vignette Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

              {/* Spotlight Pill Badge (Top Left) */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-black uppercase tracking-wider text-white">
                <Sparkles size={12} className="text-[#ff007f]" />
                <span>Spotlight</span>
                <span className="text-zinc-400 font-bold ml-1">
                  {currentIndex + 1}/{posts.length}
                </span>
              </div>

              {/* 6. Post Actions UI: Stacked vertically on the right side */}
              <div className="absolute right-3 bottom-14 z-30 flex flex-col items-center gap-2.5">
                {/* ❤️ Like Action */}
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={handleLike}
                  title="Like Photo"
                  aria-label="Like Photo"
                  className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 hover:border-[#ff007f] flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg"
                >
                  <Heart
                    size={18}
                    className={likedPostIds.has(currentPost.id) ? 'fill-[#ff007f] text-[#ff007f]' : 'text-white'}
                  />
                  <span className="text-[7.5px] font-black text-white mt-0.5">Like</span>
                </motion.button>

                {/* 💬 Comment Action */}
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={openComments}
                  title="Comment"
                  aria-label="Comment"
                  className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 hover:border-[#0090ff] flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg"
                >
                  <MessageCircle size={18} className="text-white" />
                  <span className="text-[7.5px] font-black text-white mt-0.5">Chat</span>
                </motion.button>

                {/* 🔄 Repost Action */}
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={handleRepost}
                  title="Repost"
                  aria-label="Repost"
                  className={`w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg ${
                    repostedPostIds.has(currentPost.id)
                      ? 'border-[#00ff41] text-[#00ff41]'
                      : 'border-white/20 hover:border-[#00ff41] text-white'
                  }`}
                >
                  <Repeat size={18} />
                  <span className="text-[7.5px] font-black mt-0.5">Repost</span>
                </motion.button>

                {/* 💾 Save Action */}
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={handleSave}
                  title="Save Post"
                  aria-label="Save Post"
                  className={`w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg ${
                    savedPostIds.has(currentPost.id)
                      ? 'border-[#ffe600] text-[#ffe600]'
                      : 'border-white/20 hover:border-[#ffe600] text-white'
                  }`}
                >
                  <Bookmark
                    size={18}
                    className={savedPostIds.has(currentPost.id) ? 'fill-[#ffe600]' : ''}
                  />
                  <span className="text-[7.5px] font-black mt-0.5">Save</span>
                </motion.button>

                {/* 📤 Share Action */}
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={handleShare}
                  title="Share"
                  aria-label="Share"
                  className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 hover:border-white text-white flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg"
                >
                  <Share2 size={18} />
                  <span className="text-[7.5px] font-black mt-0.5">Share</span>
                </motion.button>

                {/* 📖 Task 1.1: Add to Tale (Opens Modal Overlay instead of instantly posting) */}
                <motion.button
                  whileTap={{ scale: 0.82 }}
                  onClick={handleOpenTaleModal}
                  title="Add to Tale with Music"
                  aria-label="Add to Tale with Music"
                  className={`w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg ${
                    taleAddedPostIds.has(currentPost.id) || userHasActiveTale
                      ? 'border-[#ec4899] text-[#ec4899] shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                      : 'border-white/20 hover:border-[#ec4899] text-white'
                  }`}
                >
                  <BookOpen size={18} />
                  <span className="text-[7.5px] font-black mt-0.5">Tale</span>
                </motion.button>
              </div>

              {/* Bottom Caption & Post Metadata */}
              <div className="absolute left-4 right-16 bottom-4 z-20 flex flex-col gap-1.5 pointer-events-auto">
                {currentPost.caption && (
                  <div className="bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 inline-block max-w-[270px]">
                    <p className="text-xs font-semibold text-white leading-relaxed m-0 drop-shadow">
                      {currentPost.caption}
                    </p>
                  </div>
                )}
                <span className="text-[10px] text-zinc-400 font-medium px-1">
                  {currentPost.created_at ? new Date(currentPost.created_at).toLocaleDateString() : 'Today'}
                </span>
              </div>

              {/* 5. Next / Skip floating navigation trigger */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.03 }}
                onClick={handleNext}
                className="absolute bottom-4 right-4 z-30 px-3.5 py-2 rounded-full bg-[#ff007f] text-white font-black text-xs shadow-[0_0_15px_rgba(255,0,127,0.5)] border-none cursor-pointer flex items-center gap-1 transition-all"
              >
                <span>Next</span>
                <ChevronDown size={14} />
              </motion.button>
            </div>

            {/* Comment Drawer / Overlay (Action b) */}
            <AnimatePresence>
              {showCommentModal && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                  className="absolute inset-x-0 bottom-0 top-1/3 bg-zinc-950/95 backdrop-blur-xl border-t-2 border-zinc-800 rounded-t-3xl z-40 p-4 flex flex-col gap-3 shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <MessageCircle size={16} className="text-[#0090ff]" />
                      <h4 className="text-xs font-black uppercase text-white m-0">Comments</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCommentModal(false)}
                      className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {/* Comment List */}
                  <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                    {isLoadingComments ? (
                      <div className="py-6 text-center text-xs text-zinc-500">Loading comments...</div>
                    ) : commentsList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-500">No comments yet. Say something!</div>
                    ) : (
                      commentsList.map((c, i) => (
                        <div key={c.id || i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200">
                          {c.content}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={handlePostComment} className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      disabled={isPostingComment}
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#0090ff]"
                    />
                    <button
                      type="submit"
                      disabled={isPostingComment || !commentText.trim()}
                      className={`p-2 rounded-xl font-bold text-xs flex items-center justify-center border-none cursor-pointer ${
                        isPostingComment || !commentText.trim()
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-[#0090ff] text-white hover:brightness-110'
                      }`}
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Task 1.5: Spotify Search & Add to Tale Modal Overlay */}
            <AnimatePresence>
              {showTaleModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
                  onClick={() => {
                    if (audioPreviewRef.current) audioPreviewRef.current.pause();
                    setShowTaleModal(false);
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white max-h-[85vh] overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1db954]/20 text-[#1db954] flex items-center justify-center">
                          <Music size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white m-0">Add Music to Tale</h3>
                          <span className="text-[10px] text-zinc-400">Powered by Spotify</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (audioPreviewRef.current) audioPreviewRef.current.pause();
                          setShowTaleModal(false);
                        }}
                        className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Thumbnail of currentPost.image_url */}
                    <div className="flex items-center gap-3 bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-black border border-zinc-700">
                        <img
                          src={currentPost.image_url}
                          alt="Tale preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-zinc-400 block">Selected Post</span>
                        <p className="text-xs font-semibold text-white truncate m-0">
                          {currentPost.caption || 'Spotlight photo'}
                        </p>
                      </div>
                    </div>

                    {/* Search Input & Search Music Button */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Search track (e.g. Starboy, Drake)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#1db954] box-border"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSearching || !searchQuery.trim()}
                        className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 border-none cursor-pointer transition-all ${
                          isSearching || !searchQuery.trim()
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-[#1db954] text-black hover:brightness-110 shadow-[0_0_12px_rgba(29,185,84,0.4)]'
                        }`}
                      >
                        {isSearching ? '...' : 'Search'}
                      </button>
                    </form>

                    {/* Search Results List */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-[140px] max-h-[220px] pr-1">
                      {isSearching ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
                          <div className="w-5 h-5 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin" />
                          <span>Searching Spotify...</span>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="py-8 text-center text-zinc-500 text-xs">
                          {searchQuery ? 'No tracks with audio preview found. Try another title!' : 'Type a song or artist name to search.'}
                        </div>
                      ) : (
                        searchResults.map((track) => {
                          const artistName = track.artists?.map(a => a.name).join(', ') || 'Artist';
                          const isPlayingThis = previewingTrackId === track.id;

                          return (
                            <div
                              key={track.id}
                              className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all"
                            >
                              {/* Play Preview button */}
                              <button
                                type="button"
                                onClick={() => toggleTrackPreview(track)}
                                title={isPlayingThis ? 'Pause Preview' : 'Play Preview'}
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border cursor-pointer transition-all ${
                                  isPlayingThis
                                    ? 'bg-[#1db954] text-black border-[#1db954]'
                                    : 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700'
                                }`}
                              >
                                {isPlayingThis ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                              </button>

                              {/* Track Name - Artist Name */}
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-white truncate block">
                                  {track.name}
                                </span>
                                <span className="text-[10px] text-zinc-400 truncate block">
                                  {artistName}
                                </span>
                              </div>

                              {/* Select Button */}
                              <button
                                type="button"
                                disabled={isPostingTale}
                                onClick={() => handleSelectTrack(track)}
                                className="px-3 py-1.5 rounded-full bg-[#1db954] text-black font-black text-xs hover:brightness-110 border-none cursor-pointer flex-shrink-0 transition-all shadow-sm"
                              >
                                Select
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer Alternative: Post without Music */}
                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={isPostingTale}
                        onClick={handlePostWithoutMusic}
                        className="text-[11px] font-bold text-zinc-400 hover:text-white bg-transparent border-none cursor-pointer transition-colors"
                      >
                        Skip & Post without Music
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (audioPreviewRef.current) audioPreviewRef.current.pause();
                          setShowTaleModal(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
