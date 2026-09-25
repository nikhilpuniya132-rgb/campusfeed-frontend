import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AURA_RINGS = {
  none: { border: 'none', boxShadow: 'none' },
  gold: { border: '2px solid #d97706', boxShadow: 'none' },
  neonPurple: { border: '2px solid #7c3aed', boxShadow: 'none' },
  blueEnergy: { border: '2px dashed #2563eb', boxShadow: 'none' },
  crimsonFire: { border: '2px solid #dc2626', boxShadow: 'none' }
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
        const instParam = encodeURIComponent(currentUser?.institute || '');
        const res = await fetch(`${API}/friends/search?q=${encodeURIComponent(query.trim())}&userId=${currentUser?.id || ''}&institute=${instParam}`);
        if (res.ok) {
          const data = await res.json();
          const isolated = (data.users || []).filter(u => !currentUser?.institute || u.institute === currentUser.institute);
          setResults(isolated);
        } else {
          // Fallback to direct Supabase query with strict institute silo
          if (supabase) {
            const clean = query.trim().replace(/^@/, '');
            let queryBuilder = supabase
              .from('users')
              .select('id, handle, name, avatar, profile_pic, grade, ring, is_pro, institute')
              .ilike('handle', `%${clean}%`)
              .neq('id', currentUser?.id || '');

            if (currentUser?.institute) {
              queryBuilder = queryBuilder.eq('institute', currentUser.institute);
            }

            const { data: directUsers } = await queryBuilder.limit(20);
            setResults(directUsers || []);
          }
        }
      } catch (err) {
        console.error('Search error:', err);
        // Supabase direct fallback
        if (supabase) {
          try {
            const clean = query.trim().replace(/^@/, '');
            let queryBuilder = supabase
              .from('users')
              .select('id, handle, name, avatar, profile_pic, grade, ring, is_pro, institute')
              .ilike('handle', `%${clean}%`)
              .neq('id', currentUser?.id || '');

            if (currentUser?.institute) {
              queryBuilder = queryBuilder.eq('institute', currentUser.institute);
            }

            const { data: directUsers } = await queryBuilder.limit(20);
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

      if (onFriendAdded) onFriendAdded(targetUser);
    } catch (err) {
      console.error('Friend request error:', err);
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
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '24px',
        padding: '20px 16px',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <span style={{ fontSize: '22px' }}>👥</span>
        <div>
          <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#000000' }}>
            Find Classmates
          </h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
            Search by handle to build your coaching hub friend circle
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ position: 'absolute', left: '14px', fontSize: '15px', color: '#6b7280' }}>
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
            border: '1.5px solid #e5e7eb',
            background: '#f9fafb',
            color: '#000000',
            fontSize: '14px',
            fontWeight: '600',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#000000')}
          onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
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
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#6b7280', fontSize: '13px' }}>
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
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
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
                          background: '#e5e7eb',
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
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#000000' }}>
                          @{classmate.handle}
                        </span>
                        {classmate.is_pro && (
                          <span style={{ fontSize: '12px' }}>👑</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          Class {classmate.grade || '11'}
                        </span>
                        {classmate.name && (
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>
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
                          color: '#059669',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                        }}
                      >
                        Friends ✓
                      </span>
                    ) : isPending ? (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '800',
                          color: '#2563eb',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
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
                          background: '#000000',
                          color: '#ffffff',
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
                          background: '#000000',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
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
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#6b7280', fontSize: '13px' }}>
          No classmate found with "@{query.trim()}". Check spelling!
        </div>
      )}
    </div>
  );
}
