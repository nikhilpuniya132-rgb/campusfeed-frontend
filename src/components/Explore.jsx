import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '../useNavigate';
import SkeletonExplore from './SkeletonExplore';

const DEFAULT_TUITION_POLLS = [
  { id: 't1', question: "Always sleeps through 5 PM Physics?" },
  { id: 't2', question: "Most likely to crack NEET on the first attempt?" },
  { id: 't3', question: "Spends more time at the Maggi point than in class?" },
  { id: 't4', question: "Secretly solving HC Verma modules during school hours?" },
  { id: 't5', question: "Has pristine handwritten formula notes everyone begs for?" },
  { id: 't6', question: "Buys samosas & patties for the whole batch after minor tests?" }
];

export default function Explore({
  currentUser,
  API,
  supabase,
  renderProfilePic,
  onViewPublicProfile,
  onFriendAdded
}) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('trending'); // 'trending', 'legends', 'rank'
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestStatusMap, setRequestStatusMap] = useState({});

  // Content states
  const [legends, setLegends] = useState([]);
  const [isLoadingLegends, setIsLoadingLegends] = useState(true);
  const [trendingPolls, setTrendingPolls] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  // 1. Fetch Legends (God Mode users)
  useEffect(() => {
    const fetchLegends = async () => {
      setIsLoadingLegends(true);
      try {
        const res = await fetch(`${API}/explore/legends`);
        const data = await res.json();
        if (data.legends && data.legends.length > 0) {
          setLegends(data.legends);
        } else if (supabase) {
          const { data: dbLegends } = await supabase
            .from('users')
            .select('id, handle, name, avatar, profile_pic, ring, selected_ring, total_votes, is_pro, grade')
            .eq('is_pro', true)
            .order('total_votes', { ascending: false })
            .limit(20);
          setLegends(dbLegends || []);
        }
      } catch (err) {
        console.error('Failed to load legends:', err);
      } finally {
        setIsLoadingLegends(false);
      }
    };
    fetchLegends();
  }, [API, supabase]);

  // 2. Fetch Trending Questions
  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoadingTrending(true);
      try {
        const res = await fetch(`${API}/explore/trending`);
        const data = await res.json();
        if (data.trending && data.trending.length > 0) {
          setTrendingPolls(data.trending);
        } else {
          setTrendingPolls(DEFAULT_TUITION_POLLS);
        }
      } catch (err) {
        console.error('Failed to load trending polls:', err);
        setTrendingPolls(DEFAULT_TUITION_POLLS);
      } finally {
        setIsLoadingTrending(false);
      }
    };
    fetchTrending();
  }, [API]);

  // 3. Fetch School Leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoadingLeaderboard(true);
      try {
        const res = await fetch(`${API}/explore/leaderboard`);
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, [API]);

  // 4. Handle Friend Search
  useEffect(() => {
    const query = searchQuery.trim().replace(/^@/, '');
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayTimer = setTimeout(async () => {
      try {
        const url = `${API}/friends/search?q=${encodeURIComponent(query)}&userId=${currentUser?.id || ''}`;
        const res = await fetch(url);
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (err) {
        console.error('Friend search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(delayTimer);
  }, [searchQuery, API, currentUser?.id]);

  // 5. Send Friend Request
  const handleSendFriendRequest = async (targetUserId) => {
    if (!currentUser?.id || !targetUserId) return;
    setRequestStatusMap(prev => ({ ...prev, [targetUserId]: 'sending' }));

    try {
      const res = await fetch(`${API}/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, friendId: targetUserId })
      });
      const data = await res.json();
      if (data.success) {
        setRequestStatusMap(prev => ({
          ...prev,
          [targetUserId]: data.alreadyExisted ? 'accepted' : 'pending'
        }));
        if (onFriendAdded) onFriendAdded();
      } else {
        setRequestStatusMap(prev => ({ ...prev, [targetUserId]: 'error' }));
      }
    } catch (err) {
      console.error('Send friend request error:', err);
      setRequestStatusMap(prev => ({ ...prev, [targetUserId]: 'error' }));
    }
  };

  return (
    <div style={{ padding: '16px 16px 80px 16px', maxWidth: '440px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* 1. Header & Title */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff', margin: '0 0 4px 0' }}>
          Explore Bathinda Hubs
        </h2>
        <p style={{ fontSize: '12.5px', color: '#71717a', margin: 0 }}>
          Search students across coaching hubs, view trending polls, & discover batch leaders
        </p>
      </div>

      {/* 2. Search & Add (@handle) */}
      <div style={{ position: 'relative', marginBottom: '18px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#121214',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '0 14px',
          transition: 'border-color 0.2s ease'
        }}>
          <span style={{ fontSize: '15px', color: '#71717a', marginRight: '8px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search classmates by @handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '13px 0',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: '600'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        <AnimatePresence>
          {searchQuery.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '8px',
                background: '#121214',
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '8px',
                zIndex: 30,
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
                maxHeight: '260px',
                overflowY: 'auto'
              }}
            >
              {isSearching ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                  Searching Bathinda Hubs...
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                  No classmates found for "{searchQuery}"
                </div>
              ) : (
                searchResults.map(user => {
                  const status = requestStatusMap[user.id] || user.friendshipStatus;
                  return (
                    <div
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: '#18181b',
                        marginBottom: '6px'
                      }}
                    >
                      <div
                        onClick={() => onViewPublicProfile && onViewPublicProfile(user.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                      >
                        {renderProfilePic
                          ? renderProfilePic(user.profile_pic, user.avatar, user.is_pro, user.selected_ring || user.ring, 38)
                          : (
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {user.avatar || '😎'}
                            </div>
                          )}
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', display: 'block' }}>
                            @{user.handle}
                          </span>
                          <span style={{ fontSize: '11px', color: '#71717a' }}>
                            Class {user.grade || '11'}
                          </span>
                        </div>
                      </div>

                      {/* Request Action Button */}
                      <div>
                        {status === 'accepted' ? (
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '800', padding: '4px 8px' }}>
                            ✓ Friends
                          </span>
                        ) : status === 'pending' || status === 'sending' ? (
                          <span style={{ fontSize: '11px', color: '#eab308', fontWeight: '700', padding: '4px 8px' }}>
                            ⏳ Requested
                          </span>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleSendFriendRequest(user.id)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '10px',
                              border: 'none',
                              background: '#ffffff',
                              color: '#000000',
                              fontSize: '11.5px',
                              fontWeight: '900',
                              cursor: 'pointer'
                            }}
                          >
                            + Add
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. THE "LEGENDS" CARD (Exclusive Flat Minimalist God Mode Showcase) */}
      <div style={{
        background: 'linear-gradient(180deg, #18181b 0%, #121214 100%)',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        borderRadius: '20px',
        padding: '16px',
        marginBottom: '20px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>👑</span>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#fbbf24', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Legends
            </span>
          </div>
          <span style={{ fontSize: '10.5px', color: '#a1a1aa', background: '#27272a', padding: '3px 8px', borderRadius: '8px', fontWeight: '700' }}>
            God Mode Members
          </span>
        </div>

        {isLoadingLegends ? (
          <div style={{ padding: '12px 0', textAlign: 'center', color: '#71717a', fontSize: '12px' }}>
            Finding Bathinda Hub Legends...
          </div>
        ) : legends.length === 0 ? (
          <div style={{ padding: '12px 0', textAlign: 'center', color: '#71717a', fontSize: '12.5px' }}>
            No active God Mode subscribers yet. Upgrade to be featured as a Legend!
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
            {legends.map(legend => (
              <motion.div
                key={legend.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => onViewPublicProfile && onViewPublicProfile(legend.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '72px',
                  maxWidth: '78px',
                  cursor: 'pointer'
                }}
              >
                {renderProfilePic
                  ? renderProfilePic(legend.profile_pic, legend.avatar, true, legend.selected_ring || legend.ring || 'gold', 50)
                  : (
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '2px solid #fbbf24' }}>
                      {legend.avatar || '👑'}
                    </div>
                  )}
                <span style={{
                  fontSize: '11px',
                  fontWeight: '900',
                  color: '#fbbf24',
                  marginTop: '6px',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%'
                }}>
                  @{legend.handle}
                </span>
                <span style={{ fontSize: '10px', color: '#ff8800', fontWeight: '800' }}>
                  {legend.total_votes || 0} 🔥
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Batch Captains Spotlight Banner */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/captains')}
        style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(255, 85, 0, 0.08))',
          border: '1px solid rgba(251, 191, 36, 0.35)',
          borderRadius: '16px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>👑</span>
          <div>
            <div style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Batch Captains Leaderboard</span>
              <span style={{ background: '#fbbf24', color: '#000', fontSize: '9.5px', fontWeight: '900', padding: '1px 6px', borderRadius: '8px' }}>
                NEW
              </span>
            </div>
            <div style={{ color: '#a1a1aa', fontSize: '11px', marginTop: '1px' }}>
              Top inviters unlocking God Mode & secret votes
            </div>
          </div>
        </div>
        <span style={{ color: '#fbbf24', fontSize: '16px', fontWeight: '900' }}>➔</span>
      </motion.div>

      {/* 4. Section Tabs (Trending Questions vs School Leaderboard) */}
      <div style={{ display: 'flex', background: '#121214', padding: '4px', borderRadius: '14px', marginBottom: '18px', border: '1px solid #27272a' }}>
        <button
          onClick={() => setActiveSection('trending')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSection === 'trending' ? '#ffffff' : 'transparent',
            color: activeSection === 'trending' ? '#000000' : '#71717a',
            transition: 'all 0.15s ease'
          }}
        >
          🔥 Trending Questions
        </button>

        <button
          onClick={() => setActiveSection('rank')}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '10px',
            border: 'none',
            fontSize: '12.5px',
            fontWeight: '800',
            cursor: 'pointer',
            background: activeSection === 'rank' ? '#ffffff' : 'transparent',
            color: activeSection === 'rank' ? '#000000' : '#71717a',
            transition: 'all 0.15s ease'
          }}
        >
          🏆 Coaching Ranks
        </button>
      </div>

      {/* 5. TAB A: TRENDING QUESTIONS */}
      {activeSection === 'trending' && (
        <div>
          {isLoadingTrending ? (
            <SkeletonExplore />
          ) : trendingPolls.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#71717a', fontSize: '13px' }}>
              No polls active yet. Cast votes in the feed to create trends!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {trendingPolls.map((poll, idx) => (
                <div
                  key={poll.id || idx}
                  style={{
                    background: '#121214',
                    border: '1px solid #27272a',
                    borderRadius: '20px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#ff8800', background: 'rgba(255, 136, 0, 0.12)', padding: '3px 8px', borderRadius: '8px' }}>
                      #{idx + 1} Trending
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#ffffff', margin: '0 0 14px 0', lineHeight: '1.35' }}>
                    "{poll.question}"
                  </h3>

                  {/* Top 3 Students Showcase */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {poll.topStudents && poll.topStudents.slice(0, 3).map((student, rankIdx) => {
                      const medal = rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : '🥉';
                      return (
                        <div
                          key={student.id || rankIdx}
                          onClick={() => onViewPublicProfile && onViewPublicProfile(student.id)}
                          style={{
                            background: '#18181b',
                            border: '1px solid #27272a',
                            borderRadius: '14px',
                            padding: '10px 6px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ fontSize: '13px', marginBottom: '4px' }}>{medal}</span>
                          {renderProfilePic
                            ? renderProfilePic(student.profile_pic, student.avatar, student.is_pro, student.selected_ring || student.ring, 38)
                            : (
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {student.avatar || '😎'}
                              </div>
                            )}
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            color: student.is_pro ? '#fbbf24' : '#ffffff',
                            marginTop: '6px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%'
                          }}>
                            @{student.handle}
                          </span>
                          <span style={{ fontSize: '10px', color: '#ff8800', fontWeight: '700', marginTop: '2px' }}>
                            {student.votes || 0} votes
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB B: SCHOOL LEADERBOARD */}
      {activeSection === 'rank' && (
        <div>
          {isLoadingLeaderboard ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#71717a', fontSize: '13px' }}>
              Loading ranks...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {leaderboard.map((item, index) => (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onViewPublicProfile && onViewPublicProfile(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: '#121214',
                    border: '1px solid #27272a',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontWeight: '900', width: '28px', color: index < 3 ? '#fbbf24' : '#71717a', fontSize: '13px' }}>
                    #{index + 1}
                  </span>
                  {renderProfilePic
                    ? renderProfilePic(item.profile_pic, item.avatar, item.is_pro, item.selected_ring || item.ring, 36)
                    : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.avatar || '😎'}
                      </div>
                    )}
                  <div style={{ flex: 1, marginLeft: '12px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: item.is_pro ? '#fbbf24' : '#ffffff' }}>
                      @{item.handle}
                    </span>
                  </div>
                  <span style={{ color: '#ff8800', fontWeight: '900', fontSize: '13px' }}>
                    {item.total_votes || 0} 🔥
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
