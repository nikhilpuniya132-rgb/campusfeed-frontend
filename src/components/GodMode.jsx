import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Repeat,
  Share2,
  BookOpen,
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

  // 1. Classic Scrolling Feed State (no currentIndex, no Next/Skip button)
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Interaction feedback states
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const [repostedPostIds, setRepostedPostIds] = useState(new Set());
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [taleAddedPostIds, setTaleAddedPostIds] = useState(new Set());
  const [userHasActiveTale, setUserHasActiveTale] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Comment Modal State
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Task 1: Retain Spotify Search & Add to Tale Modal State
  const [activeTalePost, setActiveTalePost] = useState(null);
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

  // 2. Fetch Logic: Fetch photo_posts where is_archived = false ordered by created_at descending
  const fetchPhotoPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('photo_posts')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching photo posts:', error);
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
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('campus-photo-posted', handleNewPhoto);
      return () => window.removeEventListener('campus-photo-posted', handleNewPhoto);
    }
  }, []);

  // 4. Action Handlers: ❤️ Like (inserts into photo_votes)
  const handleLike = async (post) => {
    if (!post || likedPostIds.has(post.id)) return;

    setLikedPostIds(prev => new Set(prev).add(post.id));
    showToast('Liked post! ❤️');

    try {
      const userId = await getUserId();
      if (!userId || !supabase) return;

      const { error } = await supabase
        .from('photo_votes')
        .insert([{
          post_id: post.id,
          voter_id: userId
        }]);

      if (error) {
        console.warn('Like insert notification:', error.message);
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  // 💬 Comment: Open Drawer & fetch comments for specific post
  const openComments = async (post) => {
    if (!post) return;
    setActiveCommentPost(post);
    setIsLoadingComments(true);

    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', post.id)
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
    if (!commentText.trim() || !activeCommentPost) return;

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
        post_id: activeCommentPost.id,
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

  // 🔄 Repost: Inserts into reposts
  const handleRepost = async (post) => {
    if (!post || repostedPostIds.has(post.id)) return;

    setRepostedPostIds(prev => new Set(prev).add(post.id));
    showToast('Reposted! 🔄');

    try {
      const userId = await getUserId();
      if (!userId || !supabase) return;

      const { error } = await supabase
        .from('reposts')
        .insert([{
          post_id: post.id,
          user_id: userId
        }]);

      if (error) {
        console.warn('Repost notification:', error.message);
      }
    } catch (err) {
      console.error('Failed to repost:', err);
    }
  };

  // 💾 Save: Inserts into saved_posts with success toast
  const handleSave = async (post) => {
    if (!post || savedPostIds.has(post.id)) return;

    setSavedPostIds(prev => new Set(prev).add(post.id));
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
          post_id: post.id,
          user_id: userId
        }]);

      if (error) {
        console.warn('Save post notification:', error.message);
      }
    } catch (err) {
      console.error('Failed to save post:', err);
    }
  };

  // 📤 Share: Native share or clipboard copy
  const handleShare = async (post) => {
    if (!post) return;

    const shareUrl = post.image_url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareText = post.caption || 'Check out this post on CenterInsider!';

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

  // Task 1: Fix Spotify Search Filter (Remove strict filter, take top 10 results directly)
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
      // Remove the strict filter: Take top 10 results directly
      const topTracks = (data?.tracks?.items || []).slice(0, 10);
      setSearchResults(topTracks);
    } catch (err) {
      console.error('Spotify Search Error:', err);
      showToast('Spotify search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // 📖 Add to Tale: Opens Spotify search modal for specific post
  const handleOpenTaleModal = (post) => {
    if (!post) return;
    setActiveTalePost(post);
    setShowTaleModal(true);
    setSearchQuery('');
    setSearchResults([]);
    setPreviewingTrackId(null);
  };

  // Track Audio Preview toggle in search list
  const toggleTrackPreview = (track) => {
    if (!track.preview_url) return;
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

  // Task 1.3: Post Logic: When "Select" is clicked on a track
  const handleSelectTrack = async (track) => {
    if (!activeTalePost) return;
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

      // Insert into public.tales with author_id, image_url, audio_url (track.preview_url || 'NO_PREVIEW'), song_name
      const { error } = await supabase
        .from('tales')
        .insert([{
          author_id: userId,
          image_url: activeTalePost.image_url,
          audio_url: track.preview_url || 'NO_PREVIEW',
          song_name: track.name
        }]);

      if (error) {
        console.warn('Add to Tale insert warning:', error.message);
      }

      setTaleAddedPostIds(prev => new Set(prev).add(activeTalePost.id));
      setUserHasActiveTale(true);
      setShowTaleModal(false);
      showToast('Added to your Tale! 🎵');

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

  // Alternative: Post to Tale without soundtrack
  const handlePostWithoutMusic = async () => {
    if (!activeTalePost) return;
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
          image_url: activeTalePost.image_url
        }]);

      if (error) {
        console.warn('Add to Tale insert warning:', error.message);
      }

      setTaleAddedPostIds(prev => new Set(prev).add(activeTalePost.id));
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
    <div className="w-full max-w-lg mx-auto pb-24 px-3 flex flex-col items-center select-none text-white box-border gap-5">
      {/* 2. TalesBar Rendered at the Very Top */}
      <div className="w-full flex-shrink-0">
        <TalesBar
          user={propUser}
          supabase={supabase}
          userHasActiveTale={userHasActiveTale}
        />
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 z-50 bg-[#00ff41] text-black font-black text-xs px-4 py-2 rounded-full shadow-[0_0_20px_rgba(0,255,65,0.7)] flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading ? (
        <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#ff007f] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-zinc-400">Loading campus posts...</span>
        </div>
      ) : posts.length === 0 ? (
        /* Empty Feed State */
        <div className="w-full py-16 text-center flex flex-col items-center justify-center gap-3 border border-zinc-800 rounded-3xl bg-zinc-950/70 p-8 shadow-[0_0_20px_rgba(255,0,127,0.1)]">
          <div className="text-4xl">📸</div>
          <h3 className="text-lg font-black text-white m-0">No posts yet</h3>
          <p className="text-xs text-zinc-400 max-w-xs m-0">
            Be the first to share a photo! Tap the "+" button on top to create a spotlight post.
          </p>
        </div>
      ) : (
        /* Vertical Scrolling Column of Post Cards with Neon Glow */
        <div className="w-full flex flex-col gap-6">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full bg-zinc-950/90 border border-zinc-800/80 rounded-2xl md:rounded-3xl shadow-[0_0_22px_rgba(255,0,127,0.16)] hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#ff007f] to-[#00f0ff] p-[1.5px] flex items-center justify-center">
                    <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                      <Sparkles size={12} className="text-[#00f0ff]" />
                    </div>
                  </div>
                  <span className="text-xs font-black text-white tracking-wide">
                    Spotlight Post
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Today'}
                </span>
              </div>

              {/* 3. Image with Aspect-[4/5] & Constrained Max-Width */}
              <div className="relative w-full aspect-[4/5] bg-zinc-900 overflow-hidden flex items-center justify-center">
                <img
                  src={post.image_url}
                  alt={post.caption || 'Campus photo'}
                  className="w-full h-full object-cover select-none"
                  loading="lazy"
                />
              </div>

              {/* 4. Action Bar (Horizontal Row Directly Below the Image - Classic Instagram Style) */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800/50">
                {/* Left Action Buttons: Like, Comment, Repost, Share */}
                <div className="flex items-center gap-4">
                  {/* ❤️ Like */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => handleLike(post)}
                    title="Like"
                    aria-label="Like"
                    className="cursor-pointer bg-transparent border-none p-0 flex items-center transition-transform"
                  >
                    <Heart
                      size={22}
                      className={
                        likedPostIds.has(post.id)
                          ? 'fill-[#ff007f] text-[#ff007f] drop-shadow-[0_0_8px_rgba(255,0,127,0.8)]'
                          : 'text-zinc-300 hover:text-[#ff007f] transition-colors'
                      }
                    />
                  </motion.button>

                  {/* 💬 Comment */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => openComments(post)}
                    title="Comment"
                    aria-label="Comment"
                    className="cursor-pointer bg-transparent border-none p-0 flex items-center text-zinc-300 hover:text-[#0090ff] transition-colors"
                  >
                    <MessageCircle size={22} />
                  </motion.button>

                  {/* 🔄 Repost */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => handleRepost(post)}
                    title="Repost"
                    aria-label="Repost"
                    className={`cursor-pointer bg-transparent border-none p-0 flex items-center transition-colors ${
                      repostedPostIds.has(post.id)
                        ? 'text-[#00ff41] drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]'
                        : 'text-zinc-300 hover:text-[#00ff41]'
                    }`}
                  >
                    <Repeat size={22} />
                  </motion.button>

                  {/* 📤 Share */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => handleShare(post)}
                    title="Share"
                    aria-label="Share"
                    className="cursor-pointer bg-transparent border-none p-0 flex items-center text-zinc-300 hover:text-white transition-colors"
                  >
                    <Share2 size={21} />
                  </motion.button>
                </div>

                {/* Right Action Buttons: 📖 Add to Tale (with Spotify) & 💾 Save */}
                <div className="flex items-center gap-3">
                  {/* 📖 Add to Tale with Spotify */}
                  <motion.button
                    whileTap={{ scale: 0.82 }}
                    onClick={() => handleOpenTaleModal(post)}
                    title="Add to Tale with Spotify Music"
                    aria-label="Add to Tale with Spotify Music"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border cursor-pointer transition-all ${
                      taleAddedPostIds.has(post.id)
                        ? 'bg-[#ec4899]/20 border-[#ec4899] text-[#ec4899] shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                        : 'bg-zinc-900 border-zinc-700 hover:border-[#ec4899] text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Music size={14} className="text-[#1db954]" />
                    <span>Tale</span>
                  </motion.button>

                  {/* 💾 Save */}
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => handleSave(post)}
                    title="Save Post"
                    aria-label="Save Post"
                    className="cursor-pointer bg-transparent border-none p-0 flex items-center text-zinc-300 hover:text-[#ffe600] transition-colors"
                  >
                    <Bookmark
                      size={22}
                      className={
                        savedPostIds.has(post.id)
                          ? 'fill-[#ffe600] text-[#ffe600] drop-shadow-[0_0_8px_rgba(255,230,0,0.8)]'
                          : ''
                      }
                    />
                  </motion.button>
                </div>
              </div>

              {/* Caption Rendered Below the Image & Action Bar */}
              {post.caption && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-xs md:text-sm text-zinc-200 leading-relaxed m-0 font-medium">
                    {post.caption}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Comment Drawer / Modal */}
      <AnimatePresence>
        {activeCommentPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={() => setActiveCommentPost(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-950 border-t md:border border-zinc-800 rounded-t-3xl md:rounded-3xl p-4 flex flex-col gap-3 shadow-2xl max-h-[75vh]"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-[#0090ff]" />
                  <h4 className="text-xs font-black uppercase text-white m-0">Comments</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCommentPost(null)}
                  className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Comment List */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 min-h-[160px] max-h-[280px]">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task 1: Spotify Search & Add to Tale Modal Overlay (Top 10 tracks direct selection) */}
      <AnimatePresence>
        {showTaleModal && activeTalePost && (
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

              {/* Thumbnail of activeTalePost.image_url */}
              <div className="flex items-center gap-3 bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-black border border-zinc-700">
                  <img
                    src={activeTalePost.image_url}
                    alt="Tale preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-zinc-400 block">Selected Post</span>
                  <p className="text-xs font-semibold text-white truncate m-0">
                    {activeTalePost.caption || 'Spotlight photo'}
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

              {/* Search Results List (Top 10 results direct) */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-[140px] max-h-[220px] pr-1">
                {isSearching ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
                    <div className="w-5 h-5 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin" />
                    <span>Searching Spotify...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-xs">
                    {searchQuery ? 'No results found. Try another title or artist!' : 'Type a song or artist name to search.'}
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
                        {/* Play Preview button if available, or Spotify music icon */}
                        {track.preview_url ? (
                          <button
                            type="button"
                            onClick={() => toggleTrackPreview(track)}
                            title={isPlayingThis ? 'Pause Preview' : 'Play 30s Preview'}
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border cursor-pointer transition-all ${
                              isPlayingThis
                                ? 'bg-[#1db954] text-black border-[#1db954]'
                                : 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700'
                            }`}
                          >
                            {isPlayingThis ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                          </button>
                        ) : (
                          <div
                            title="Full track on Spotify"
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-zinc-800 text-[#1db954] border border-zinc-700/80"
                          >
                            <Music size={13} />
                          </div>
                        )}

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

              {/* Footer: Alternative Post without Music */}
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
    </div>
  );
}
