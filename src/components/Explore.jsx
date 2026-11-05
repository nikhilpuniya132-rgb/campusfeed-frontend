import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Send, User, RefreshCw } from 'lucide-react';
import { supabase as defaultSupabase } from '../supabase';

export default function Explore({
  currentUser,
  user: propUser,
  supabase: propSupabase
}) {
  const supabase = propSupabase || defaultSupabase;
  const activeUser = currentUser || propUser;

  // 1. Initialize State: profiles (array), currentIndex (number, default 0), messageText (string), and isLoading (boolean)
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingDm, setIsSendingDm] = useState(false);
  const [dmStatus, setDmStatus] = useState('');

  // Helper to retrieve current authenticated user ID
  const getUserId = async () => {
    if (activeUser?.id) return activeUser.id;
    if (supabase?.auth) {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id || null;
    }
    return null;
  };

  // 2. Fetch Logic: Call RPC function get_unswiped_users({ current_user_id: user.id }) and set result to profiles
  const fetchUnswipedUsers = async () => {
    setIsLoading(true);
    try {
      const userId = await getUserId();
      if (!userId || !supabase) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_unswiped_users', {
        current_user_id: userId
      });

      if (error) {
        console.error('Error calling get_unswiped_users RPC:', error);
      } else {
        setProfiles(data || []);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Failed to fetch unswiped users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnswipedUsers();
  }, [activeUser?.id]);

  const currentProfile = profiles[currentIndex] || null;

  // 4. Swipe Logic: Skip and Like buttons, insert record into swipes table, advance currentIndex by 1
  const handleSwipe = async (action) => {
    if (!currentProfile) return;

    const swipedOnId = currentProfile.id;
    const userId = await getUserId();

    // Advance currentIndex by 1
    setCurrentIndex(prev => prev + 1);
    setMessageText('');
    setDmStatus('');

    // Insert into swipes table ({ swiper_id, swiped_on_id, action })
    if (supabase && userId && swipedOnId) {
      try {
        const { error } = await supabase.from('swipes').insert([{
          swiper_id: userId,
          swiped_on_id: swipedOnId,
          action // 'like' or 'skip'
        }]);

        if (error) {
          console.warn('Swipe record notification:', error.message);
        }
      } catch (err) {
        console.error('Failed to record swipe:', err);
      }
    }
  };

  // 5. DM Logic: Insert into messages table ({ sender_id, receiver_id, content: messageText }) and clear input
  const handleSendDm = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !currentProfile) return;

    setIsSendingDm(true);
    setDmStatus('');

    try {
      const userId = await getUserId();
      if (!userId || !supabase) {
        setDmStatus('Must be signed in to send DMs');
        setIsSendingDm(false);
        return;
      }

      const contentToSend = messageText.trim();

      const { error } = await supabase.from('messages').insert([{
        sender_id: userId,
        receiver_id: currentProfile.id,
        content: contentToSend
      }]);

      if (error) {
        throw error;
      }

      // Clear input field on success
      setMessageText('');
      setDmStatus('Message sent!');
      setTimeout(() => setDmStatus(''), 3000);
    } catch (err) {
      console.error('Failed to send DM:', err);
      setDmStatus('Failed to send message');
    } finally {
      setIsSendingDm(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col justify-center min-h-[560px] text-white">
      {/* 3. UI Rendering */}
      {isLoading ? (
        /* Loading Indicator */
        <div className="w-full bg-black border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#00ff41] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-zinc-400">Finding campus profiles...</span>
        </div>
      ) : currentIndex >= profiles.length || !currentProfile ? (
        /* No more profiles state */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-black border-2 border-zinc-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4 shadow-2xl"
        >
          <div className="text-4xl">✨</div>
          <h2 className="text-lg font-black text-white">No more profiles to swipe</h2>
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
            You have viewed all matching student profiles for now. Check back soon for new classmates!
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fetchUnswipedUsers}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#00ff41] text-black font-black text-xs hover:brightness-110 cursor-pointer border-none shadow-[0_0_15px_rgba(0,255,65,0.4)]"
          >
            <RefreshCw size={14} />
            <span>Check Again</span>
          </motion.button>
        </motion.div>
      ) : (
        /* Card for profiles[currentIndex] showing profile_pic_url, handle, and bio */
        <AnimatePresence mode="wait">
          <motion.div
            key={currentProfile.id}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-black border-2 border-zinc-800 rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col box-border"
            style={{
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 10px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Profile Picture */}
            <div className="relative w-full aspect-square bg-zinc-950 flex items-center justify-center overflow-hidden">
              {currentProfile.profile_pic_url ? (
                <img
                  src={currentProfile.profile_pic_url}
                  alt={currentProfile.handle || 'Profile'}
                  className="w-full h-full object-cover select-none"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 gap-2">
                  <User size={64} strokeWidth={1.5} />
                  <span className="text-xs font-semibold text-zinc-500">No photo uploaded</span>
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

              {/* Handle Tag */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight drop-shadow-md">
                    @{currentProfile.handle || 'anonymous'}
                  </h3>
                </div>
              </div>
            </div>

            {/* Bio & Details */}
            <div className="p-4 flex flex-col gap-4">
              <div className="min-h-[44px]">
                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  {currentProfile.bio || 'No bio written yet.'}
                </p>
              </div>

              {/* DM Section: Text input and Send DM button */}
              <form onSubmit={handleSendDm} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Send a direct message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={isSendingDm}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff41] transition-colors"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isSendingDm || !messageText.trim()}
                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 border-none cursor-pointer transition-all ${
                      isSendingDm || !messageText.trim()
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-zinc-200'
                    }`}
                  >
                    <Send size={12} />
                    <span>Send</span>
                  </motion.button>
                </div>
                {dmStatus && (
                  <span className="text-[10px] text-[#00ff41] font-semibold px-1">
                    {dmStatus}
                  </span>
                )}
              </form>

              {/* Swipe Action Buttons: Skip and Like */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-800/80">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleSwipe('skip')}
                  className="py-3 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <X size={16} className="text-zinc-400" />
                  <span>Skip</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleSwipe('like')}
                  className="py-3 rounded-2xl bg-[#00ff41] text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,255,65,0.4)] hover:brightness-110 transition-all border-none"
                >
                  <Heart size={16} className="fill-black text-black" />
                  <span>Like</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
