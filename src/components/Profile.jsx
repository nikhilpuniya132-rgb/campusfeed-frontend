import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import FriendSearch from './FriendSearch';

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
  const [editRing, setEditRing] = useState(user?.ring || 'gold');
  const [editGrade, setEditGrade] = useState(user?.grade ? user.grade.toString() : '11');
  const [editProfilePic, setEditProfilePic] = useState(user?.profile_pic || '');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const my_invite_code = (user?.invite_code || user?.handle || 'campus').replace(/^@/, '').trim();
  const inviteLink = 'https://campusfeed-frontend.vercel.app';

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

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const updatedUser = {
        ...user,
        bio: editBio,
        avatar: editAvatar,
        ring: editRing,
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
          ring: editRing,
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
    <div style={{ padding: '20px 16px 80px 16px', textAlign: 'center', maxWidth: '460px', margin: '0 auto' }}>
      {/* 1. Header Profile Display */}
      <div style={{ marginBottom: '14px' }}>
        {renderProfilePic
          ? renderProfilePic(editProfilePic || user.profile_pic, editAvatar || user.avatar, user.is_pro, editRing, 96)
          : (
            <div style={{ fontSize: '54px', width: '96px', height: '96px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.avatar || '😎'}
            </div>
          )}
      </div>

      <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '950', color: user.is_pro ? '#fbbf24' : '#fff' }}>
        @{user.handle}
      </h2>

      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8', fontWeight: '700' }}>
        St. Kabir Convent School • Class {user.grade}
      </p>

      {/* 2. Campus Social Stats Matrix */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '0 0 20px 0', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255, 85, 0, 0.15)', border: '1px solid rgba(255, 85, 0, 0.3)', padding: '6px 14px', borderRadius: '20px', color: '#ff8800', fontWeight: '800', fontSize: '13px' }}>
          🔥 {user.total_votes || 0} Flames
        </div>
        <div style={{ background: 'rgba(0, 240, 255, 0.15)', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '6px 14px', borderRadius: '20px', color: '#00f0ff', fontWeight: '800', fontSize: '13px' }}>
          👥 {acceptedFriends.length} Friends
        </div>
        <div style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', padding: '6px 14px', borderRadius: '20px', color: '#fbbf24', fontWeight: '800', fontSize: '13px' }}>
          ⚡ {Math.round((user.total_votes || 0) * 12 + acceptedFriends.length * 25)} Aura
        </div>
      </div>

      {/* 3. PROMINENT VIRAL INVITE CARD (HIGH VISIBILITY REQUIREMENT) */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        style={{
          background: 'linear-gradient(145deg, rgba(255, 85, 0, 0.14), rgba(0, 240, 255, 0.08))',
          borderRadius: '24px',
          padding: '20px',
          border: '1.5px solid rgba(255, 85, 0, 0.4)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5), 0 0 25px rgba(255, 85, 0, 0.15)',
          marginBottom: '22px',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎟️</span>
            <span style={{ fontSize: '13px', fontWeight: '950', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Your Viral Invite Pass
            </span>
          </div>
          <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '3px 8px', borderRadius: '10px', fontWeight: '800' }}>
            3 Invites = 1 Reveal
          </span>
        </div>

        <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 14px 0', lineHeight: '1.4' }}>
          Share your invite code with friends. When they join, you instantly unlock who secretly voted for you!
        </p>

        {/* Unique Invite Code Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.45)',
          padding: '12px 14px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          marginBottom: '14px'
        }}>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', display: 'block' }}>
              Your Code (my_invite_code)
            </span>
            <span style={{ fontSize: '18px', fontWeight: '950', color: '#00f0ff', letterSpacing: '0.5px' }}>
              @{my_invite_code}
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={copyInviteToClipboard}
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              background: copySuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 240, 255, 0.15)',
              color: copySuccess ? '#10b981' : '#00f0ff',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            {copySuccess ? '✓ Copied!' : '📋 Copy Link'}
          </motion.button>
        </div>

        {/* Prominent WhatsApp Share Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleWhatsAppInvite}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '18px',
            border: 'none',
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            color: '#fff',
            fontSize: '15px',
            fontWeight: '950',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            boxShadow: '0 0 25px rgba(37, 211, 102, 0.5), 0 8px 20px rgba(0,0,0,0.4)',
            letterSpacing: '0.3px'
          }}
        >
          <span style={{ fontSize: '20px' }}>📲</span> Invite Friends on WhatsApp
        </motion.button>
      </motion.div>

      {/* 4. EDIT PROFILE OR DISPLAY PROFILE */}
      {isEditing ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '22px', borderRadius: '26px', border: '1px solid rgba(255,255,255,0.12)', marginBottom: '24px' }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '900', color: '#fff' }}>
            ✏️ Edit Your Profile
          </h3>

          {/* Profile Picture Updater (File Picker & Text URL) */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '800', display: 'block', marginBottom: '8px' }}>
              Profile Picture (File Picker or URL)
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{
                padding: '10px 16px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #ff5500, #ff8800)',
                color: '#fff',
                fontSize: '12.5px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>📷</span> Choose File Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {editProfilePic && (
                <button
                  type="button"
                  onClick={() => setEditProfilePic('')}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Remove Photo
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Or paste direct image URL (https://...)"
              value={editProfilePic}
              onChange={(e) => setEditProfilePic(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Class / Batch Selector (Classes 9, 10, 11, 12) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
              Class / Batch (St. Kabir)
            </label>
            <select
              value={editGrade}
              onChange={(e) => setEditGrade(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: '#18181b',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '800',
                boxSizing: 'border-box'
              }}
            >
              <option value="9">Class 9 (Freshmen)</option>
              <option value="10">Class 10 (Sophomores)</option>
              <option value="11">Class 11 (St. Kabir)</option>
              <option value="12">Class 12 (Seniors)</option>
            </select>
          </div>

          {/* Avatar Emoji */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '800', display: 'block', marginBottom: '6px' }}>Avatar Emoji</label>
            <input
              style={{ width: '64px', padding: '10px', fontSize: '22px', textAlign: 'center', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
              value={editAvatar}
              onChange={(e) => setEditAvatar(e.target.value)}
              maxLength={2}
            />
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '800', display: 'block', marginBottom: '6px' }}>Bio</label>
            <textarea
              style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' }}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="magic-btn"
              style={{ flex: 1, margin: 0 }}
              disabled={isSaving}
              onClick={saveProfile}
            >
              {isSaving ? 'Saving Changes... ⚡' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ padding: '12px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ) : (
        <div>
          <p style={{ color: '#cbd5e1', fontSize: '14px', margin: '0 0 20px 0' }}>
            {user.bio || `Class ${user.grade || '11'} student at St. Kabir Convent School`}
          </p>

          {/* 5. TOTAL FRIEND COUNT & ACCEPTED FRIENDS' HANDLES LIST */}
          <div style={{
            textAlign: 'left',
            marginBottom: '22px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '24px',
            padding: '18px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '950', color: '#fff' }}>
                  👥 Friends ({acceptedFriends.length})
                </h4>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Accepted classmates
                </span>
              </div>

              <span style={{ fontSize: '11px', color: '#ff8800', fontWeight: '900', background: 'rgba(255, 85, 0, 0.15)', padding: '4px 10px', borderRadius: '12px' }}>
                St. Kabir
              </span>
            </div>

            {acceptedFriends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 8px', color: '#94a3b8' }}>
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
                        minWidth: '72px',
                        maxWidth: '80px',
                        cursor: 'pointer'
                      }}
                    >
                      {renderProfilePic
                        ? renderProfilePic(f.profile_pic, f.avatar, f.is_pro, f.ring, 50)
                        : (
                          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {f.avatar || '😎'}
                          </div>
                        )}
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#fff', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                        @{f.handle}
                      </span>
                      <span style={{ fontSize: '10px', color: '#ff8800', fontWeight: '700' }}>
                        Cl-{f.grade || '11'}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Handles List Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {acceptedFriends.map(f => (
                    <span
                      key={f.id}
                      onClick={() => onViewPublicProfile && onViewPublicProfile(f.id)}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: '800',
                        color: f.is_pro ? '#fbbf24' : '#00f0ff',
                        background: 'rgba(255, 255, 255, 0.07)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      @{f.handle}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 6. Classmate Friend Search in Profile */}
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <FriendSearch
              currentUser={user}
              API={API}
              supabase={supabase}
              onFriendAdded={() => onRefreshFriends && onRefreshFriends()}
            />
          </div>

          {/* 7. Action Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '320px', margin: '0 auto' }}>
            <button
              style={{ padding: '14px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
              onClick={() => {
                setEditBio(user.bio || '');
                setEditAvatar(user.avatar || '');
                setEditRing(user.ring || 'gold');
                setEditGrade(user.grade ? user.grade.toString() : '11');
                setEditProfilePic(user.profile_pic || '');
                setIsEditing(true);
              }}
            >
              Edit Profile
            </button>

            <button
              style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255, 85, 0, 0.15)', border: '1px solid rgba(255, 85, 0, 0.3)', color: '#ff8800', fontWeight: '800', cursor: 'pointer' }}
              onClick={onLogout}
            >
              Sign Out
            </button>

            <button
              style={{ padding: '14px', borderRadius: '14px', border: 'none', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: '800', cursor: 'pointer', marginTop: '10px' }}
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
