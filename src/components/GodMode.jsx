import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Upload, Image as ImageIcon, Send, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase as defaultSupabase } from '../supabase';

export default function GodMode({
  user: propUser,
  supabase: propSupabase
}) {
  const supabase = propSupabase || defaultSupabase;

  // Upload State
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Feed State
  const [posts, setPosts] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [votedPostIds, setVotedPostIds] = useState(new Set());

  // Helper to fetch user ID
  const getUserId = async () => {
    if (propUser?.id) return propUser.id;
    if (supabase?.auth) {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id || null;
    }
    return null;
  };

  // Fetch all posts ordered by created_at descending
  const fetchPosts = async () => {
    setIsLoadingFeed(true);
    try {
      const { data, error } = await supabase
        .from('photo_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching photo posts:', error);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  // Fetch initial posts on mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
      setUploadError('');
    }
  };

  // Handle Upload
  const handleUpload = async (e) => {
    e?.preventDefault();
    if (!file) {
      setUploadError('Please select an image to post.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const userId = await getUserId();
      if (!userId) {
        setUploadError('You must be signed in to upload.');
        setIsUploading(false);
        return;
      }

      // 1. Upload to 'post_images' storage bucket with unique filename (${user.id}-${Date.now()})
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from('post_images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        throw storageError;
      }

      // 2. Retrieve public URL
      const { data: urlData } = supabase.storage
        .from('post_images')
        .getPublicUrl(fileName);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) {
        throw new Error('Failed to retrieve public URL for uploaded image.');
      }

      // 3. Insert new record into photo_posts table (author_id, image_url, caption)
      const { error: insertError } = await supabase
        .from('photo_posts')
        .insert([{
          author_id: userId,
          image_url: publicUrl,
          caption: caption.trim()
        }]);

      if (insertError) {
        throw insertError;
      }

      // 4. Reset form & refresh feed automatically upon success
      setFile(null);
      setFilePreview(null);
      setCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);

      await fetchPosts();
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to upload photo post.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Vote / Like
  const handleVote = async (postId) => {
    if (!postId || votedPostIds.has(postId)) return;

    // Optimistic UI update
    setVotedPostIds(prev => new Set(prev).add(postId));

    try {
      const userId = await getUserId();
      if (!userId) return;

      const { error } = await supabase
        .from('photo_votes')
        .insert([{
          post_id: postId,
          voter_id: userId
        }]);

      if (error) {
        console.warn('Vote insert notification:', error.message);
      }
    } catch (err) {
      console.error('Failed to submit vote:', err);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col gap-6 text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#00ff41]" size={22} />
          <h1 className="text-xl font-black tracking-tight text-white">Photo Feed</h1>
        </div>
        <span className="text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
          📸 Campus Photos
        </span>
      </div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-black border-2 border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 box-border"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-300">
          <Upload size={16} className="text-[#00ff41]" />
          <span>Create a New Photo Post</span>
        </div>

        {uploadError && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-2.5 rounded-xl">
            <AlertCircle size={15} />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="flex items-center gap-2 text-xs text-[#00ff41] bg-[#00ff41]/10 border border-[#00ff41]/30 p-2.5 rounded-xl">
            <CheckCircle2 size={15} />
            <span>Photo posted successfully!</span>
          </div>
        )}

        {/* File Input and Preview */}
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
            id="godmode-file-upload"
          />

          {filePreview ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900 flex items-center justify-center">
              <img
                src={filePreview}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFilePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={isUploading}
                className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white text-xs px-2.5 py-1 rounded-full border border-zinc-700 cursor-pointer"
              >
                Change
              </button>
            </div>
          ) : (
            <label
              htmlFor="godmode-file-upload"
              className="w-full border-2 border-dashed border-zinc-700 hover:border-[#00ff41] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-zinc-950/50"
            >
              <ImageIcon size={28} className="text-zinc-500" />
              <span className="text-xs font-bold text-zinc-300">Click to choose an image</span>
              <span className="text-[10px] text-zinc-500">PNG, JPG, WEBP up to 10MB</span>
            </label>
          )}
        </div>

        {/* Caption Input */}
        <input
          type="text"
          placeholder="Write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={isUploading}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff41] transition-colors"
        />

        {/* Post Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={handleUpload}
          disabled={isUploading || !file}
          className={`w-full py-2.5 px-4 rounded-full font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border-none ${
            isUploading || !file
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-[#00ff41] text-black shadow-[0_0_15px_rgba(0,255,65,0.4)] hover:brightness-110'
          }`}
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Send size={14} />
              <span>Post Photo</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Feed Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-400">Recent Posts</h2>
          <button
            onClick={fetchPosts}
            disabled={isLoadingFeed}
            className="text-xs text-zinc-400 hover:text-white cursor-pointer bg-transparent border-none font-bold"
          >
            {isLoadingFeed ? 'Refreshing...' : 'Refresh 🔄'}
          </button>
        </div>

        {isLoadingFeed ? (
          <div className="w-full py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
            <div className="w-6 h-6 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">Loading photo feed...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="w-full bg-black border border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">📷</span>
            <p className="text-sm font-bold text-white">No photo posts yet</p>
            <p className="text-xs text-zinc-400 max-w-xs">
              Be the first to upload a photo and get votes from your campus classmates!
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const hasVoted = votedPostIds.has(post.id);
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-black border border-zinc-800 rounded-3xl overflow-hidden shadow-xl flex flex-col"
              >
                {/* Image */}
                <div className="w-full aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.caption || 'Campus photo'}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Caption & Actions */}
                <div className="p-4 flex flex-col gap-3">
                  {post.caption && (
                    <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                      {post.caption}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now'}
                    </span>

                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleVote(post.id)}
                      disabled={hasVoted}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        hasVoted
                          ? 'bg-[#ff007f]/20 text-[#ff007f] border-[#ff007f]/40 cursor-default'
                          : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:border-[#ff007f] hover:text-[#ff007f] cursor-pointer'
                      }`}
                    >
                      <Heart
                        size={14}
                        className={hasVoted ? 'fill-[#ff007f] text-[#ff007f]' : ''}
                      />
                      <span>{hasVoted ? 'Voted' : 'Vote / Like'}</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
