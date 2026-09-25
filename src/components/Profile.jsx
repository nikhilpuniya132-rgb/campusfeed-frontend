import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import InstituteCombobox, { findHubForInstitute } from './InstituteCombobox';
import { handleShare } from '../utils/share';

const AURA_OPTIONS = [
  { id: 'none', label: 'None (Default)', color: '#52525b', desc: 'No special aura ring' },
  { id: 'gold', label: 'Gold Ring', color: '#fbbf24', desc: 'Luminous 24k champion aura' },
  { id: 'neon', label: 'Neon Blue Ring', color: '#38bdf8', desc: 'Electric cybernetic energy pulse' },
  { id: 'ruby', label: 'Ruby Red Ring', color: '#f43f5e', desc: 'Fiery crimson flame intensity' },
  { id: 'purple', label: 'Cosmic Purple Ring', color: '#a855f7', desc: 'Deep ultraviolet nebula glow' },
  { id: 'emerald', label: 'Emerald Green Ring', color: '#10b981', desc: 'Radiant mystic jade aura' }
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

  // Aura Ring state
  const [selectedRing, setSelectedRing] = useState(user?.selected_ring || user?.ring || 'gold');
  const [ringSavedToast, setRingSavedToast] = useState(false);
  const [isSavingRing, setIsSavingRing] = useState(false);

  // Invite state
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.selected_ring || user?.ring) {
      setSelectedRing(user.selected_ring || user.ring);
    }
  }, [user?.selected_ring, user?.ring]);

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

  const my_invite_code = (user?.invite_code || user?.handle || 'campus').replace(/^@/, '').trim();
  const inviteLink = `${window.location.origin}/?ref=${my_invite_code}`;

  const copyInviteToClipboard = async () => {
    const hubText = user?.stream || 'your batch';
    const shareText = `Someone from ${hubText} voted for you on CenterInsider! Join to see who: ${inviteLink} (Code: ${my_invite_code})`;
    await handleShare({
      title: 'CenterInsider',
      text: shareText,
      url: inviteLink
    });
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleWhatsAppInvite = async () => {
    if (onInviteShare) {
      onInviteShare();
    } else {
      const hubText = user?.stream || 'your coaching batch';
      const shareText = `Someone from ${hubText} voted for you on CenterInsider! Join to see who: ${inviteLink} (Code: ${my_invite_code})`;
      await handleShare({
        title: 'CenterInsider',
        text: shareText,
        url: inviteLink
      });
    }
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

  // Fixed & Resilient Ring Selection Handler
  const handleRingSelect = async (ringId) => {
    setSelectedRing(ringId);
    setIsSavingRing(true);

    const updatedUser = { ...user, ring: ringId, selected_ring: ringId };
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setRingSavedToast(true);
    setTimeout(() => setRingSavedToast(false), 2200);

    // 1. Direct Supabase Update (fixes client-side sync)
    if (supabase && user?.id) {
      try {
        await supabase
          .from('users')
          .update({ selected_ring: ringId, ring: ringId })
          .eq('id', user.id);
      } catch (err) {
        try {
          await supabase
            .from('users')
            .update({ ring: ringId })
            .eq('id', user.id);
        } catch (_) {}
      }
    }

    // 2. Backend API Endpoint update
    try {
      await fetch(`${API}/user/ring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, selected_ring: ringId })
      });
    } catch (err) {
      console.warn('API ring update fallback error:', err);
    } finally {
      setIsSavingRing(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const computedGrade = editStream.includes('12') ? 12 : editStream.includes('drop') ? 'dropper' : 11;
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
        city: 'Bathinda',
        profile_pic: editProfilePic
      };

      if (onUpdateUser) onUpdateUser(updatedUser);

      // Update in Supabase
      if (supabase && user?.id) {
        await supabase
          .from('users')
          .update({
            bio: editBio,
            avatar: editAvatar,
            ring: selectedRing,
            selected_ring: selectedRing,
            grade: computedGrade,
            stream: editStream,
            institute: editInstitute,
            school: editInstitute,
            coaching_hub: computedHub,
            city: 'Bathinda',
            profile_pic: editProfilePic
          })
          .eq('id', user.id);
      }

      // Update via Backend
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
          city: 'Bathinda',
          profile_pic: editProfilePic
        })
      });

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.4 } });
      setIsEditing(false);
    } catch (err) {
      console.error('Save Profile Error:', err);
      alert('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '12px 14px 75px 14px', maxWidth: '440px', margin: '0 auto', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Top Bar: Unified Share Button & Settings 3-Dots Menu */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', position: 'relative', marginBottom: '8px' }} ref={settingsMenuRef}>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleWhatsAppInvite}
          aria-label="Share Profile"
          title="Share Profile / Invite"
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#e4e4e7',
            transition: 'border-color 0.15s ease'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          aria-label="Settings"
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#a1a1aa',
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
                background: '#121214',
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '6px',
                minWidth: '170px',
                zIndex: 50,
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)'
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
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#18181b'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>

              <div style={{ height: '1px', background: '#27272a', margin: '4px 6px' }} />

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
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
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
            ? renderProfilePic(editProfilePic || user.profile_pic, editAvatar || user.avatar, user.is_pro, selectedRing, 92)
            : (
              <div style={{ fontSize: '50px', width: '92px', height: '92px', borderRadius: '50%', background: '#161616', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {user.avatar || '😎'}
              </div>
            )}
        </div>

        <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '900', color: user.is_pro ? '#fbbf24' : '#fff' }}>
          @{user.handle}
        </h2>

        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#888888', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span>{user.institute || user.school || 'Kapil Institute'}</span>
          <span>•</span>
          <span style={{ color: '#d4d4d8', fontWeight: '700' }}>{user.stream || '11th Medical'}</span>
          <span>•</span>
          <span style={{ color: '#a1a1aa', fontWeight: '600' }}>📍 {user.coaching_hub || user.hub || 'Ajit Road Hub'}</span>
        </p>

        {/* Bio */}
        <p style={{ color: '#a1a1aa', fontSize: '13.5px', margin: '0 0 10px 0', lineHeight: '1.4' }}>
          {user.bio || `${user.stream || '11th Medical'} student at ${user.institute || 'Kapil Institute'}`}
        </p>

        {/* Small, Elegant "Edit Profile" Text Link Directly Under Bio */}
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
              color: '#a1a1aa',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              padding: '4px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '16px'
            }}
          >
            <span>✏️</span> Edit Profile
          </button>
        )}
      </div>

      {/* 2. Campus Social Stats Matrix */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '0 0 20px 0', flexWrap: 'wrap' }}>
        <div style={{ background: '#141414', border: '1px solid #222222', padding: '6px 14px', borderRadius: '16px', color: '#ffffff', fontWeight: '700', fontSize: '12.5px' }}>
          🔥 {user.total_votes || 0} Flames
        </div>
        
        {/* Clickable Clean Friends Count Display */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFriendsModal(true)}
          style={{
            background: '#141414',
            border: '1px solid #222222',
            padding: '6px 14px',
            borderRadius: '16px',
            color: '#ffffff',
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
          <span style={{ fontSize: '10px', color: '#71717a' }}>▼</span>
        </motion.div>

        <div style={{ background: '#141414', border: '1px solid #222222', padding: '6px 14px', borderRadius: '16px', color: '#ffffff', fontWeight: '700', fontSize: '12.5px' }}>
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
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
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
                background: '#121214',
                border: '1px solid #27272a',
                borderRadius: '24px',
                padding: '20px',
                width: '100%',
                maxWidth: '380px',
                maxHeight: '75vh',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#ffffff' }}>
                    Friends
                  </h3>
                  <span style={{ fontSize: '12px', color: '#71717a' }}>
                    {acceptedFriends.length} {acceptedFriends.length === 1 ? 'Classmate' : 'Classmates'}
                  </span>
                </div>
                <button
                  onClick={() => setShowFriendsModal(false)}
                  style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    color: '#a1a1aa',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              </div>

              {acceptedFriends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#71717a' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13.5px' }}>
                    You haven't added any classmates yet.
                  </p>
                  <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
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
                        background: '#18181b',
                        border: '1px solid #27272a',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {renderProfilePic
                          ? renderProfilePic(f.profile_pic, f.avatar, f.is_pro, f.selected_ring || f.ring, 40)
                          : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {f.avatar || '😎'}
                            </div>
                          )}
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: f.is_pro ? '#fbbf24' : '#ffffff', display: 'block' }}>
                            @{f.handle}
                          </span>
                          <span style={{ fontSize: '11px', color: '#71717a' }}>
                            Class {f.grade || '11'}
                          </span>
                        </div>
                      </div>

                      <span style={{ fontSize: '11px', color: '#ff8800', fontWeight: '800' }}>
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

      {/* 4. AURA RINGS (GATED STRICTLY TO GOD MODE SUBSCRIBERS + VERTICAL LIST) */}
      {user?.is_pro && (
        <div
          style={{
            background: '#111111',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            borderRadius: '20px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>💍</span>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#fbbf24' }}>
                  Aura Ring Equipment
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#71717a', display: 'block', marginTop: '2px' }}>
                God Mode VIP: Pick your halo ring for your profile & feed
              </span>
            </div>
            {ringSavedToast && (
              <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: '800' }}>
                ✓ Equipped!
              </span>
            )}
          </div>

          {/* Clean Vertical Ring List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {AURA_OPTIONS.map((r) => {
              const isSelected = selectedRing === r.id;
              return (
                <motion.button
                  key={r.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  disabled={isSavingRing}
                  onClick={() => handleRingSelect(r.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '14px',
                    border: isSelected ? `2px solid ${r.color}` : '1px solid #27272a',
                    background: isSelected ? 'rgba(255, 255, 255, 0.06)' : '#161616',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Visual Ring Indicator with Glow */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: `3px solid ${r.color}`,
                      boxShadow: r.id !== 'none' ? `0 0 10px ${r.color}66` : 'none',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }} />

                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: isSelected ? '#ffffff' : '#e4e4e7', display: 'block' }}>
                        {r.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#71717a' }}>
                        {r.desc}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span style={{
                      color: r.color,
                      fontWeight: '900',
                      fontSize: '13px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '8px'
                    }}>
                      ✓ Active
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. MINIMALIST INVITE PASS */}
      <div
        style={{
          background: '#121214',
          borderRadius: '18px',
          padding: '14px 16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '16px',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px' }}>🎟️</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>
              Invite Pass
            </span>
          </div>
          <span style={{ fontSize: '10.5px', background: 'rgba(255, 255, 255, 0.06)', color: '#a1a1aa', padding: '2px 8px', borderRadius: '6px', fontWeight: '600' }}>
            3 Invites = 1 Reveal
          </span>
        </div>

        <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 10px 0', lineHeight: '1.4', fontWeight: '500' }}>
          Your code unlocks secret voter identities when friends join.
        </p>

        {/* Unique Code Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#161618',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div>
            <span style={{ fontSize: '9px', color: '#71717a', fontWeight: '600', textTransform: 'uppercase', display: 'block', letterSpacing: '0.04em' }}>
              Your Code
            </span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', letterSpacing: '0.02em' }}>
              @{my_invite_code}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={copyInviteToClipboard}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: copySuccess ? 'rgba(16, 185, 129, 0.15)' : '#202024',
                color: copySuccess ? '#34d399' : '#ffffff',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {copySuccess ? '✓ Copied' : 'Copy'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* 6. EDIT PROFILE MODAL / DRAWER */}
      {isEditing && (
        <div
          style={{
            background: '#111111',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid #222222',
            textAlign: 'left',
            marginBottom: '20px'
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '900', color: '#fff' }}>Edit Profile</h3>

          {/* Profile Picture Upload */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#888', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
              Profile Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ fontSize: '12px', color: '#888' }}
            />
          </div>

          {/* Bio Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#888', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
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
                border: '1px solid #333',
                background: '#181818',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Coaching Institute Picker */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: '#888', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
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
            <div style={{ marginTop: '5px', fontSize: '11px', color: '#ff7700', fontWeight: '700' }}>
              📍 Hub: {editHub || findHubForInstitute(editInstitute)}
            </div>
          </div>

          {/* Stream Selection Pills (11th Medical, 11th Non-Med, 12th Commerce, Dropper) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
              Batch / Stream
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                gap: '8px',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
              className="flex flex-nowrap overflow-x-auto hide-scrollbar"
            >
              {['11th Medical', '11th Non-Med', '12th Commerce', 'Dropper'].map((s) => {
                const isSelected = editStream === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(8);
                      setEditStream(s);
                      setEditGrade(s.includes('12') ? '12' : s.includes('drop') ? 'dropper' : '11');
                    }}
                    style={{
                      flexShrink: 0,
                      padding: '8px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid #ffffff' : '1px solid #262626',
                      background: isSelected ? '#262626' : '#141416',
                      color: isSelected ? '#ffffff' : '#a1a1aa',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {s}
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
                background: '#ffffff',
                color: '#000000',
                fontWeight: '900',
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
                border: '1px solid #333',
                background: '#181818',
                color: '#fff',
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
    </div>
  );
}
