import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Send, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase as defaultSupabase } from '../supabase';
import CustomPollSubmit from './CustomPollSubmit';

export default function Sidebar({
  isOpen,
  onClose,
  user,
  supabase: propSupabase,
  API,
  onPollCreated,
  onPhotoPosted
}) {
  const supabase = propSupabase || defaultSupabase;

  // Submenu tabs: 'photo' (Create a New Photo Post) or 'poll' (Add Poll)
  const [activeTab, setActiveTab] = useState('photo');

  // Photo Post Upload State
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Helper to fetch user ID via supabase.auth.getUser()
  const getUserId = async () => {
    if (user?.id) return user.id;
    if (supabase?.auth) {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id || null;
    }
    return null;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
      setUploadError('');
    }
  };

  const resetPhotoForm = () => {
    setFile(null);
    setFilePreview(null);
    setCaption('');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload Logic: Fetch user.id, upload to 'post_images' storage, get public URL, insert into photo_posts (author_id, image_url, caption)
  const handleUploadPhoto = async (e) => {
    e?.preventDefault();
    if (!file) {
      setUploadError('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      const userId = await getUserId();
      if (!userId) {
        setUploadError('You must be signed in to post photos.');
        setIsUploading(false);
        return;
      }

      // 1. Upload file to 'post_images' storage using unique filename
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
        throw new Error('Could not retrieve public URL for uploaded photo.');
      }

      // 3. Insert into photo_posts table (author_id, image_url, caption)
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

      setUploadSuccess(true);
      resetPhotoForm();

      // Dispatch event so GodMode Reels Feed can immediately reload
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('campus-photo-posted', { detail: { imageUrl: publicUrl } }));
      }

      if (onPhotoPosted) onPhotoPosted(publicUrl);

      setTimeout(() => {
        setUploadSuccess(false);
        if (onClose) onClose();
      }, 900);
    } catch (err) {
      console.error('Photo post upload failed:', err);
      setUploadError(err.message || 'Failed to post photo.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 box-border"
        style={{ zIndex: 1000 }}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-black border-2 border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto box-border text-white"
          style={{
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 255, 65, 0.15)'
          }}
        >
          {/* Header & Submenu Switcher */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-full border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer border-none ${
                  activeTab === 'photo'
                    ? 'bg-[#00ff41] text-black shadow-[0_0_10px_rgba(0,255,65,0.4)]'
                    : 'bg-transparent text-zinc-400 hover:text-white'
                }`}
              >
                📸 Photo Post
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('poll')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer border-none ${
                  activeTab === 'poll'
                    ? 'bg-[#00ff41] text-black shadow-[0_0_10px_rgba(0,255,65,0.4)]'
                    : 'bg-transparent text-zinc-400 hover:text-white'
                }`}
              >
                ✍️ Add Poll
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Submenu Tab 1: Create a New Photo Post */}
          {activeTab === 'photo' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#00ff41]" />
                <h3 className="text-base font-black text-white m-0">Create a New Photo Post</h3>
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
                  <span>Photo posted! Showing in Spotlight Feed...</span>
                </div>
              )}

              {/* File Input for Images (PNG, JPG, WEBP) */}
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                  id="sidebar-photo-input"
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
                      onClick={resetPhotoForm}
                      disabled={isUploading}
                      className="absolute top-2 right-2 bg-black/80 hover:bg-black text-white text-xs px-2.5 py-1 rounded-full border border-zinc-700 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="sidebar-photo-input"
                    className="w-full border-2 border-dashed border-zinc-700 hover:border-[#00ff41] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-zinc-950/60"
                  >
                    <ImageIcon size={28} className="text-zinc-500" />
                    <span className="text-xs font-bold text-zinc-300">Select Photo</span>
                    <span className="text-[10px] text-zinc-500">Supports PNG, JPG, WEBP</span>
                  </label>
                )}
              </div>

              {/* Caption Text Input */}
              <input
                type="text"
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isUploading}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff41] transition-colors"
              />

              {/* Post Photo Button with isUploading state */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={handleUploadPhoto}
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
                    <span>Posting Photo...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Post Photo</span>
                  </>
                )}
              </motion.button>
            </div>
          )}

          {/* Submenu Tab 2: Add New Poll */}
          {activeTab === 'poll' && (
            <div className="flex flex-col gap-3">
              <CustomPollSubmit
                user={user}
                API={API}
                supabase={supabase}
                onPollCreated={() => {
                  if (onPollCreated) onPollCreated();
                  if (onClose) onClose();
                }}
              />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

