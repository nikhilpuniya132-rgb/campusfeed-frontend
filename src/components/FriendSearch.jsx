import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const AURA_RINGS = {
  none: { border: 'none', boxShadow: 'none' },
  gold: { border: '3px solid #fbbf24', boxShadow: '0 0 15px rgba(251, 191, 36, 0.6)' },
  neonPurple: { border: '3px solid #d946ef', boxShadow: '0 0 15px #d946ef' },
  blueEnergy: { border: '3px dashed #00f0ff', boxShadow: '0 0 15px rgba(0, 240, 255, 0.7)' },
  crimsonFire: { border: '3px double #ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.7)' }
};

export default function FriendSearch({ currentUser, API, supabase, onFriendAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [requestedMap, setRequestedMap] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch user's existing friends / requests on mount
  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchFriends = async () => {
      try {
        const res = await fetch(`${API}/friends/${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          const map = {};
          (data.friendships || []).forEach(f => {
            const otherId = f.requester_id === currentUser.id ? f.receiver_id : f.requester_id;
            map[otherId] = f.status || 'pending';
          });
          setRequestedMap(map);
        }
      } catch (err) {
        console.warn('Could not fetch friends list:', err);
      }
    };
    fetchFriends();
  }, [currentUser?.id, API]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`${API}/friends/search?q=${encodeURIComponent(query.trim())}&userId=${currentUser?.id || ''}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.users || []);
        } else {
          // Fallback to direct Supabase query
          if (supabase) {
            const clean = query.trim().replace(/^@/, '');
            const { data: directUsers } = await supabase
              .from('users')
              .select('id, handle, name, avatar, profile_pic, grade, ring, is_pro')
              .ilike('handle', `%${clean}%`)
              .neq('id', currentUser?.id || '')
              .limit(20);
            setResults(directUsers || []);
          }
        }
      } catch (err) {
        console.error('Search error:', err);
        // Supabase direct fallback
        if (supabase) {
          try {
            const clean = query.trim().replace(/^@/, '');
            const { data: directUsers } = await supabase
              .from('users')
              .select('id, handle, name, avatar, profile_pic, grade, ring, is_pro')
              .ilike('handle', `%${clean}%`)
              .neq('id', currentUser?.id || '')
              .limit(20);
            setResults(directUsers || []);
          } catch (e) {
            setErrorMsg('Unable to search classmates. Check connection.');
          }
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUser?.id, API, supabase]);

  const sendFriendRequest = async (targetUser) => {
    if (!currentUser?.id) return;
    const targetId = targetUser.id;

    // Optimistic update
    setRequestedMap(prev => ({ ...prev, [targetId]: 'pending' }));

    try {
      const res = await fetch(`${API}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          friendId: targetId
        })
      });

      if (!res.ok) {
        // Fallback to Supabase direct insert
        if (supabase) {
          await supabase.from('friendships').insert([
            { requester_id: currentUser.id, receiver_id: targetId, status: 'pending' }
          ]);
        }
      }

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00f0ff', '#3b82f6', '#10b981']
      });

      if (onFriendAdded) onFriendAdded(targetUser);
    } catch (err) {
      console.error('Friend request error:', err);
      // Still maintain optimistic pending if direct insert worked
      if (supabase) {
        try {
          await supabase.from('friendships').insert([
            { requester_id: currentUser.id, receiver_id: targetId, status: 'pending' }
          ]);
        } catch (e) {
          setRequestedMap(prev => {
            const next = { ...prev };
            delete next[targetId];
            return next;
          });
          setErrorMsg('Failed to send friend request');
        }
      }
    }
  };

  return (
    <div
      style={{
        background: 'rgba(24, 25, 38, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '20px 16px',
        backdropFilter: 'blur(18px)',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '22px' }}>👥</span>
        <div>
          <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#fff' }}>
            Find Classmates
          </h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            Search by handle to build your coaching hub friend circle
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ position: 'absolute', left: '14px', fontSize: '15px', color: '#94a3b8' }}>
          🔍
        </span>
        <input
          type="text"
          placeholder="Search @handle across Bathinda hubs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 38px 12px 40px',
            borderRadius: '16px',
            border: '1.5px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(0, 0, 0, 0.45)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#ff5500')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: '13px' }}>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{ display: 'inline-block', marginRight: '6px' }}
          >
            ⚡
          </motion.span>
          Searching campus directory...
        </div>
      )}

      {errorMsg && (
        <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 10px 0', textAlign: 'center' }}>
          {errorMsg}
        </p>
      )}

      {/* Results List */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '260px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {results.map((classmate) => {
              const status = requestedMap[classmate.id] || classmate.friendshipStatus || 'none';
              const isPending = status === 'pending';
              const isAccepted = status === 'accepted';
              const isIncoming = status === 'incoming';
              const aura = classmate.is_pro ? (AURA_RINGS[classmate.ring] || AURA_RINGS.gold) : AURA_RINGS.none;

              return (
                <div
                  key={classmate.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {classmate.profile_pic ? (
                      <img
                        src={classmate.profile_pic}
                        alt="avatar"
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          ...aura,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          ...aura,
                        }}
                      >
                        {classmate.avatar || '😎'}
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                          @{classmate.handle}
                        </span>
                        {classmate.is_pro && (
                          <span style={{ fontSize: '12px', filter: 'drop-shadow(0 0 4px #fbbf24)' }}>👑</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: 'rgba(255, 85, 0, 0.2)',
                            color: '#ff8800',
                          }}
                        >
                          Class {classmate.grade || '11'}
                        </span>
                        {classmate.name && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {classmate.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {isAccepted ? (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          color: '#10b981',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        Friends ✓
                      </span>
                    ) : isPending ? (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          color: '#00f0ff',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          background: 'rgba(0, 240, 255, 0.12)',
                          border: '1px solid rgba(0, 240, 255, 0.3)',
                        }}
                      >
                        Requested ⏳
                      </span>
                    ) : isIncoming ? (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => sendFriendRequest(classmate)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                        }}
                      >
                        Accept ➔
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => sendFriendRequest(classmate)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #ff5500, #ff8800)',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(255, 85, 0, 0.35)',
                        }}
                      >
                        + Add Friend
                      </motion.button>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {query.trim() && !isLoading && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: '13px' }}>
          No classmate found with "@{query.trim()}". Check spelling!
        </div>
      )}
    </div>
  );
}
