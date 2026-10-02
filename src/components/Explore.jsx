import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '../useNavigate';
import ReferralInviteSnippet from './ReferralInviteSnippet';

export default function Explore({
  currentUser,
  API,
  supabase,
  renderProfilePic,
  onViewPublicProfile,
  onFriendAdded
}) {
  const navigate = useNavigate();

  // Collapsible accordion state: defaults to 'premium' open or null
  const [openAccordion, setOpenAccordion] = useState('premium');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestStatusMap, setRequestStatusMap] = useState({});

  // Leaderboard data states
  const [legends, setLegends] = useState([]);
  const [isLoadingLegends, setIsLoadingLegends] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  // Toggle helper for accordions
  const toggleAccordion = (id) => {
    setOpenAccordion(prev => (prev === id ? null : id));
  };

  // 1. Fetch Legends (Batch Captains) strictly isolated to user's institute
  useEffect(() => {
    const fetchLegends = async () => {
      setIsLoadingLegends(true);
      try {
        const instParam = encodeURIComponent(currentUser?.institute || '');
        const res = await fetch(`${API}/explore/legends?institute=${instParam}`);
        const data = await res.json();
        if (data.legends && data.legends.length > 0) {
          const verified = data.legends
            .filter(u => !currentUser?.institute || u.institute === currentUser.institute)
            .filter(u => ((u.invites || u.recruits || 0) >= 25 || u.batch_captain_admin_override));
          setLegends(verified);
        } else if (supabase) {
          let query = supabase
            .from('users')
            .select('id, handle, name, avatar, profile_pic, ring, selected_ring, total_votes, is_pro, grade, stream, institute, invites, is_batch_captain, batch_captain_admin_override');

          if (currentUser?.institute) {
            query = query.eq('institute', currentUser.institute);
          }

          const { data: dbLegends } = await query
            .gte('invites', 25)
            .order('invites', { ascending: false })
            .limit(30);

          const filtered = (dbLegends || [])
            .filter(u => !currentUser?.institute || u.institute === currentUser.institute)
            .filter(u => ((u.invites || u.recruits || 0) >= 25 || u.batch_captain_admin_override));
          setLegends(filtered);
        }
      } catch (err) {
        console.error('Failed to load legends:', err);
      } finally {
        setIsLoadingLegends(false);
      }
    };
    fetchLegends();
  }, [API, supabase, currentUser?.institute]);

  // 2. Fetch Leaderboard strictly isolated to user's institute
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoadingLeaderboard(true);
      try {
        const instParam = encodeURIComponent(currentUser?.institute || '');
        const res = await fetch(`${API}/explore/leaderboard?institute=${instParam}`);
        const data = await res.json();
        if (data.leaderboard && data.leaderboard.length > 0) {
          const instituteFiltered = data.leaderboard.filter(u => !currentUser?.institute || u.institute === currentUser.institute);
          setLeaderboard(instituteFiltered);
        } else if (supabase) {
          let query = supabase
            .from('users')
            .select('id, handle, name, avatar, profile_pic, ring, selected_ring, total_votes, is_pro, grade, stream, institute, coaching_hub, invites, is_batch_captain');

          if (currentUser?.institute) {
            query = query.eq('institute', currentUser.institute);
          }

          const { data: dbUsers } = await query
            .order('total_votes', { ascending: false })
            .limit(100);

          const sanitized = (dbUsers || [])
            .filter(u => !currentUser?.institute || u.institute === currentUser.institute)
            .map(u => ({
              ...u,
              institute: u.institute || currentUser?.institute || 'Kapil Institute',
              stream: u.stream || (u.grade === 12 ? '12th Board' : '11th Medical'),
              grade: u.grade || 11,
              coaching_hub: u.coaching_hub || 'Ajit Road Hub'
            }));
          setLeaderboard(sanitized);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, [API, supabase, currentUser?.institute]);

  // 3. Handle Friend Search
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
        const instParam = encodeURIComponent(currentUser?.institute || '');
        const url = `${API}/friends/search?q=${encodeURIComponent(query)}&userId=${currentUser?.id || ''}&institute=${instParam}`;
        const res = await fetch(url);
        const data = await res.json();
        const isolatedUsers = (data.users || []).filter(u => !currentUser?.institute || u.institute === currentUser.institute);
        setSearchResults(isolatedUsers);
      } catch (err) {
        console.error('Friend search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(delayTimer);
  }, [searchQuery, API, currentUser?.id, currentUser?.institute]);

  // 4. Send Friend Request
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

  // 5. Strict Class Rank Filtering by Institute AND Class/Stream
  const currentUserInstitute = (currentUser?.institute || 'Kapil Institute').trim();
  const currentUserStream = (currentUser?.stream || (currentUser?.grade === 12 ? '12th Board' : '11th Medical')).trim();
  const currentUserGrade = (currentUser?.grade || 11).toString();

  const classLeaderboard = leaderboard.filter(student => {
    const sInst = (student.institute || 'Kapil Institute').trim().toLowerCase();
    const myInst = currentUserInstitute.toLowerCase();

    // Strict filter: User institute MUST match
    const instituteMatches = sInst === myInst || sInst.includes(myInst) || myInst.includes(sInst);
    if (!instituteMatches) return false;

    // Strict filter: Class / Stream MUST match
    const sStream = (student.stream || '').trim().toLowerCase();
    const myStream = currentUserStream.toLowerCase();
    const sGrade = (student.grade || '').toString();

    const isMedical = myStream.includes('med') && !myStream.includes('non');
    const isNonMed = myStream.includes('non');
    const isBoard = myStream.includes('12') || myStream.includes('board') || currentUserGrade === '12';
    const isDropper = myStream.includes('drop') || currentUserGrade.includes('drop');

    if (isMedical) return sStream.includes('med') && !sStream.includes('non');
    if (isNonMed) return sStream.includes('non');
    if (isBoard) return sStream.includes('12') || sGrade === '12';
    if (isDropper) return sStream.includes('drop') || sGrade.includes('drop');

    return sStream === myStream || sGrade === currentUserGrade;
  });

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0 85px 0',
        boxSizing: 'border-box',
        background: '#ffffff'
      }}
    >
      {/* 80% SCREEN FOCUS CONTAINER (80/20 Rule: 80% content focus, 20% clean margins) */}
      <div
        style={{
          width: '80%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          boxSizing: 'border-box'
        }}
      >
        {/* 1. Header (Gen-Z Aesthetic: Large, Bold Modern Typography) */}
        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '20px',
              background: '#000000',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '900',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '6px'
            }}
          >
            <span>🔥</span>
            <span>CAMPUS RADAR</span>
          </div>

          <h1
            style={{
              fontSize: '32px',
              fontWeight: '950',
              color: '#000000',
              margin: '0 0 4px 0',
              letterSpacing: '-1.2px',
              lineHeight: 1.05
            }}
          >
            EXPLORE
          </h1>
          <p
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#6b7280',
              margin: 0,
              letterSpacing: '-0.2px'
            }}
          >
            Find classmates. Unlock perks. Rank your batch.
          </p>
        </div>

        {/* 2. Bold Search Input */}
        <div style={{ position: 'relative', marginBottom: '18px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f9fafb',
              border: '2px solid #000000',
              borderRadius: '18px',
              padding: '0 14px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'border-color 0.2s ease'
            }}
          >
            <span style={{ fontSize: '15px', color: '#000000', marginRight: '8px', fontWeight: '900' }}>🔍</span>
            <input
              type="text"
              placeholder="Search classmates @handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '13px 0',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#000000',
                fontSize: '14px',
                fontWeight: '800'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
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
                  background: '#ffffff',
                  border: '2px solid #000000',
                  borderRadius: '18px',
                  padding: '8px',
                  zIndex: 40,
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}
              >
                {isSearching ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '13px', fontWeight: '700' }}>
                    Searching Bathinda Hubs...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '13px', fontWeight: '700' }}>
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
                          background: '#f9fafb',
                          marginBottom: '6px'
                        }}
                      >
                        <div
                          onClick={() => onViewPublicProfile && onViewPublicProfile(user.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                        >
                          {renderProfilePic
                            ? renderProfilePic(user.profile_pic, user.avatar, user.is_pro, user.selected_ring || user.ring, 38, Boolean(user.invites >= 25 || user.recruits >= 25 || user.is_god_mode || user.is_legend))
                            : (
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {user.avatar || '😎'}
                              </div>
                            )}
                          <div style={{ textAlign: 'left' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#000000', display: 'block' }}>
                              {user.name || `@${user.handle}`}
                            </span>
                            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                              @{user.handle} • {user.institute || 'Kapil Institute'}
                            </span>
                          </div>
                        </div>

                        {/* Request Action Button */}
                        <div>
                          {status === 'accepted' ? (
                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: '900', padding: '4px 8px' }}>
                              ✓ Friends
                            </span>
                          ) : status === 'pending' || status === 'sending' ? (
                            <span style={{ fontSize: '11px', color: '#d97706', fontWeight: '800', padding: '4px 8px' }}>
                              ⏳ Sent
                            </span>
                          ) : (
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              onClick={() => handleSendFriendRequest(user.id)}
                              style={{
                                padding: '7px 14px',
                                borderRadius: '10px',
                                border: 'none',
                                background: '#000000',
                                color: '#ffffff',
                                fontSize: '12px',
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

        {/* 3. Batch Captains Hub Spotlight Banner (Bold Gen-Z Upgrade) */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/captains')}
          style={{
            background: '#000000',
            border: '2px solid #000000',
            borderRadius: '20px',
            padding: '14px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
            <span style={{ fontSize: '26px' }}>👑</span>
            <div>
              <div style={{ color: '#ffffff', fontSize: '14.5px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.3px' }}>
                <span>BATCH CAPTAINS HUB</span>
                <span style={{ background: '#fbbf24', color: '#000000', fontSize: '9.5px', fontWeight: '950', padding: '2px 7px', borderRadius: '6px' }}>
                  APPLY
                </span>
              </div>
              <div style={{ color: '#d1d5db', fontSize: '11.5px', marginTop: '2px', fontWeight: '600' }}>
                Invite 25 classmates to claim hub crown & moderation
              </div>
            </div>
          </div>
          <span style={{ color: '#fbbf24', fontSize: '18px', fontWeight: '900' }}>➔</span>
        </motion.div>

        {/* ======================================================== */}
        {/* 4. COLLAPSIBLE ACCORDIONS (80% FOCUS / GEN-Z TYPOGRAPHY) */}
        {/* ======================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>

          {/* SUB-MENU 1: UNLOCK PREMIUM FEATURES (VIRAL REFERRAL TRACKER) */}
          <div
            style={{
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)'
            }}
          >
            <button
              type="button"
              onClick={() => toggleAccordion('premium')}
              style={{
                width: '100%',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '950', color: '#000000', letterSpacing: '-0.3px' }}>
                    Unlock Premium Features
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', marginTop: '1px' }}>
                    Viral Referral Tracker • Unique Link & WhatsApp Share
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '900',
                  color: '#000000',
                  transform: openAccordion === 'premium' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                ▼
              </span>
            </button>

            <AnimatePresence>
              {openAccordion === 'premium' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden', borderTop: '1px solid #f3f4f6' }}
                >
                  <div style={{ padding: '14px 16px 16px 16px' }}>
                    {/* Embedded Viral Referral Tracker component */}
                    <ReferralInviteSnippet user={currentUser} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ACCORDION 2: LEGENDS (BATCH CAPTAINS) */}
          <div
            style={{
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)'
            }}
          >
            <button
              type="button"
              onClick={() => toggleAccordion('legends')}
              style={{
                width: '100%',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>👑</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '950', color: '#000000', letterSpacing: '-0.3px' }}>
                    Legends (Batch Captains)
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', marginTop: '1px' }}>
                    25+ Recruits • Hall of Fame
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '900',
                  color: '#000000',
                  transform: openAccordion === 'legends' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                ▼
              </span>
            </button>

            <AnimatePresence>
              {openAccordion === 'legends' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden', borderTop: '1px solid #f3f4f6' }}
                >
                  <div style={{ padding: '12px 16px 16px 16px' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '700', color: '#6b7280', textAlign: 'left' }}>
                      Students with official Batch Captain status across Bathinda hubs.
                    </p>

                    {isLoadingLegends ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: '#6b7280', fontSize: '13px', fontWeight: '700' }}>
                        Loading Legends...
                      </div>
                    ) : legends.length === 0 ? (
                      <div style={{ padding: '20px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>👑</div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '950', color: '#000000', lineHeight: '1.3' }}>
                          No Batch Captains yet. Claim the crown!
                        </p>
                        <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                          Invite 25 classmates to become an official Batch Captain and lead your hub.
                        </p>
                        <button
                          onClick={() => navigate('/captains')}
                          style={{
                            padding: '10px 20px',
                            background: '#000000',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '12.5px',
                            fontWeight: '900',
                            cursor: 'pointer'
                          }}
                        >
                          Apply for Batch Captain ➔
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {legends.map((legend, idx) => (
                          <div
                            key={legend.id || idx}
                            onClick={() => onViewPublicProfile && onViewPublicProfile(legend.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 0',
                              borderBottom: idx === legends.length - 1 ? 'none' : '1px solid #f3f4f6',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {renderProfilePic
                                ? renderProfilePic(legend.profile_pic, legend.avatar, true, legend.selected_ring || legend.ring || 'gold', 42, true)
                                : (
                                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                    {legend.avatar || '👑'}
                                  </div>
                                )}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '14.5px', fontWeight: '950', color: '#000000', letterSpacing: '-0.2px' }}>
                                  {legend.name || `@${legend.handle}`}
                                </span>
                                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                                  @{legend.handle}
                                </span>
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#000000',
                                    color: '#ffffff',
                                    fontSize: '9.5px',
                                    fontWeight: '900',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    marginTop: '3px',
                                    letterSpacing: '0.02em'
                                  }}
                                >
                                  <span>👑</span>
                                  <span>Batch Captain</span>
                                </div>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '13px', fontWeight: '950', color: '#000000' }}>
                                {legend.total_votes || 0} 🔥
                              </span>
                              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px', fontWeight: '700' }}>
                                {legend.invites ? `${legend.invites} recruits` : 'Leader'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ACCORDION 3: CLASS RANK (STRICTLY LOGGED-IN INSTITUTE & CLASS) */}
          <div
            style={{
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)'
            }}
          >
            <button
              type="button"
              onClick={() => toggleAccordion('classRank')}
              style={{
                width: '100%',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🏆</span>
                  <span style={{ fontSize: '15px', fontWeight: '950', color: '#000000', letterSpacing: '-0.3px' }}>
                    Class Rank
                  </span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#6b7280', fontWeight: '700', marginTop: '2px', paddingLeft: '30px' }}>
                  {currentUserInstitute} • {currentUserStream}
                </span>
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '900',
                  color: '#000000',
                  transform: openAccordion === 'classRank' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                ▼
              </span>
            </button>

            <AnimatePresence>
              {openAccordion === 'classRank' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden', borderTop: '1px solid #f3f4f6' }}
                >
                  <div style={{ padding: '12px 16px 16px 16px' }}>
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: '12px',
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        marginBottom: '12px',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '11.5px', color: '#111827', fontWeight: '800' }}>
                        📍 Isolated to {currentUserInstitute} • {currentUserStream} students only
                      </span>
                    </div>

                    {isLoadingLeaderboard ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: '#6b7280', fontSize: '13px', fontWeight: '700' }}>
                        Calculating class rank...
                      </div>
                    ) : classLeaderboard.length === 0 ? (
                      <div style={{ padding: '20px 0', textAlign: 'left' }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '950', color: '#000000' }}>
                          You are the first from {currentUserInstitute} ({currentUserStream})!
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                          Invite your classmates to kickstart the live batch ranking.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {classLeaderboard.map((student, idx) => {
                          const isMe = student.id === currentUser?.id;
                          return (
                            <div
                              key={student.id || idx}
                              onClick={() => onViewPublicProfile && onViewPublicProfile(student.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 0',
                                borderBottom: idx === classLeaderboard.length - 1 ? 'none' : '1px solid #f3f4f6',
                                cursor: 'pointer',
                                background: isMe ? '#f9fafb' : 'transparent',
                                borderRadius: isMe ? '12px' : '0',
                                paddingLeft: isMe ? '8px' : '0',
                                paddingRight: isMe ? '8px' : '0'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span
                                  style={{
                                    width: '26px',
                                    fontSize: '14px',
                                    fontWeight: '950',
                                    color: idx === 0 ? '#000000' : '#6b7280',
                                    textAlign: 'left'
                                  }}
                                >
                                  #{idx + 1}
                                </span>
                                {renderProfilePic
                                  ? renderProfilePic(student.profile_pic, student.avatar, student.is_pro, student.selected_ring || student.ring, 40, Boolean(student.invites >= 25 || student.recruits >= 25 || student.is_god_mode || student.is_legend))
                                  : (
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {student.avatar || '😎'}
                                    </div>
                                  )}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                  <span style={{ fontSize: '14px', fontWeight: '950', color: '#000000', letterSpacing: '-0.2px' }}>
                                    {student.name || `@${student.handle}`} {isMe && ' (You)'}
                                  </span>
                                  <span style={{ fontSize: '11.5px', color: '#6b7280', fontWeight: '600' }}>
                                    @{student.handle}
                                  </span>
                                </div>
                              </div>

                              <span style={{ fontSize: '13px', fontWeight: '950', color: '#000000' }}>
                                {student.total_votes || 0} 🔥
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ACCORDION 4: INSTITUTE-WIDE LEADERBOARD */}
          <div
            style={{
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 3px 12px rgba(0, 0, 0, 0.05)'
            }}
          >
            <button
              type="button"
              onClick={() => toggleAccordion('allBathinda')}
              style={{
                width: '100%',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>📍</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '950', color: '#000000', letterSpacing: '-0.3px' }}>
                    {currentUserInstitute} Rankings
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', marginTop: '1px' }}>
                    Institute-wide Leaderboard
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '900',
                  color: '#000000',
                  transform: openAccordion === 'allBathinda' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                ▼
              </span>
            </button>

            <AnimatePresence>
              {openAccordion === 'allBathinda' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden', borderTop: '1px solid #f3f4f6' }}
                >
                  <div style={{ padding: '12px 16px 16px 16px' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: '700', color: '#6b7280', textAlign: 'left' }}>
                      Rankings strictly isolated to {currentUserInstitute} students.
                    </p>

                    {isLoadingLeaderboard ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: '#6b7280', fontSize: '13px', fontWeight: '700' }}>
                        Loading {currentUserInstitute} ranks...
                      </div>
                    ) : leaderboard.length === 0 ? (
                      <div style={{ padding: '20px 0', textAlign: 'center', color: '#6b7280', fontSize: '13px', fontWeight: '700' }}>
                        No students ranked yet. Cast votes in the feed to start trends!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {leaderboard.map((student, idx) => (
                          <div
                            key={student.id || idx}
                            onClick={() => onViewPublicProfile && onViewPublicProfile(student.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 0',
                              borderBottom: idx === leaderboard.length - 1 ? 'none' : '1px solid #f3f4f6',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span
                                style={{
                                  width: '26px',
                                  fontSize: '14px',
                                  fontWeight: '950',
                                  color: idx === 0 ? '#000000' : '#6b7280',
                                  textAlign: 'left'
                                }}
                              >
                                #{idx + 1}
                              </span>
                              {renderProfilePic
                                ? renderProfilePic(student.profile_pic, student.avatar, student.is_pro, student.selected_ring || student.ring, 40, Boolean(student.invites >= 25 || student.recruits >= 25 || student.is_god_mode || student.is_legend))
                                : (
                                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {student.avatar || '😎'}
                                  </div>
                                )}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '14px', fontWeight: '950', color: '#000000', letterSpacing: '-0.2px' }}>
                                  {student.name || `@${student.handle}`}
                                </span>
                                <span style={{ fontSize: '11.5px', color: '#6b7280', fontWeight: '600' }}>
                                  @{student.handle} • {student.stream || student.institute || 'Kapil Institute'}
                                </span>
                              </div>
                            </div>

                            <span style={{ fontSize: '13px', fontWeight: '950', color: '#000000' }}>
                              {student.total_votes || 0} 🔥
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
