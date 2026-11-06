import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, MessageSquare, Sparkles, User, Search } from 'lucide-react';
import { supabase as defaultSupabase } from '../supabase';

export default function Inbox({
  user,
  supabase: propSupabase,
  API,
  acceptedFriends = [],
  initialChatUser = null
}) {
  const supabase = propSupabase || defaultSupabase;

  // Active chat state
  const [activeChatUser, setActiveChatUser] = useState(() => {
    if (initialChatUser) return initialChatUser;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('chatWith') || null;
    }
    return null;
  });

  const [activeChatProfile, setActiveChatProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Task 1: New State Variables (searchTerm, searchResults, chatHistory)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);

  // Sync with URL query parameter changes
  useEffect(() => {
    const handleUrlChatWith = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const chatWith = urlParams.get('chatWith');
        if (chatWith) {
          setActiveChatUser(chatWith);
        }
      }
    };

    handleUrlChatWith();
    window.addEventListener('popstate', handleUrlChatWith);
    window.addEventListener('campus-navigate', handleUrlChatWith);
    return () => {
      window.removeEventListener('popstate', handleUrlChatWith);
      window.removeEventListener('campus-navigate', handleUrlChatWith);
    };
  }, []);

  // Fetch active chat user profile details
  useEffect(() => {
    if (!activeChatUser || !supabase) {
      setActiveChatProfile(null);
      return;
    }

    // Check if user is in acceptedFriends first for instant render
    const friendMatch = acceptedFriends.find(
      (f) => f.id === activeChatUser || f.user_id === activeChatUser
    );
    if (friendMatch) {
      setActiveChatProfile({
        id: activeChatUser,
        handle: friendMatch.handle || friendMatch.name || 'Classmate',
        avatar: friendMatch.avatar || '😎',
        profile_pic_url: friendMatch.profile_pic || friendMatch.profile_pic_url || ''
      });
    }

    const fetchPartnerProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, handle, bio, profile_pic_url')
          .eq('id', activeChatUser)
          .single();

        if (!error && data) {
          setActiveChatProfile(data);
        }
      } catch (err) {
        console.warn('Failed to fetch partner profile:', err);
      }
    };

    fetchPartnerProfile();
  }, [activeChatUser, supabase]);

  // Task 1.2: Search Logic - handleSearch(term)
  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term || !term.trim()) {
      setSearchResults([]);
      return;
    }

    if (!supabase) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, handle, profile_pic_url, bio')
        .ilike('handle', `%${term}%`)
        .limit(10);

      if (!error && data) {
        // Exclude current logged in user from results
        const filtered = data.filter((u) => u.id !== user?.id);
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch Chat History (Previous direct message conversations)
  const fetchChatHistory = async () => {
    if (!user?.id || !supabase) return;
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const partnersMap = new Map();
        data.forEach((msg) => {
          const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          if (partnerId && !partnersMap.has(partnerId)) {
            partnersMap.set(partnerId, {
              partnerId,
              lastMessage: msg.content,
              lastCreatedAt: msg.created_at
            });
          }
        });

        const partnerIds = Array.from(partnersMap.keys());
        if (partnerIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, handle, profile_pic_url, bio')
            .in('id', partnerIds);

          const usersMap = {};
          (usersData || []).forEach((u) => {
            usersMap[u.id] = u;
          });

          const historyList = partnerIds.map((id) => {
            const meta = partnersMap.get(id);
            const userInfo = usersMap[id] || {};
            return {
              id,
              handle: userInfo.handle || 'Classmate',
              profile_pic_url: userInfo.profile_pic_url || '',
              bio: userInfo.bio || '',
              lastMessage: meta.lastMessage,
              lastCreatedAt: meta.lastCreatedAt
            };
          });

          setChatHistory(historyList);
        } else {
          setChatHistory([]);
        }
      }
    } catch (err) {
      console.warn('Error fetching chat history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!activeChatUser) {
      fetchChatHistory();
    }
  }, [activeChatUser, user?.id]);

  // Message Fetching: Fetch messages between current user and activeChatUser ordered by created_at ascending
  const fetchMessages = async () => {
    if (!user?.id || !activeChatUser || !supabase) return;
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${activeChatUser}),and(sender_id.eq.${activeChatUser},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      } else {
        // Fallback filter
        const { data: allDms, error: err2 } = await supabase
          .from('direct_messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (!err2 && allDms) {
          const filtered = allDms.filter(
            (m) =>
              (m.sender_id === user.id && m.receiver_id === activeChatUser) ||
              (m.sender_id === activeChatUser && m.receiver_id === user.id)
          );
          setMessages(filtered);
        }
      }
    } catch (err) {
      console.error('Failed to fetch direct messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // 2. Fetch messages & Realtime channel
  useEffect(() => {
    if (!activeChatUser) {
      setMessages([]);
      return;
    }

    fetchMessages();

    // Supabase real-time channel
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        (payload) => {
          const newMessage = payload.new;
          // Only add the message to state if it belongs to the current open chat
          if (
            (newMessage.sender_id === user?.id && newMessage.receiver_id === activeChatUser) ||
            (newMessage.sender_id === activeChatUser && newMessage.receiver_id === user?.id)
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeChatUser, supabase]);

  // Auto-scroll to bottom of messages container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Message Logic: optimistic local update + database insert
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const content = newMessage.trim();
    if (!content || !user?.id || !activeChatUser || !supabase) return;

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: optimisticId,
      sender_id: user.id,
      receiver_id: activeChatUser,
      content,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeChatUser,
          content
        })
        .select()
        .single();

      if (!error && data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? data : m))
        );
      }
    } catch (err) {
      console.error('Failed to send direct message:', err);
    }
  };

  // Helper for human-readable time format
  const formatMsgTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '';
    }
  };

  // Open Chat with a user
  const handleSelectUser = (partnerId) => {
    setActiveChatUser(partnerId);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/inbox?chatWith=${partnerId}`);
    }
  };

  // Return to Inbox view
  const handleBackToInbox = () => {
    setActiveChatUser(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/inbox');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-2 py-3 flex flex-col h-[calc(100vh-140px)] min-h-[520px]">
      {/* Glassmorphism Outer Container */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl h-[70vh] flex flex-col overflow-hidden shadow-2xl relative">
        {activeChatUser ? (
          /* ================= 4. CHAT VIEW (activeChatUser is set) ================= */
          <>
            {/* Chat View Header with 🔙 "Back to Inbox" Button */}
            <div className="p-3.5 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                {/* 🔙 Back to Inbox Button */}
                <button
                  type="button"
                  onClick={handleBackToInbox}
                  className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                  aria-label="Back to Inbox"
                >
                  <span>🔙</span>
                  <span>Back to Inbox</span>
                </button>

                <div className="relative">
                  <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-pink-500 to-cyan-400">
                    <div className="w-full h-full bg-black rounded-full overflow-hidden flex items-center justify-center">
                      {activeChatProfile?.profile_pic_url ? (
                        <img
                          src={activeChatProfile.profile_pic_url}
                          alt={activeChatProfile.handle || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-black text-white">
                          {activeChatProfile?.handle?.charAt(0).toUpperCase() || '💬'}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#00ff41] rounded-full border border-black shadow-[0_0_6px_#00ff41]" />
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-black text-white leading-tight">
                    @{activeChatProfile?.handle || 'Classmate'}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Direct Message
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] text-cyan-300 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                <Sparkles size={11} className="text-cyan-400" />
                <span>Encrypted</span>
              </div>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700">
              {isLoadingMessages ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
                  <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-2">
                    👋
                  </div>
                  <p className="text-xs font-bold text-zinc-300 m-0">No messages yet</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Send a message to break the ice!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSent = msg.sender_id === user?.id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sent Messages (Right) vs Received Messages (Left) */}
                      <div
                        className={
                          isSent
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-t-2xl rounded-bl-2xl px-4 py-2 ml-auto max-w-[75%] shadow-lg shadow-pink-500/15 break-words text-xs font-medium leading-relaxed'
                            : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-t-2xl rounded-br-2xl px-4 py-2 mr-auto max-w-[75%] shadow-md break-words text-xs font-medium leading-relaxed'
                        }
                      >
                        {msg.content}
                      </div>

                      <span className="text-[9.5px] text-zinc-500 font-medium mt-1 px-1">
                        {formatMsgTime(msg.created_at)}
                      </span>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input: sleek fixed bar at the bottom with a dark input field and a glowing neon send button */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a direct message..."
                className="flex-1 bg-zinc-900/90 border border-zinc-700/80 focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all shadow-inner"
              />

              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:brightness-110 active:scale-95 text-white p-2.5 rounded-xl shadow-[0_0_12px_rgba(236,72,153,0.5)] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>
          </>
        ) : (
          /* ================= 3. INBOX VIEW (activeChatUser is null) ================= */
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-cyan-400 p-[1.5px] flex items-center justify-center">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-sm">
                  💬
                </div>
              </div>
              <div>
                <h3 className="text-sm font-black text-white leading-tight">
                  Direct Messages
                </h3>
                <p className="text-[10px] text-zinc-400 font-medium">
                  Search classmates or continue a conversation
                </p>
              </div>
            </div>

            {/* 3. Sleek, glassmorphism search bar at the top */}
            <div className="mb-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users by handle..."
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-white w-full placeholder-gray-400 focus:border-cyan-500 outline-none transition-all text-xs"
              />
            </div>

            {/* Results / History Container */}
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-700 pr-0.5">
              {/* When user is actively searching */}
              {searchTerm.trim().length > 0 ? (
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 px-1">
                    Search Results ({searchResults.length})
                  </span>

                  {isSearching ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
                      <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Searching users...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-xs">
                      No users found matching "@{searchTerm}".
                    </div>
                  ) : (
                    /* 3. Below it, map through searchResults as clickable rows with hover effect */
                    <div className="space-y-1.5 mt-2">
                      {searchResults.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => handleSelectUser(u.id)}
                          className="hover:bg-white/10 p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 bg-white/5 border border-white/5"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 p-[1.5px] flex-shrink-0">
                              <div className="w-full h-full bg-black rounded-full overflow-hidden flex items-center justify-center">
                                {u.profile_pic_url ? (
                                  <img
                                    src={u.profile_pic_url}
                                    alt={u.handle}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xs font-black text-white">
                                    {u.handle?.charAt(0).toUpperCase() || '👤'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col overflow-hidden">
                              <span className="text-xs font-bold text-white truncate">
                                @{u.handle}
                              </span>
                              {u.bio && (
                                <span className="text-[10.5px] text-zinc-400 truncate max-w-[200px]">
                                  {u.bio}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Chat 💬
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* When searchTerm is empty: show Chat History (Previous chats) + Classmates */
                <div className="space-y-4">
                  {/* Chat History Section */}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-1">
                      Recent Chats ({chatHistory.length})
                    </span>

                    {isLoadingHistory ? (
                      <div className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
                        <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                        <span>Loading chats...</span>
                      </div>
                    ) : chatHistory.length === 0 ? (
                      <div className="py-5 text-center text-zinc-500 text-xs">
                        No previous chats yet. Search for a classmate above to start!
                      </div>
                    ) : (
                      <div className="space-y-1.5 mt-2">
                        {chatHistory.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => handleSelectUser(chat.id)}
                            className="hover:bg-white/10 p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 bg-zinc-900/60 border border-white/5"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 p-[1.5px] flex-shrink-0">
                                <div className="w-full h-full bg-black rounded-full overflow-hidden flex items-center justify-center">
                                  {chat.profile_pic_url ? (
                                    <img
                                      src={chat.profile_pic_url}
                                      alt={chat.handle}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-black text-white">
                                      {chat.handle?.charAt(0).toUpperCase() || '💬'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-black text-white truncate">
                                  @{chat.handle}
                                </span>
                                <span className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                                  {chat.lastMessage || 'Open chat'}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="text-[9.5px] text-zinc-500 font-medium">
                                {chat.lastCreatedAt ? formatMsgTime(chat.lastCreatedAt) : ''}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                Chat
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Friends & Classmates directory */}
                  {acceptedFriends.length > 0 && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-1">
                        Classmates & Friends ({acceptedFriends.length})
                      </span>
                      <div className="space-y-1.5 mt-2">
                        {acceptedFriends.map((f) => {
                          const friendId = f.id || f.user_id;
                          return (
                            <div
                              key={friendId}
                              onClick={() => handleSelectUser(friendId)}
                              className="hover:bg-white/10 p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                                  {f.profile_pic || f.profile_pic_url ? (
                                    <img
                                      src={f.profile_pic || f.profile_pic_url}
                                      alt={f.handle || f.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    f.avatar || '😎'
                                  )}
                                </div>
                                <span className="text-xs font-bold text-zinc-200">
                                  @{f.handle || f.name || 'Classmate'}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold hover:bg-cyan-500 hover:text-black transition-all cursor-pointer"
                              >
                                💬 Message
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
