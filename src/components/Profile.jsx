import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

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
  const [editCity, setEditCity] = useState(user?.city || user?.district || 'Bathinda');
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

  const copyInviteToClipboard = () => {
    const shareText = `Someone from St. Kabir voted for you on CampusFeed! Join to see who: ${inviteLink} (Code: ${my_invite_code})`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText);
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleWhatsAppInvite = () => {
    if (onInviteShare) {
      onInviteShare();
    } else {
      const shareData = {
        title: 'CampusFeed',
        text: `Someone from St. Kabir voted for you! Join to see who. Use code: ${my_invite_code}`,
        url: inviteLink
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => copyInviteToClipboard());
      } else {
        copyInviteToClipboard();
      }
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
      const updatedUser = {
        ...user,
        bio: editBio,
        avatar: editAvatar,
        ring: selectedRing,
        selected_ring: selectedRing,
        grade: editGrade,
        city: editCity,
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
            grade: parseInt(editGrade) || 11,
            city: editCity,
            district: editCity,
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
          grade: editGrade,
          city: editCity,
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
    <div style={{ padding: '16px 16px 80px 16px', maxWidth: '440px', margin: '0 auto', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Top Bar: Settings 3-Dots Menu */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative', marginBottom: '8px' }} ref={settingsMenuRef}>
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
          <span>St. Kabir Convent School</span>
          <span>•</span>
          <span>Class {user.grade || '11'}</span>
          <span>•</span>
          <span style={{ color: '#fbbf24', fontWeight: '700' }}>📍 {user.city || user.district || 'Bathinda'}</span>
        </p>

        {/* Bio */}
        <p style={{ color: '#a1a1aa', fontSize: '13.5px', margin: '0 0 10px 0', lineHeight: '1.4' }}>
          {user.bio || `Class ${user.grade || '11'} student at St. Kabir Convent School`}
        </p>

        {/* Small, Elegant "Edit Profile" Text Link Directly Under Bio */}
        {!isEditing && (
          <button
            onClick={() => {
              setEditBio(user.bio || '');
              setEditAvatar(user.avatar || '');
              setEditGrade(user.grade ? user.grade.toString() : '11');
              setEditCity(user.city || user.district || 'Bathinda');
              setEditProfilePic(user.profile_pic || '');
              setIsEditing(true);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#38bdf8',
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

      {/* 5. VIRAL INVITE PASS */}
      <div
        style={{
          background: '#111111',
          borderRadius: '20px',
          padding: '18px',
          border: '1px solid #222222',
          marginBottom: '20px',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎟️</span>
            <span style={{ fontSize: '13px', fontWeight: '900', color: '#fff', letterSpacing: '0.4px' }}>
              Your Invite Pass
            </span>
          </div>
          <span style={{ fontSize: '11px', background: '#1c1c1c', color: '#888', padding: '3px 8px', borderRadius: '8px', fontWeight: '700' }}>
            3 Invites = 1 Reveal
          </span>
        </div>

        <p style={{ fontSize: '13px', color: '#888888', margin: '0 0 14px 0', lineHeight: '1.4' }}>
          Share your invite code with friends. When they join, you unlock who secretly voted for you.
        </p>

        {/* Unique Code Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#161616',
          padding: '12px 14px',
          borderRadius: '14px',
          border: '1px solid #222222',
          marginBottom: '12px'
        }}>
          <div>
            <span style={{ fontSize: '10px', color: '#777777', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>
              Invite Code
            </span>
            <span style={{ fontSize: '17px', fontWeight: '900', color: '#ffffff', letterSpacing: '0.5px' }}>
              @{my_invite_code}
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={copyInviteToClipboard}
            style={{
              padding: '7px 12px',
              borderRadius: '10px',
              border: '1px solid #333',
              background: copySuccess ? '#10b98122' : '#222222',
              color: copySuccess ? '#10b981' : '#ffffff',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            {copySuccess ? '✓ Copied' : '📋 Copy'}
          </motion.button>
        </div>

        {/* WhatsApp Share Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleWhatsAppInvite}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            border: 'none',
            background: '#25D366',
            color: '#000',
            fontSize: '14px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>📲</span> Invite Friends on WhatsApp
        </motion.button>
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
              placeholder="e.g. St. Kabir Convent • Class 11"
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

          {/* Grade Picker */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#888', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
              Class / Grade
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {['9', '10', '11', '12'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setEditGrade(g)}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    border: editGrade === g ? '2px solid #ffffff' : '1px solid #333',
                    background: editGrade === g ? '#ffffff' : '#181818',
                    color: editGrade === g ? '#000000' : '#888888',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Class {g}
                </button>
              ))}
            </div>
          </div>

          {/* City Picker for Local Sponsorships */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#888', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
              Your Campus City (for Local Deals)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 'Bathinda', label: '📍 Bathinda' },
                { id: 'Ludhiana', label: '📍 Ludhiana' }
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setEditCity(c.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: editCity.toLowerCase() === c.id.toLowerCase() ? '2px solid #ff7700' : '1px solid #333',
                    background: editCity.toLowerCase() === c.id.toLowerCase() ? 'rgba(255, 85, 0, 0.15)' : '#181818',
                    color: editCity.toLowerCase() === c.id.toLowerCase() ? '#ffffff' : '#888888',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {c.label}
                </button>
              ))}
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
