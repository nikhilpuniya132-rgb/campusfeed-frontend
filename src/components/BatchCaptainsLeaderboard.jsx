import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWhatsAppShareUrl, copyReferralLink, getReferralLink } from '../utils/referral';
import HamsterLoader from './HamsterLoader';

export default function BatchCaptainsLeaderboard({ user, API, onBack, renderProfilePic }) {
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [copyToast, setCopyToast] = useState(false);
  const [applyToast, setApplyToast] = useState(false);
  const [hasApplied, setHasApplied] = useState(() => {
    return localStorage.getItem('applied_batch_captain') === 'true';
  });

  useEffect(() => {
    fetchCaptains();
  }, []);

  const fetchCaptains = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/referrals/leaderboard`);
      const data = await res.json();
      if (data.leaderboard) {
        // Strict 25+ recruits filter: do not display users with 0, 1, or 3 recruits
        const verified = data.leaderboard.filter(c => ((c.invites || c.recruits || 0) >= 25 || c.batch_captain_admin_override));
        setCaptains(verified);
      }
    } catch (err) {
      console.error('Failed to load Batch Captains:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = getWhatsAppShareUrl(user);
    window.open(waUrl, '_blank');
  };

  const handleCopy = async () => {
    const res = await copyReferralLink(user);
    if (res.success) {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  // Filter captains by stream/grade
  const filteredCaptains = captains.filter(c => {
    if (gradeFilter === 'all') return true;
    const stream = (c.stream || '').toLowerCase();
    const grade = (c.grade || '').toString().toLowerCase();
    const target = gradeFilter.toLowerCase();
    if (target.includes('medical') && !target.includes('non')) {
      return stream.includes('med') && !stream.includes('non');
    }
    if (target.includes('non-med') || target.includes('nonmed')) {
      return stream.includes('non');
    }
    if (target.includes('board') || target.includes('12')) {
      return stream.includes('12') || grade === '12';
    }
    if (target.includes('dropper')) {
      return stream.includes('drop') || grade === 'dropper';
    }
    return stream.includes(target) || grade === target;
  });

  const top3 = filteredCaptains.slice(0, 3);
  const remaining = filteredCaptains.slice(3);

  // Find user's rank & non-monetary Feed Drops
  const userRankIndex = captains.findIndex(c => c.id === user?.id || c.handle === user?.handle);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : '—';
  const userInvites = user?.invites || 0;
  const isAdminOverride = Boolean(user?.batch_captain_admin_override);
  const isEliteCaptain = Boolean(user?.is_batch_captain || isAdminOverride || userInvites >= 25);
  const progressPercent = Math.min(100, Math.round((userInvites / 25) * 100));
  const userDrops = user?.feed_drops !== undefined && user?.feed_drops !== null ? user.feed_drops : (userInvites * 50);

  return (
    <div style={{ padding: '16px 16px 80px 16px', maxWidth: '440px', margin: '0 auto', boxSizing: 'border-box', background: '#ffffff', minHeight: '100%' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          type="button"
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            color: '#374151',
            padding: '8px 14px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>←</span>
          <span>Back</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#000000', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <span>👑</span>
            <span>Batch Captains</span>
          </h2>
          <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>
            💧 Feed Drops Economy
          </span>
        </div>

        <div style={{ width: '60px' }}></div>
      </div>

      {/* Toast Notification for Batch Captain Application Requirement */}
      <AnimatePresence>
        {applyToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -16, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              zIndex: 9999,
              background: '#000000',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: '800',
              boxShadow: '0 12px 30px rgba(0,0,0,0.22)',
              maxWidth: '90%',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>👑</span>
            <span>You must invite 25 friends to become a Batch Captain.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User's Captain Status Widget */}
      <div
        style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '20px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: 'none'
        }}
      >
        {!hasApplied && !isEliteCaptain && userInvites < 25 ? (
          /* Initial State: Hide progress bar and tracking details. Display single clear Apply button */
          <div style={{ textAlign: 'center', padding: '6px 2px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👑</div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Batch Captain Program
            </div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#000000', margin: '4px 0 6px 0' }}>
              Lead Your Coaching Batch
            </div>
            <p style={{ fontSize: '12.5px', color: '#6b7280', margin: '0 0 16px 0', lineHeight: '1.45' }}>
              Become an official Batch Captain for your coaching institute, unlock moderator privileges, and earn exclusive recognition in Legends.
            </p>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => {
                setApplyToast(true);
                setHasApplied(true);
                localStorage.setItem('applied_batch_captain', 'true');
                setTimeout(() => setApplyToast(false), 4000);
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid #000000',
                background: '#000000',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'none'
              }}
            >
              <span>👑</span>
              <span>Apply for Batch Captain</span>
            </motion.button>
          </div>
        ) : (
          /* Post-Click State: Revealed 0/25 Progress Tracker & Share UI */
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Your Captain Status
                </div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#000000', marginTop: '2px' }}>
                  Rank #{userRank}{' '}
                  <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '700' }}>
                    ({userInvites} verified)
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '5px 10px', borderRadius: '12px', color: '#1d4ed8', fontWeight: '900', fontSize: '13px' }}>
                  <span>💧</span>
                  <span>{userDrops} Drops</span>
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>
                  +50 per verified recruit
                </div>
              </div>
            </div>

            {/* Grand Status Progress Bar */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                padding: '12px 14px',
                marginBottom: '12px',
                boxShadow: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#000000', letterSpacing: '-0.01em' }}>
                  {isEliteCaptain
                    ? '👑 Elite Status: UNLOCKED (Batch Captain / Moderator)'
                    : `Elite Status: ${userInvites} / 25 Active Recruits to unlock Batch Captain.`}
                </span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>
                  {progressPercent}%
                </span>
              </div>

              {/* Grand Progress Bar Track */}
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  background: '#e5e7eb',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: '#000000',
                    borderRadius: '999px'
                  }}
                />
              </div>

              {/* Explanatory Anti-Cheat & Admin Override Subtext */}
              <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#6b7280', lineHeight: '1.4' }}>
                {isAdminOverride ? (
                  <span style={{ color: '#000000', fontWeight: '800' }}>
                    ⚡ Admin Override Granted: Full Moderator privileges enabled.
                  </span>
                ) : isEliteCaptain ? (
                  <span style={{ color: '#059669', fontWeight: '700' }}>
                    ✓ Official Batch Captain & Moderator unlocked with 25 verified active recruits!
                  </span>
                ) : (
                  <span>
                    🛡️ Active recruits must complete Google Auth and vote in 3+ polls to qualify.
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleWhatsAppShare}
                type="button"
                aria-label="Share Link"
                title="Share Invite Link"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  background: '#000000',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                  flexShrink: 0
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                type="button"
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  background: copyToast ? '#f0fdf4' : '#000000',
                  color: copyToast ? '#166534' : '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background 0.2s',
                  boxShadow: 'none'
                }}
              >
                <span>{copyToast ? '✓ Copied' : '🔗 Copy Link'}</span>
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Category Switcher Tabs (active: bg-black text-white; inactive: bg-gray-100 text-gray-600) */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
        {[
          { id: '11th Medical', label: '11th Medical' },
          { id: '11th Non-Med', label: '11th Non-Med' },
          { id: '12th Board', label: '12th Board' },
          { id: 'NEET Droppers', label: 'NEET Droppers' },
          { id: 'all', label: 'All Bathinda' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              if (window.navigator?.vibrate) window.navigator.vibrate(8);
              setGradeFilter(tab.id);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '12px',
              border: gradeFilter === tab.id ? '1px solid #000000' : '1px solid #e5e7eb',
              fontSize: '11.5px',
              fontWeight: '800',
              cursor: 'pointer',
              background: gradeFilter === tab.id ? '#000000' : '#f3f4f6',
              color: gradeFilter === tab.id ? '#ffffff' : '#4b5563',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <HamsterLoader message="Verifying Batch Captains..." />
        </div>
      ) : filteredCaptains.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>👑</div>
          <p style={{ margin: 0, fontSize: '14.5px', fontWeight: '800', color: '#000000', lineHeight: '1.4' }}>
            No Batch Captains yet. Be the first to invite 25 students and claim the crown.
          </p>
          <p style={{ margin: '8px 0 16px 0', fontSize: '12px' }}>Share your personal invite link to build your recruits!</p>
          <button
            onClick={handleWhatsAppShare}
            aria-label="Share Link"
            title="Share Invite Link"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              background: '#000000',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'none'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      ) : (
        <div>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '10px', marginBottom: '24px', padding: '10px 0' }}>
              {/* Rank 2 */}
              {top3[1] && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '100px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '2px' }}>🥈</div>
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>
                    {top3[1].avatar || '🔥'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', textAlign: 'center' }}>
                    @{top3[1].handle}
                  </div>
                  <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '800' }}>
                    💧 {top3[1].feed_drops !== undefined ? top3[1].feed_drops : (top3[1].invites || 0) * 50}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>
                    {top3[1].invites || 0} recruits
                  </div>
                  <div style={{ width: '100%', height: '60px', background: '#f3f4f6', borderRadius: '12px 12px 0 0', marginTop: '8px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#374151', fontSize: '16px' }}>
                    2
                  </div>
                </div>
              )}

              {/* Rank 1 (Tallest) */}
              {top3[0] && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.2, maxWidth: '115px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '2px' }}>👑</div>
                  <div style={{ fontSize: '34px', marginBottom: '4px' }}>
                    {top3[0].avatar || '😎'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#000000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', textAlign: 'center' }}>
                    @{top3[0].handle}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#2563eb', fontWeight: '900' }}>
                    💧 {top3[0].feed_drops !== undefined ? top3[0].feed_drops : (top3[0].invites || 0) * 50}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#374151', fontWeight: '700' }}>
                    {top3[0].invites || 0} recruits
                  </div>
                  <div style={{ width: '100%', height: '84px', background: '#e5e7eb', borderRadius: '14px 14px 0 0', marginTop: '8px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#000000', fontSize: '20px' }}>
                    1
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {top3[2] && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: '100px' }}>
                  <div style={{ fontSize: '20px', marginBottom: '2px' }}>🥉</div>
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>
                    {top3[2].avatar || '✨'}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#000000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', textAlign: 'center' }}>
                    @{top3[2].handle}
                  </div>
                  <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '800' }}>
                    💧 {top3[2].feed_drops !== undefined ? top3[2].feed_drops : (top3[2].invites || 0) * 50}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: '600' }}>
                    {top3[2].invites || 0} recruits
                  </div>
                  <div style={{ width: '100%', height: '46px', background: '#f3f4f6', borderRadius: '12px 12px 0 0', marginTop: '8px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#374151', fontSize: '16px' }}>
                    3
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ranks 4+ List */}
          {remaining.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {remaining.map((captain, idx) => {
                const rankNum = idx + 4;
                const isCurrent = captain.id === user?.id || captain.handle === user?.handle;
                const captainDrops = captain.feed_drops !== undefined && captain.feed_drops !== null ? captain.feed_drops : (captain.invites || 0) * 50;

                return (
                  <div
                    key={captain.id || idx}
                    style={{
                      background: isCurrent ? '#eff6ff' : '#f9fafb',
                      border: isCurrent ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#6b7280', width: '22px', textAlign: 'center' }}>
                        #{rankNum}
                      </span>

                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid #e5e7eb' }}>
                        {captain.avatar || '😎'}
                      </div>

                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '800', color: isCurrent ? '#1d4ed8' : '#000000', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>@{captain.handle}</span>
                          {captain.is_pro && <span style={{ fontSize: '11px' }}>👑</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Class {captain.grade || '11'}</span>
                          <span>•</span>
                          <span>📍 {captain.city || 'Bathinda'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <span>💧</span>
                        <span>{captainDrops}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', letterSpacing: '0.02em' }}>
                        {captain.invites || 0} recruits
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Regulatory Notice */}
          <div style={{ marginTop: '24px', padding: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '14px', fontSize: '11px', color: '#6b7280', lineHeight: '1.45', textAlign: 'center' }}>
            🏛️ <strong>Notice:</strong> Feed Drops (💧) are non-monetary, closed-loop virtual entertainment tokens with zero cash value, strictly conforming to digital loyalty units. Drops cannot be purchased, transferred, or redeemed for fiat currency.
          </div>
        </div>
      )}
    </div>
  );
}
