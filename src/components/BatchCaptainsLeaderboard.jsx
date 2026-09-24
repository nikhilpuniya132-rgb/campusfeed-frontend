import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getWhatsAppShareUrl, copyReferralLink, getReferralLink } from '../utils/referral';
import HamsterLoader from './HamsterLoader';

export default function BatchCaptainsLeaderboard({ user, API, onBack, renderProfilePic }) {
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState('all');
  const [copyToast, setCopyToast] = useState(false);

  useEffect(() => {
    fetchCaptains();
  }, []);

  const fetchCaptains = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/referrals/leaderboard`);
      const data = await res.json();
      if (data.leaderboard) {
        setCaptains(data.leaderboard);
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
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#25D366', '#128C7E', '#38bdf8', '#fbbf24']
      });
    } catch (_) {}
  };

  const handleCopy = async () => {
    const res = await copyReferralLink(user);
    if (res.success) {
      setCopyToast(true);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#38bdf8', '#fbbf24', '#ff5500']
        });
      } catch (_) {}
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
    <div style={{ padding: '16px 16px 80px 16px', maxWidth: '440px', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          type="button"
          style={{
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#a1a1aa',
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
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <span>👑</span>
            <span>Batch Captains</span>
          </h2>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700' }}>
            💧 Non-Monetary Feed Drops Economy
          </span>
        </div>

        <div style={{ width: '60px' }}></div>
      </div>

      {/* User's Captain Status Widget */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(251, 191, 36, 0.08))',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '20px',
          padding: '16px',
          marginBottom: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Your Captain Status
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', marginTop: '2px' }}>
              Rank #{userRank}{' '}
              <span style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: '700' }}>
                ({userInvites} verified)
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '5px 10px', borderRadius: '12px', color: '#38bdf8', fontWeight: '900', fontSize: '13px' }}>
              <span>💧</span>
              <span>{userDrops} Drops</span>
            </div>
            <div style={{ fontSize: '10px', color: '#71717a', marginTop: '3px' }}>
              +50 per verified recruit
            </div>
          </div>
        </div>

        {/* Grand Status Progress Bar: Elite Status: 0 / 25 Active Recruits to unlock Batch Captain. */}
        <div
          style={{
            background: 'rgba(15, 15, 18, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '12px 14px',
            marginBottom: '12px',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '900', color: isEliteCaptain ? '#fbbf24' : '#ffffff', letterSpacing: '-0.01em' }}>
              {isEliteCaptain
                ? '👑 Elite Status: UNLOCKED (Batch Captain / Moderator)'
                : `Elite Status: ${userInvites} / 25 Active Recruits to unlock Batch Captain.`}
            </span>
            <span style={{ fontSize: '11px', fontWeight: '800', color: isEliteCaptain ? '#4ade80' : '#ff7700' }}>
              {progressPercent}%
            </span>
          </div>

          {/* Grand Progress Bar Track */}
          <div
            style={{
              width: '100%',
              height: '10px',
              background: '#18181b',
              borderRadius: '999px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              position: 'relative'
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: isEliteCaptain
                  ? 'linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #fbbf24 100%)'
                  : 'linear-gradient(90deg, #ff5500 0%, #fbbf24 100%)',
                boxShadow: isEliteCaptain
                  ? '0 0 14px rgba(251, 191, 36, 0.6)'
                  : '0 0 10px rgba(255, 85, 0, 0.5)',
                borderRadius: '999px'
              }}
            />
          </div>

          {/* Explanatory Anti-Cheat & Admin Override Subtext */}
          <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#71717a', lineHeight: '1.4' }}>
            {isAdminOverride ? (
              <span style={{ color: '#fbbf24', fontWeight: '800' }}>
                ⚡ Admin Override Granted: Full Moderator privileges enabled.
              </span>
            ) : isEliteCaptain ? (
              <span style={{ color: '#4ade80', fontWeight: '700' }}>
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleWhatsAppShare}
            type="button"
            style={{
              flex: 1.5,
              padding: '11px 14px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 4px 16px rgba(37, 211, 102, 0.3)'
            }}
          >
            <span style={{ fontSize: '14px' }}>💬</span>
            <span>Invite on WhatsApp</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            type="button"
            style={{
              flex: 1,
              padding: '11px 14px',
              borderRadius: '14px',
              border: '1px solid #27272a',
              background: copyToast ? '#10b981' : '#18181b',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.2s'
            }}
          >
            <span>{copyToast ? '✓' : '🔗'}</span>
            <span>{copyToast ? 'Copied!' : 'Copy Link'}</span>
          </motion.button>
        </div>
      </div>

      {/* Coaching Stream / Category Switcher Tabs */}
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
              border: gradeFilter === tab.id ? '1px solid #ff5500' : '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '11.5px',
              fontWeight: '800',
              cursor: 'pointer',
              background: gradeFilter === tab.id ? '#ff5500' : '#141416',
              color: gradeFilter === tab.id ? '#ffffff' : '#71717a',
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
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#71717a' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>👑</div>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>No captains yet in this class.</p>
          <p style={{ margin: '6px 0 16px 0', fontSize: '12px' }}>Be the first captain by sharing your WhatsApp link!</p>
          <button
            onClick={handleWhatsAppShare}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              background: '#25D366',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            Become Batch Captain
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
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', textAlign: 'center' }}>
                    @{top3[1].handle}
                  </div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800' }}>
                    💧 {top3[1].feed_drops !== undefined ? top3[1].feed_drops : (top3[1].invites || 0) * 50}
                  </div>
                  <div style={{ fontSize: '10px', color: '#71717a', fontWeight: '600' }}>
                    {top3[1].invites || 0} recruits
                  </div>
                  <div style={{ width: '100%', height: '60px', background: 'linear-gradient(180deg, #3f3f46, #18181b)', borderRadius: '12px 12px 0 0', marginTop: '8px', border: '1px solid #52525b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#d4d4d8', fontSize: '16px' }}>
                    2
                  </div>
                </div>
              )}

              {/* Rank 1 (Tallest) */}
              {top3[0] && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.2, maxWidth: '115px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '2px', filter: 'drop-shadow(0 0 8px #fbbf24)' }}>👑</div>
                  <div style={{ fontSize: '34px', marginBottom: '4px' }}>
                    {top3[0].avatar || '😎'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#fbbf24', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', textAlign: 'center' }}>
                    @{top3[0].handle}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#38bdf8', fontWeight: '900' }}>
                    💧 {top3[0].feed_drops !== undefined ? top3[0].feed_drops : (top3[0].invites || 0) * 50}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#fbbf24', fontWeight: '700' }}>
                    {top3[0].invites || 0} recruits
                  </div>
                  <div style={{ width: '100%', height: '84px', background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.4), #18181b)', borderRadius: '14px 14px 0 0', marginTop: '8px', border: '1px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fbbf24', fontSize: '20px', boxShadow: '0 0 20px rgba(251, 191, 36, 0.2)' }}>
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
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', textAlign: 'center' }}>
                    @{top3[2].handle}
                  </div>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800' }}>
                    💧 {top3[2].feed_drops !== undefined ? top3[2].feed_drops : (top3[2].invites || 0) * 50}
                  </div>
                  <div style={{ fontSize: '10px', color: '#71717a', fontWeight: '600' }}>
                    {top3[2].invites || 0} recruits
                  </div>
                  <div style={{ width: '100%', height: '46px', background: 'linear-gradient(180deg, #78350f, #18181b)', borderRadius: '12px 12px 0 0', marginTop: '8px', border: '1px solid #92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#f59e0b', fontSize: '16px' }}>
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
                      background: isCurrent ? 'rgba(56, 189, 248, 0.08)' : '#121214',
                      border: isCurrent ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #27272a',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#71717a', width: '22px', textAlign: 'center' }}>
                        #{rankNum}
                      </span>

                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid #27272a' }}>
                        {captain.avatar || '😎'}
                      </div>

                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: '800', color: isCurrent ? '#38bdf8' : '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>@{captain.handle}</span>
                          {captain.is_pro && <span style={{ fontSize: '11px' }}>👑</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Class {captain.grade || '11'}</span>
                          <span>•</span>
                          <span>📍 {captain.city || 'Bathinda'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                        <span>💧</span>
                        <span>{captainDrops}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#71717a', letterSpacing: '0.02em' }}>
                        {captain.invites || 0} recruits
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* RBI Regulatory Compliance Notice */}
          <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', fontSize: '11px', color: '#71717a', lineHeight: '1.45', textAlign: 'center' }}>
            🏛️ <strong>RBI Regulatory Notice:</strong> Feed Drops (💧) are non-monetary, closed-loop virtual entertainment tokens with zero cash value, strictly conforming to RBI directives on digital loyalty units. Drops cannot be purchased, transferred, or redeemed for fiat currency.
          </div>
        </div>
      )}
    </div>
  );
}
