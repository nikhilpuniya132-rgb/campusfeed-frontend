import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InstituteCombobox, { findHubForInstitute } from './InstituteCombobox';
import { handleShare } from '../utils/share';
import { Share2 } from 'lucide-react';
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

  // Accordion 1: Select Aura Rings (Strictly closed by default)
  const [isAuraOpen, setIsAuraOpen] = useState(false);
  const [auraToast, setAuraToast] = useState('');

  // Accordion 2: Number of polls casted today (Strictly closed by default)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const computedGrade = editStream.includes('10') ? 10 : editStream.includes('12') ? 12 : 11;
      const computedHub = editHub || findHubForInstitute(editInstitute);
      const updatedUser = {
        ...user,
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

      await fetch(`${API}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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

      {/* 1. Header Profile Display */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'inline-block', position: 'relative', marginBottom: '10px' }}>
          {renderProfilePic
            ? renderProfilePic(editProfilePic || user.profile_pic, editAvatar || user.avatar, user.is_pro, selectedRing, 92, isLifetimeLegend)
            : (
              <div style={{ fontSize: '50px', width: '92px', height: '92px', borderRadius: '50%', background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {user.avatar || '😎'}
              </div>
            )}
        </div>

        <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '900', color: '#000000' }}>
          @{user.handle}
        </h2>

        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span>{user.institute || user.school || 'Kapil Institute'}</span>
          <span>•</span>
          <span style={{ color: '#111827', fontWeight: '700' }}>{user.stream || '11th Medical'}</span>
          <span>•</span>
          <span style={{ color: '#4b5563', fontWeight: '600' }}>📍 {user.coaching_hub || user.hub || 'Ajit Road Hub'}</span>
        </p>

        {/* Bio */}
        <p style={{ color: '#4b5563', fontSize: '13.5px', margin: '0 0 10px 0', lineHeight: '1.4' }}>
          {user.bio || `${user.stream || '11th Medical'} student at ${user.institute || 'Kapil Institute'}`}
        </p>

        {/* Small "Edit Profile" Text Link Directly Under Bio */}
        {!isEditing && (
          <button
            onClick={() => {
              setEditBio(user.bio || '');
              setEditAvatar(user.avatar || '');
              setEditGrade(user.grade ? user.grade.toString() : '11');
              setEditStream(user.stream || '11th Medical');
              setEditInstitute(user.institute || user.school || 'Kapil Institute');
              setEditHub(user.coaching_hub || user.hub || 'Ajit Road Hub');
              setEditCity('Bathinda');
              setEditProfilePic(user.profile_pic || '');
              setIsEditing(true);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              padding: '4px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '12px'
            }}
          >
            <span>✏️</span> Edit Profile
          </button>
        )}
      </div>

      {/* EDIT PROFILE DRAWER (WHEN ACTIVE) */}
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
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '950', color: '#000000' }}>Edit Profile</h3>

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
          <div style={{ marginBottom: '16px' }}>
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
            <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
              Select your coaching batch/stream to see batch-specific polls and leaderboards.
            </p>
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

      {/* ======================================================== */}
      {/* TWO CLOSED ACCORDIONS DIRECTLY UNDER EDIT PROFILE        */}
      {/* ======================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>

        {/* ACCORDION 1: SELECT AURA RINGS (MOVED HERE, CLOSED BY DEFAULT) */}
        <div
          style={{
            background: '#ffffff',
            border: '2px solid #000000',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
          }}
        >
          <button
            type="button"
            onClick={() => setIsAuraOpen(prev => !prev)}
            style={{
              width: '100%',
              padding: '14px 16px',
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
              <span style={{ fontSize: '18px' }}>💍</span>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '950', color: '#000000', letterSpacing: '-0.3px' }}>
                  Select Aura Rings
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', marginTop: '1px' }}>
                  Equip halo ring on your profile & feeds
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '900',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  background: isLifetimeLegend ? '#fbbf24' : '#f3f4f6',
                  color: isLifetimeLegend ? '#000000' : '#6b7280'
                }}
              >
                {isLifetimeLegend ? '👑 Unlocked' : '🔒 25 Invites'}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#000000',
                  transform: isAuraOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                ▼
              </span>
            </div>
          </button>

          {auraToast && (
            <div style={{
              margin: '0 16px 8px 16px',
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

          <AnimatePresence>
            {isAuraOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{ overflow: 'hidden', borderTop: '1px solid #f3f4f6' }}
              >
                <div style={{ padding: '12px 16px 16px 16px' }}>
                  {!isLifetimeLegend && (
                    <div style={{
                      padding: '10px 12px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '12px',
                      color: '#991b1b',
                      fontSize: '11px',
                      lineHeight: '1.4',
                      textAlign: 'left',
                      marginBottom: '10px',
                      fontWeight: '700'
                    }}>
                      🔒 <strong>STRICTLY LOCKED:</strong> Aura Rings unlock exclusively for Lifetime Legends (25+ invites). Basic God Mode does not include vanity rings.
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
                            opacity: isLifetimeLegend ? 1 : 0.55,
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
                            color: isEquipped ? '#ffffff' : '#4b5563'
                          }}>
                            {isLifetimeLegend ? (isEquipped ? 'Equipped ✓' : 'Equip') : '🔒'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ACCORDION 2: NUMBER OF POLLS CASTED TODAY (NEW COMPONENT, CLOSED BY DEFAULT) */}
        <div
          style={{
            background: '#ffffff',
            border: '2px solid #000000',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsHistoryOpen(prev => !prev);
              if (!isHistoryOpen) fetchTodayVotingHistory();
            }}
            style={{
              width: '100%',
              padding: '14px 16px',
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
              <span style={{ fontSize: '18px' }}>🗳️</span>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '950', color: '#000000', letterSpacing: '-0.3px' }}>
                  Number of polls casted today
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700', marginTop: '1px' }}>
                  Live voting history & session tracker
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '950',
                  padding: '3px 9px',
                  borderRadius: '8px',
                  background: '#000000',
                  color: '#ffffff'
                }}
              >
                {todayVotesCount}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#000000',
                  transform: isHistoryOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                ▼
              </span>
            </div>
          </button>

          <AnimatePresence>
            {isHistoryOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{ overflow: 'hidden', borderTop: '1px solid #f3f4f6' }}
              >
                <div style={{ padding: '14px 16px 16px 16px' }}>
                  {/* Dynamic Integer Banner */}
                  <div
                    style={{
                      background: '#f9fafb',
                      border: '1.5px solid #000000',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Today's Activity
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '950', color: '#000000' }}>
                        Polls Cast Today
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                      <span style={{ fontSize: '26px', fontWeight: '950', color: '#000000', lineHeight: 1 }}>
                        {todayVotesCount}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#6b7280' }}>
                        polls
                      </span>
                    </div>
                  </div>

                  {/* Clean Scrollable History Log */}
                  {isLoadingHistory ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#6b7280', fontSize: '12.5px', fontWeight: '700' }}>
                      Loading today's votes...
                    </div>
                  ) : todayVotesHistory.length === 0 ? (
                    <div style={{ padding: '16px 8px', textAlign: 'center', color: '#6b7280' }}>
                      <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>🎯</span>
                      <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '900', color: '#000000' }}>
                        No polls cast today yet
                      </p>
                      <span style={{ fontSize: '11.5px', color: '#6b7280' }}>
                        Jump into the feed to cast votes for your classmates!
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        paddingRight: '2px'
                      }}
                    >
                      {todayVotesHistory.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          style={{
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '10px 12px',
                            textAlign: 'left'
                          }}
                        >
                          {/* Format: [Question Text] -> Voted for: [Candidate Name] */}
                          <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#000000', marginBottom: '4px', lineHeight: '1.35' }}>
                            "{item.question}"
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}>
                              <span style={{ color: '#6b7280', fontWeight: '700' }}>➔ Voted for:</span>
                              <span style={{ fontWeight: '950', color: '#000000' }}>
                                {item.candidateName}
                              </span>
                              {item.candidateHandle && (
                                <span style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600' }}>
                                  (@{item.candidateHandle})
                                </span>
                              )}
                            </div>

                            {item.createdAt && (
                              <span style={{ fontSize: '10.5px', color: '#9ca3af', fontWeight: '600' }}>
                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
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

      </div>

      {/* 2. Campus Social Stats Matrix */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '0 0 20px 0', flexWrap: 'wrap' }}>
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '6px 14px', borderRadius: '16px', color: '#000000', fontWeight: '700', fontSize: '12.5px' }}>
          🔥 {user.total_votes || 0} Flames
        </div>
        
        {/* Clickable Friends Count Display */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFriendsModal(true)}
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            padding: '6px 14px',
            borderRadius: '16px',
            color: '#000000',
            fontWeight: '700',
            fontSize: '12.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>👥</span>
          <span>{acceptedFriends.length} Friends</span>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>▼</span>
        </motion.div>

        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '6px 14px', borderRadius: '16px', color: '#000000', fontWeight: '700', fontSize: '12.5px' }}>
          ⚡ {Math.round((user.total_votes || 0) * 12 + acceptedFriends.length * 25)} Aura
        </div>
      </div>

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
    </div>
  );
}
