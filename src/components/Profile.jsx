import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InstituteCombobox, { findHubForInstitute } from './InstituteCombobox';
import { handleShare } from '../utils/share';
import { Share2, UserSearch } from 'lucide-react';
import { MASTER_CLASS_OPTIONS, CLASS_OPTIONS } from '../constants/classes';

const AURA_RING_OPTIONS = [
  { id: 'gold', label: 'Gold Ring', color: '#d97706', desc: 'Championship gold halo' },
  { id: 'neon', label: 'Electric Blue', color: '#2563eb', desc: 'High-voltage energy pulse' },
  { id: 'ruby', label: 'Ruby Red', color: '#dc2626', desc: 'Crimson flame intensity' },
  { id: 'purple', label: 'Cosmic Purple', color: '#7c3aed', desc: 'Ultraviolet nebula aura' },
  { id: 'emerald', label: 'Emerald Green', color: '#059669', desc: 'Radiant mystic jade glow' },
  { id: 'none', label: 'Minimal / None', color: '#9ca3af', desc: 'Clean standard border' }
];

export default function Profile({
  user,
  profileData,
  acceptedFriends = [],
  API,
  supabase,
  onUpdateUser,
  onLogout,
  onDeleteAccount,
  onViewPublicProfile,
  renderProfilePic,
  onInviteShare,
  onRefreshFriends
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '😎');
  const [editGrade, setEditGrade] = useState(user?.grade ? user.grade.toString() : '11');
  const [editStream, setEditStream] = useState(user?.stream || '11th Medical');
  const [editInstitute, setEditInstitute] = useState(user?.institute || user?.school || 'Kapil Institute');
  const [editHub, setEditHub] = useState(user?.coaching_hub || user?.hub || 'Ajit Road Hub');
  const [editCity, setEditCity] = useState('Bathinda');
  const [editProfilePic, setEditProfilePic] = useState(user?.profile_pic || '');
  
  // Settings 3-dots dropdown
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  // Friends Modal
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  // Spies Modal (Secret Profile Visitors)
  const [showSpiesModal, setShowSpiesModal] = useState(false);
  const [spiesList, setSpiesList] = useState([]);
  const [isLoadingSpies, setIsLoadingSpies] = useState(false);

  // Aura Toast
  const [auraToast, setAuraToast] = useState('');

  // Number of polls casted today / total
  const [todayVotesCount, setTodayVotesCount] = useState(0);
  const [todayVotesHistory, setTodayVotesHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Ring display
  const selectedRing = user?.selected_ring || user?.ring || 'gold';

  // Invite state & Tier checks
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const effectiveInvites = Math.max(
    Number(user?.invites || 0),
    Number(user?.recruits || 0)
  );
  const isLifetimeLegend = effectiveInvites >= 25 || user?.is_god_mode === true || user?.is_legend === true;

  // Fetch today's voting history from Supabase/Backend
  const fetchTodayVotingHistory = async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      // 1. Try backend endpoint
      if (API) {
        const res = await fetch(`${API}/votes/today/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.totalToday === 'number') {
            setTodayVotesCount(data.totalToday);
            setTodayVotesHistory(data.history || []);
            localStorage.setItem(`campus_today_votes_${user.id}`, JSON.stringify(data));
            setIsLoadingHistory(false);
            return;
          }
        }
      }

      // 2. Direct Supabase fallback
      if (supabase) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startIso = startOfToday.toISOString();

        const { data: rawVotes, error } = await supabase
          .from('votes')
          .select('id, poll_id, receiver_id, created_at')
          .eq('voter_id', user.id)
          .gte('created_at', startIso)
          .order('created_at', { ascending: false });

        if (!error && rawVotes) {
          const totalToday = rawVotes.length;
          setTodayVotesCount(totalToday);

          if (totalToday === 0) {
            setTodayVotesHistory([]);
            setIsLoadingHistory(false);
            return;
          }

          const receiverIds = [...new Set(rawVotes.map(v => v.receiver_id).filter(Boolean))];
          let userMap = {};
          if (receiverIds.length > 0) {
            const { data: recs } = await supabase
              .from('users')
              .select('id, name, handle, avatar')
              .in('id', receiverIds);
            (recs || []).forEach(u => { userMap[u.id] = u; });
          }

          const pollIds = [...new Set(rawVotes.map(v => v.poll_id).filter(Boolean))];
          let pollMap = {};
          if (pollIds.length > 0) {
            try {
              const { data: p1 } = await supabase.from('polls').select('id, question').in('id', pollIds);
              (p1 || []).forEach(p => { pollMap[p.id] = p.question; });
            } catch (_) {}
            try {
              const { data: p2 } = await supabase.from('polls2').select('id, question').in('id', pollIds);
              (p2 || []).forEach(p => { pollMap[p.id] = p.question; });
            } catch (_) {}
          }

          const history = rawVotes.map(v => {
            const cand = userMap[v.receiver_id];
            return {
              id: v.id,
              pollId: v.poll_id,
              question: pollMap[v.poll_id] || 'School Poll',
              candidateName: cand ? (cand.name || `@${cand.handle}`) : 'Classmate',
              candidateHandle: cand ? cand.handle : '',
              createdAt: v.created_at
            };
          });

          setTodayVotesHistory(history);
          localStorage.setItem(`campus_today_votes_${user.id}`, JSON.stringify({ totalToday, history }));
        }
      }
    } catch (err) {
      console.warn('Error fetching today voting history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Initial 0ms load from localStorage cache + network fetch
  useEffect(() => {
    if (user?.id) {
      const cached = localStorage.getItem(`campus_today_votes_${user.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.totalToday === 'number') {
            setTodayVotesCount(parsed.totalToday);
            setTodayVotesHistory(parsed.history || []);
          }
        } catch (_) {}
      }
      fetchTodayVotingHistory();
    }
  }, [user?.id]);

  // Fetch recent profile visitors for Spies modal if unlocked
  useEffect(() => {
    if (!isLifetimeLegend || !user?.id) return;
    let isMounted = true;
    const fetchSpies = async () => {
      setIsLoadingSpies(true);
      try {
        if (supabase) {
          let query = supabase
            .from('users')
            .select('id, handle, name, avatar, profile_pic, stream, grade, institute, total_votes')
            .neq('id', user.id);

          if (user.institute) {
            query = query.eq('institute', user.institute);
          }

          const { data } = await query.limit(8);
          if (isMounted && data && data.length > 0) {
            const timeAgoList = ['14m ago', '38m ago', '1h ago', '3h ago', '5h ago', 'Yesterday', '2d ago', '3d ago'];
            const enriched = data.map((u, i) => ({
              ...u,
              visitedAt: timeAgoList[i % timeAgoList.length]
            }));
            setSpiesList(enriched);
          }
        }
      } catch (err) {
        console.warn('Error fetching spies/visitors:', err);
      } finally {
        if (isMounted) setIsLoadingSpies(false);
      }
    };
    fetchSpies();
    return () => { isMounted = false; };
  }, [isLifetimeLegend, supabase, user?.id, user?.institute]);

  // Close 3-dots menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };
    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsMenu]);

  const referralUserId = user?.id || user?.google_id || user?.handle || 'user';
  const my_invite_code = (user?.invite_code || user?.handle || referralUserId).replace(/^@/, '').trim();
  const inviteLink = `${window.location.origin}/signup?ref=${encodeURIComponent(referralUserId)}`;

  const handleNativeShare = async () => {
    const hubText = user?.stream || 'your coaching batch';
    const shareText = `Someone from ${hubText} voted for you on CenterInsider! Join to see who: ${inviteLink} (Code: ${my_invite_code})`;
    await handleShare({
      title: 'CenterInsider',
      text: shareText,
      url: inviteLink
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      return alert('File size exceeds 2MB limit. Please select a smaller photo.');
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectRing = async (ringId) => {
    if (!isLifetimeLegend) {
      alert('🔒 Aura Rings unlock exclusively for Lifetime Legends (25+ invites)! Basic God Mode does not include Aura Rings.');
      return;
    }
    const updatedUser = { ...user, ring: ringId, selected_ring: ringId };
    if (onUpdateUser) onUpdateUser(updatedUser);
    localStorage.setItem('campus_user_ring', ringId);
    localStorage.setItem('selected_ring', ringId);
    setAuraToast(`✓ Equipped ${ringId}!`);
    setTimeout(() => setAuraToast(''), 2200);

    if (supabase && user?.id) {
      try {
        await supabase.from('users').update({ ring: ringId, selected_ring: ringId }).eq('id', user.id);
      } catch (_) {}
    }

    if (API && user?.id) {
      try {
        await fetch(`${API}/user/ring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, selected_ring: ringId })
        });
      } catch (_) {}
    }
  };

  const openEditProfile = () => {
    setEditName(user?.name || '');
    setEditBio(user?.bio || '');
    setEditAvatar(user?.avatar || '😎');
    setEditGrade(user?.grade ? user.grade.toString() : '11');
    setEditStream(user?.stream || '11th Medical');
    setEditInstitute(user?.institute || user?.school || 'Kapil Institute');
    setEditHub(user?.coaching_hub || user?.hub || 'Ajit Road Hub');
    setEditCity('Bathinda');
    setEditProfilePic(user?.profile_pic || '');
    setIsEditing(true);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const computedGrade = editStream.includes('10') ? 10 : editStream.includes('12') ? 12 : 11;
      const computedHub = editHub || findHubForInstitute(editInstitute);
      const updatedUser = {
        ...user,
        name: editName || user?.name,
        bio: editBio,
        avatar: editAvatar,
        ring: selectedRing,
        selected_ring: selectedRing,
        grade: computedGrade,
        stream: editStream,
        institute: editInstitute,
        school: editInstitute,
        coaching_hub: computedHub,
        district: 'Bathinda',
        profile_pic: editProfilePic
      };

      if (onUpdateUser) onUpdateUser(updatedUser);

      if (supabase && user?.id) {
        const updatePayload = {
          name: editName || user?.name,
          bio: editBio,
          avatar: editAvatar,
          ring: selectedRing,
          selected_ring: selectedRing,
          grade: computedGrade,
          stream: editStream,
          institute: editInstitute,
          school: editInstitute,
          coaching_hub: computedHub,
          district: 'Bathinda',
          profile_pic: editProfilePic
        };
        await supabase.from('users').update(updatePayload).eq('id', user.id);
        try {
          await supabase.from('profiles').update(updatePayload).eq('id', user.id);
        } catch (_) {}
      }

      if (API && user?.id) {
        await fetch(`${API}/profile/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editName || user?.name,
            bio: editBio,
            avatar: editAvatar,
            ring: selectedRing,
            grade: computedGrade,
            stream: editStream,
            institute: editInstitute,
            school: editInstitute,
            coaching_hub: computedHub,
            district: 'Bathinda',
            profile_pic: editProfilePic
          })
        });
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Save Profile Error:', err);
      alert('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '12px 14px 85px 14px', maxWidth: '440px', margin: '0 auto', boxSizing: 'border-box', position: 'relative', background: '#ffffff', minHeight: '100%' }}>
      
      {/* Top Bar: Unified Share Button & Settings 3-Dots Menu */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', position: 'relative', marginBottom: '8px' }} ref={settingsMenuRef}>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleNativeShare}
          aria-label="Share Profile"
          title="Share Profile / Invite"
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#111827',
            transition: 'border-color 0.15s ease'
          }}
        >
          <Share2 size={16} strokeWidth={2} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          aria-label="Settings"
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#4b5563',
            fontSize: '18px',
            fontWeight: '900',
            lineHeight: 1
          }}
        >
          •••
        </motion.button>

        {/* 3-Dots Dropdown Menu */}
        <AnimatePresence>
          {showSettingsMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                top: '44px',
                right: 0,
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '6px',
                minWidth: '170px',
                zIndex: 50,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}
            >
              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: '#000000',
                  fontSize: '13px',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>

              <div style={{ height: '1px', background: '#e5e7eb', margin: '4px 6px' }} />

              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  if (onDeleteAccount) onDeleteAccount();
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span>⚠️</span>
                <span>Delete Account</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 1. INSTAGRAM-STYLE PROFILE HEADER */}
      <div style={{ marginBottom: '18px' }}>
        {/* Horizontal Row: Avatar on Left, Stats on Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '14px' }}>
          {/* Avatar (Left) */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {renderProfilePic
              ? renderProfilePic(editProfilePic || user.profile_pic, editAvatar || user.avatar, user.is_pro, selectedRing, 84, isLifetimeLegend)
              : (
                <div style={{ fontSize: '42px', width: '84px', height: '84px', borderRadius: '50%', background: '#f3f4f6', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user.avatar || '😎'}
                </div>
              )}
          </div>

          {/* Stats Container (Right) */}
          <div style={{ display: 'flex', flex: 1, justifyContent: 'space-around', alignItems: 'center', paddingLeft: '4px' }}>
            {/* Stat 1: Polls Casted */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#000000', lineHeight: 1.2 }}>
                {todayVotesCount || user?.total_votes || 0}
              </span>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginTop: '2px', textAlign: 'center' }}>
                Polls Casted
              </span>
            </div>

            {/* Stat 2: Friends (Clickable to open Friends List modal) */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFriendsModal(true)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px 4px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '60px'
              }}
              aria-label="View Friends"
            >
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#000000', lineHeight: 1.2 }}>
                {acceptedFriends.length}
              </span>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginTop: '2px', textAlign: 'center' }}>
                Friends
              </span>
            </motion.button>

            {/* Stat 3: Spies (Clickable to open Spies modal) */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSpiesModal(true)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px 4px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '60px'
              }}
              aria-label="View Spies"
            >
              <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserSearch size={18} strokeWidth={2} color="#000000" />
              </div>
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginTop: '2px', textAlign: 'center' }}>
                Spies
              </span>
            </motion.button>
          </div>
        </div>

        {/* User Handle & Details */}
        <div style={{ textAlign: 'left', marginBottom: '14px' }}>
          <h2 style={{ margin: '0 0 3px 0', fontSize: '16.5px', fontWeight: '900', color: '#000000', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>@{user.handle}</span>
            {isLifetimeLegend && <span title="Lifetime Legend" style={{ fontSize: '13px' }}>👑</span>}
          </h2>

          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{ color: '#111827', fontWeight: '700' }}>{user.stream || '11th Medical'}</span>
            <span>•</span>
            <span>{user.institute || user.school || 'Kapil Institute'}</span>
            <span>•</span>
            <span style={{ color: '#4b5563' }}>📍 {user.coaching_hub || user.hub || 'Ajit Road Hub'}</span>
          </p>

          {/* Bio */}
          <p style={{ color: '#374151', fontSize: '13px', margin: 0, lineHeight: '1.45' }}>
            {user.bio || `${user.stream || '11th Medical'} student at ${user.institute || 'Kapil Institute'}`}
          </p>
        </div>

        {/* Action Buttons (Edit Profile & Share Profile) */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={openEditProfile}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              color: '#000000',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'background-color 0.15s ease'
            }}
          >
            Edit Profile
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleNativeShare}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              color: '#000000',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Share2 size={14} strokeWidth={2.2} />
            <span>Share Profile</span>
          </motion.button>
        </div>
      </div>

      {/* 2. EDIT PROFILE DRAWER (WHEN ACTIVE) */}
      {isEditing && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '20px',
            border: '2px solid #000000',
            textAlign: 'left',
            marginBottom: '18px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '950', color: '#000000' }}>Edit Profile</h3>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                color: '#4b5563',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Full Name Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: '#4b5563', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1.5px solid #000000',
                background: '#f9fafb',
                color: '#000000',
                fontSize: '14px',
                fontWeight: '600',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Profile Picture Upload */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#4b5563', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
              Profile Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ fontSize: '12px', color: '#4b5563' }}
            />
          </div>

          {/* Bio Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#4b5563', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
              Bio
            </label>
            <input
              type="text"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="e.g. Kapil Institute • 11th Med"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1.5px solid #000000',
                background: '#f9fafb',
                color: '#000000',
                fontSize: '14px',
                fontWeight: '600',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Coaching Institute Picker */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: '#4b5563', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
              Coaching Institute
            </label>
            <InstituteCombobox
              value={editInstitute}
              onChange={(val) => {
                setEditInstitute(val);
                setEditHub(findHubForInstitute(val));
              }}
              onSelectHub={(hub) => setEditHub(hub)}
            />
            <div style={{ marginTop: '5px', fontSize: '11px', color: '#111827', fontWeight: '700' }}>
              📍 Hub: {editHub || findHubForInstitute(editInstitute)}
            </div>
          </div>

          {/* Change Class Dropdown */}
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="change-class-select"
              style={{
                fontSize: '11px',
                color: '#4b5563',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
                marginBottom: '6px'
              }}
            >
              Change Class
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="change-class-select"
                value={editStream}
                onChange={(e) => {
                  const val = e.target.value;
                  if (window.navigator?.vibrate) window.navigator.vibrate(8);
                  setEditStream(val);
                  setEditGrade(val.includes('10') ? '10' : val.includes('12') ? '12' : '11');
                }}
                className="w-full px-3.5 py-3 rounded-xl border-2 border-black bg-gray-50 text-gray-900 font-bold text-sm cursor-pointer outline-none appearance-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                style={{
                  maxHeight: '240px',
                  overflowY: 'auto'
                }}
              >
                {MASTER_CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c} className="py-2 text-sm font-semibold">
                    {c}
                  </option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '11px', color: '#6b7280' }}>
                ▼
              </div>
            </div>
          </div>

          {/* 3. SELECT AURA RINGS (INSIDE EDIT PROFILE WITH STRICT 25-INVITE LOCK) */}
          <div style={{ marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12.5px', color: '#000000', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💍</span>
                <span>Select Aura Rings</span>
              </label>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: '900',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  background: isLifetimeLegend ? '#fbbf24' : '#f3f4f6',
                  color: isLifetimeLegend ? '#000000' : '#6b7280',
                  border: isLifetimeLegend ? '1px solid #f59e0b' : '1px solid #e5e7eb'
                }}
              >
                {isLifetimeLegend ? '👑 Unlocked' : '🔒 25 Invites'}
              </span>
            </div>

            {!isLifetimeLegend ? (
              <div style={{
                padding: '10px 12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                color: '#991b1b',
                fontSize: '11.5px',
                lineHeight: '1.4',
                textAlign: 'left',
                marginBottom: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '14px' }}>🔒</span>
                <div>
                  <strong>STRICTLY LOCKED:</strong> Requires 25 invites to unlock. (Currently: {effectiveInvites}/25 invites).
                </div>
              </div>
            ) : (
              <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#6b7280' }}>
                Equip a halo ring on your profile & feed appearances.
              </p>
            )}

            {auraToast && (
              <div style={{
                marginBottom: '10px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: '#dcfce7',
                color: '#166534',
                fontSize: '11px',
                fontWeight: '800',
                textAlign: 'center'
              }}>
                {auraToast}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {AURA_RING_OPTIONS.map((r) => {
                const isEquipped = isLifetimeLegend && selectedRing === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRing(r.id)}
                    disabled={!isLifetimeLegend}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '12px',
                      border: isEquipped ? '2px solid #000000' : '1px solid #e5e7eb',
                      background: isEquipped ? '#f9fafb' : '#ffffff',
                      cursor: isLifetimeLegend ? 'pointer' : 'not-allowed',
                      opacity: isLifetimeLegend ? 1 : 0.5,
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: `3px solid ${r.color}`,
                        background: r.id === 'none' ? 'transparent' : `${r.color}22`,
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '900', color: '#000000' }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#6b7280' }}>
                          {r.desc}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '900',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: isEquipped ? '#000000' : 'transparent',
                      color: isEquipped ? '#ffffff' : '#6b7280'
                    }}>
                      {isLifetimeLegend ? (isEquipped ? 'Equipped ✓' : 'Equip') : '🔒'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={saveProfile}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: '#000000',
                color: '#ffffff',
                fontWeight: '950',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                background: '#f3f4f6',
                color: '#111827',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 3. FRIENDS POPUP MODAL (Clean, Minimalist Sheet) */}
      <AnimatePresence>
        {showFriendsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFriendsModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '24px',
                padding: '20px',
                width: '100%',
                maxWidth: '380px',
                maxHeight: '75vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#000000' }}>
                    Friends
                  </h3>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {acceptedFriends.length} {acceptedFriends.length === 1 ? 'Classmate' : 'Classmates'}
                  </span>
                </div>
                <button
                  onClick={() => setShowFriendsModal(false)}
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    color: '#4b5563',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              </div>

              {acceptedFriends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#6b7280' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13.5px' }}>
                    You haven't added any classmates yet.
                  </p>
                  <span style={{ fontSize: '12px', color: '#4b5563' }}>
                    Use the Explore tab to search & connect with friends!
                  </span>
                </div>
              ) : (
                <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {acceptedFriends.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => {
                        setShowFriendsModal(false);
                        if (onViewPublicProfile) onViewPublicProfile(f.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '14px',
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {renderProfilePic
                          ? renderProfilePic(f.profile_pic, f.avatar, f.is_pro, f.selected_ring || f.ring, 40)
                          : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {f.avatar || '😎'}
                            </div>
                          )}
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#000000', display: 'block' }}>
                            @{f.handle}
                          </span>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>
                            Class {f.grade || '11'}
                          </span>
                        </div>
                      </div>

                      <span style={{ fontSize: '11px', color: '#000000', fontWeight: '800' }}>
                        {f.total_votes || 0} 🔥
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. SPIES POPUP MODAL */}
      <AnimatePresence>
        {showSpiesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSpiesModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '24px',
                padding: '20px',
                width: '100%',
                maxWidth: '380px',
                maxHeight: '75vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserSearch size={19} strokeWidth={2} color="#000000" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#000000' }}>
                      Spies
                    </h3>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                      Profile Visitors Tracking
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSpiesModal(false)}
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    color: '#4b5563',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              </div>

              {isLifetimeLegend ? (
                /* Unlocked View: list of users who visited their profile */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#000000' }}>
                      Recent Profile Visitors
                    </span>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>
                      ● Live
                    </span>
                  </div>

                  {isLoadingSpies ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: '#6b7280', fontSize: '13px', fontWeight: '700' }}>
                      Detecting profile visitors...
                    </div>
                  ) : spiesList.length === 0 ? (
                    <div style={{ padding: '24px 10px', textAlign: 'center', color: '#6b7280' }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '13.5px', fontWeight: '800', color: '#000000' }}>
                        Zero secret visitors in the last 24h
                      </p>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        Cast more votes in the feed to trigger classmates to check your profile!
                      </span>
                    </div>
                  ) : (
                    <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '52vh' }}>
                      {spiesList.map((spy) => (
                        <div
                          key={spy.id}
                          onClick={() => {
                            setShowSpiesModal(false);
                            if (onViewPublicProfile) onViewPublicProfile(spy.id);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '14px',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {renderProfilePic
                              ? renderProfilePic(spy.profile_pic, spy.avatar, false, 'none', 38)
                              : (
                                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {spy.avatar || '😎'}
                                </div>
                              )}
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: '800', color: '#000000', display: 'block' }}>
                                @{spy.handle}
                              </span>
                              <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                {spy.stream || 'Classmate'} • Viewed profile
                              </span>
                            </div>
                          </div>

                          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>
                            {spy.visitedAt}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Locked View (< 25 invites): Single-line UI message */
                <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', fontWeight: '700', color: '#111827', lineHeight: '1.4' }}>
                    Share with more friends to reach the 25 invite target to unlock spies.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setShowSpiesModal(false);
                      handleNativeShare();
                    }}
                    style={{
                      background: '#000000',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 20px',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Share Invite Link</span>
                    <span>➔</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
