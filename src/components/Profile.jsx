import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import FriendSearch from './FriendSearch';

const AURA_OPTIONS = [
  { id: 'none', label: 'None', color: '#666' },
  { id: 'gold', label: 'Gold', color: '#fbbf24' },
  { id: 'neon', label: 'Neon Blue', color: '#38bdf8' },
  { id: 'ruby', label: 'Ruby Red', color: '#f43f5e' },
  { id: 'purple', label: 'Purple', color: '#a855f7' },
  { id: 'emerald', label: 'Emerald', color: '#10b981' }
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
  const [editProfilePic, setEditProfilePic] = useState(user?.profile_pic || '');
  const [selectedRing, setSelectedRing] = useState(user?.selected_ring || user?.ring || 'gold');
  const [ringSavedToast, setRingSavedToast] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.selected_ring || user?.ring) {
      setSelectedRing(user.selected_ring || user.ring);
    }
  }, [user?.selected_ring, user?.ring]);

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

  const handleRingSelect = async (ringId) => {
    setSelectedRing(ringId);
    if (onUpdateUser) {
      onUpdateUser({ ...user, ring: ringId, selected_ring: ringId });
    }
    setRingSavedToast(true);
    setTimeout(() => setRingSavedToast(false), 2000);

    try {
      await fetch(`${API}/user/ring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, selected_ring: ringId })
      });
    } catch (err) {
      console.error('Save ring error:', err);
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
        profile_pic: editProfilePic
      };

      if (onUpdateUser) onUpdateUser(updatedUser);

      await fetch(`${API}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: editBio,
          avatar: editAvatar,
          ring: selectedRing,
          grade: editGrade,
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
    <div style={{ padding: '16px 16px 80px 16px', textAlign: 'center', maxWidth: '440px', margin: '0 auto', boxSizing: 'border-box' }}>
      {/* 1. Header Profile Display */}
      <div style={{ marginBottom: '12px' }}>
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

      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#888888', fontWeight: '600' }}>
        St. Kabir Convent School • Class {user.grade || '11'}
      </p>

      {/* 2. Campus Social Stats Matrix (Flat & Minimalist) */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '0 0 20px 0', flexWrap: 'wrap' }}>
        <div style={{ background: '#141414', border: '1px solid #222222', padding: '6px 14px', borderRadius: '16px', color: '#ffffff', fontWeight: '700', fontSize: '12.5px' }}>
          🔥 {user.total_votes || 0} Flames
        </div>
        <div style={{ background: '#141414', border: '1px solid #222222', padding: '6px 14px', borderRadius: '16px', color: '#ffffff', fontWeight: '700', fontSize: '12.5px' }}>
          👥 {acceptedFriends.length} Friends
        </div>
        <div style={{ background: '#141414', border: '1px solid #222222', padding: '6px 14px', borderRadius: '16px', color: '#ffffff', fontWeight: '700', fontSize: '12.5px' }}>
          ⚡ {Math.round((user.total_votes || 0) * 12 + acceptedFriends.length * 25)} Aura
        </div>
      </div>

      {/* 3. RELOCATED AURA RING SELECTOR (PERSISTENT IN PROFILE TAB) */}
      <div
        style={{
          background: '#111111',
          border: '1px solid #222222',
          borderRadius: '20px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '13.5px', fontWeight: '900', color: '#fff', display: 'block' }}>
              💍 Profile Aura Ring
            </span>
            <span style={{ fontSize: '11px', color: '#777', display: 'block' }}>
              Equip an aura ring for your profile & feed
            </span>
          </div>
          {ringSavedToast && (
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '800' }}>
              ✓ Saved!
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {AURA_OPTIONS.map((r) => {
            const isSelected = selectedRing === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRingSelect(r.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: isSelected ? `2px solid ${r.color}` : '1px solid #262626',
                  background: isSelected ? '#1c1c1c' : '#141414',
                  color: isSelected ? '#ffffff' : '#888888',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                <span>{r.label}</span>
                {isSelected && <span style={{ color: r.color, fontSize: '11px' }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. VIRAL INVITE PASS (CLEAN FLAT MINIMALIST) */}
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

        {/* Prominent WhatsApp Share Button */}
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

      {/* 5. EDIT MODE MODAL / CARD */}
      {isEditing ? (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ fontSize: '12px', color: '#888' }}
              />
            </div>
          </div>

          {/* Bio Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#888', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
              Bio
            </label>
            <input
              type="text"
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="Add a bio..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #262626',
                background: '#161616',
                color: '#fff',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Class / Grade Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#888', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
              Class / Grade
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['9', '10', '11', '12'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setEditGrade(g)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '10px',
                    border: editGrade === g ? '2px solid #ffffff' : '1px solid #262626',
                    background: editGrade === g ? '#222' : '#141414',
                    color: editGrade === g ? '#fff' : '#888',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cl-{g}
                </button>
              ))}
            </div>
          </div>

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
      ) : (
        <div>
          <p style={{ color: '#888888', fontSize: '14px', margin: '0 0 20px 0' }}>
            {user.bio || `Class ${user.grade || '11'} student at St. Kabir Convent School`}
          </p>

          {/* 6. FRIENDS LIST & HANDLES (CLEAN FLAT SURFACES) */}
          <div style={{
            textAlign: 'left',
            marginBottom: '20px',
            background: '#111111',
            borderRadius: '20px',
            padding: '18px',
            border: '1px solid #222222'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#fff' }}>
                  👥 Friends ({acceptedFriends.length})
                </h4>
                <span style={{ fontSize: '11px', color: '#777777' }}>
                  Accepted classmates
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#888888', background: '#1c1c1c', padding: '4px 10px', borderRadius: '10px', fontWeight: '700' }}>
                St. Kabir
              </span>
            </div>

            {acceptedFriends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 8px', color: '#777777' }}>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  No accepted friends yet. Use search below to add your classmates!
                </p>
              </div>
            ) : (
              <div>
                {/* Horizontal Friends Avatars */}
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '10px' }}>
                  {acceptedFriends.map(f => (
                    <motion.div
                      key={f.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onViewPublicProfile && onViewPublicProfile(f.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '70px',
                        maxWidth: '76px',
                        cursor: 'pointer'
                      }}
                    >
                      {renderProfilePic
                        ? renderProfilePic(f.profile_pic, f.avatar, f.is_pro, f.selected_ring || f.ring, 48)
                        : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {f.avatar || '😎'}
                          </div>
                        )}
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#fff', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                        @{f.handle}
                      </span>
                      <span style={{ fontSize: '10px', color: '#888', fontWeight: '700' }}>
                        Cl-{f.grade || '11'}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Handles List Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '8px', borderTop: '1px solid #1c1c1c' }}>
                  {acceptedFriends.map(f => (
                    <span
                      key={f.id}
                      onClick={() => onViewPublicProfile && onViewPublicProfile(f.id)}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: f.is_pro ? '#fbbf24' : '#ffffff',
                        background: '#161616',
                        padding: '4px 10px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: '1px solid #222222'
                      }}
                    >
                      @{f.handle}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 7. Classmate Friend Search in Profile */}
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <FriendSearch
              currentUser={user}
              API={API}
              supabase={supabase}
              onFriendAdded={() => onRefreshFriends && onRefreshFriends()}
            />
          </div>

          {/* 8. Action Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
            <button
              style={{ padding: '13px', borderRadius: '14px', border: '1px solid #2a2a2a', background: '#161616', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
              onClick={() => {
                setEditBio(user.bio || '');
                setEditAvatar(user.avatar || '');
                setEditGrade(user.grade ? user.grade.toString() : '11');
                setEditProfilePic(user.profile_pic || '');
                setIsEditing(true);
              }}
            >
              Edit Profile
            </button>

            <button
              style={{ padding: '13px', borderRadius: '14px', background: '#181818', border: '1px solid #262626', color: '#cbd5e1', fontWeight: '800', cursor: 'pointer' }}
              onClick={onLogout}
            >
              Sign Out
            </button>

            <button
              style={{ padding: '12px', borderRadius: '14px', border: 'none', background: 'transparent', color: '#ef4444', fontWeight: '800', fontSize: '13px', cursor: 'pointer', marginTop: '6px' }}
              onClick={onDeleteAccount}
            >
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
