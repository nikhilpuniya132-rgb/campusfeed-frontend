import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HolographicCard from './HolographicCard';
import CustomPollSubmit from './CustomPollSubmit';
import { copyReferralLink, getWhatsAppShareUrl } from '../utils/referral';

const AURA_RING_OPTIONS = [
  { id: 'gold', label: 'Gold Ring', color: '#d97706', desc: 'Championship gold halo' },
  { id: 'neon', label: 'Electric Blue', color: '#2563eb', desc: 'High-voltage energy pulse' },
  { id: 'ruby', label: 'Ruby Red', color: '#dc2626', desc: 'Crimson flame intensity' },
  { id: 'purple', label: 'Cosmic Purple', color: '#7c3aed', desc: 'Ultraviolet nebula aura' },
  { id: 'emerald', label: 'Emerald Green', color: '#059669', desc: 'Radiant mystic jade glow' },
  { id: 'none', label: 'Minimal / None', color: '#9ca3af', desc: 'Clean standard border' }
];

export default function GodMode({
  user,
  onNavigate = () => {},
  supabase,
  API,
  onUpdateUser,
  renderProfilePic
}) {
  const [selectedRing, setSelectedRing] = useState(
    user?.selected_ring || user?.ring || localStorage.getItem('campus_user_ring') || 'gold'
  );
  const [isSavingRing, setIsSavingRing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [liveInvites, setLiveInvites] = useState(user?.invites || user?.recruits || 0);

  // Fetch real-time count of referred user profiles from Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchInvites = async () => {
      const uId = user?.id;
      const uHandle = user?.handle;
      if (!uId && !uHandle) return;

      try {
        let count = user?.invites || user?.recruits || 0;
        if (supabase) {
          const { count: c } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .or(`referred_by.eq.${uId},referred_by.ilike.${uHandle || ''}`);
          if (c !== null && c !== undefined) {
            count = Math.max(count, c);
          }
        }
        if (isMounted) setLiveInvites(count);
      } catch (err) {
        console.warn('GodMode live invite count query warning:', err);
      }
    };
    fetchInvites();
    return () => { isMounted = false; };
  }, [user?.id, user?.handle, user?.invites, user?.recruits, supabase]);

  const effectiveInvites = Math.max(liveInvites, user?.invites || user?.recruits || 0);

  // Auto-Unlock Milestones:
  // Tier 1: 3 Friends -> 1 Month Access
  const hasMonthAccess = effectiveInvites >= 3 || Boolean(user?.is_pro || user?.is_god_mode);
  // Tier 2: 25 Friends -> Lifetime Legend
  const hasLifetimeLegend = effectiveInvites >= 25 || Boolean(user?.is_god_mode);

  const isPro = hasMonthAccess;
  const isLegend = hasLifetimeLegend;

  // Auto-activate user perks in state & Supabase when milestones are crossed
  useEffect(() => {
    if (!user?.id) return;

    if (effectiveInvites >= 25 && (!user?.is_god_mode || !user?.is_pro)) {
      const updated = { ...user, is_god_mode: true, is_pro: true, invites: effectiveInvites };
      if (onUpdateUser) onUpdateUser(updated);
      if (supabase) {
        supabase.from('users').update({ is_god_mode: true, is_pro: true }).eq('id', user.id).then().catch(console.warn);
      }
    } else if (effectiveInvites >= 3 && !user?.is_pro) {
      const updated = { ...user, is_pro: true, invites: effectiveInvites };
      if (onUpdateUser) onUpdateUser(updated);
      if (supabase) {
        supabase.from('users').update({ is_pro: true }).eq('id', user.id).then().catch(console.warn);
      }
    }
  }, [effectiveInvites, user, onUpdateUser, supabase]);

  useEffect(() => {
    if (user?.selected_ring || user?.ring) {
      setSelectedRing(user.selected_ring || user.ring);
    }
  }, [user?.selected_ring, user?.ring]);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleCopyLink = async () => {
    const res = await copyReferralLink(user);
    if (res.success) {
      showToast('Invite link copied to clipboard! 📋');
    } else {
      showToast('Share: ' + res.link);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = getWhatsAppShareUrl(user);
    window.open(waUrl, '_blank');
  };

  const handleRingSelect = async (ringId) => {
    if (!hasLifetimeLegend) {
      showToast('🔒 Unlock 25 invites to equip Aura Rings!');
      return;
    }

    setSelectedRing(ringId);
    setIsSavingRing(true);
    showToast('Saving Aura Ring to profile...');

    const updatedUser = { ...user, ring: ringId, selected_ring: ringId };
    if (onUpdateUser) onUpdateUser(updatedUser);

    localStorage.setItem('campus_user_ring', ringId);
    localStorage.setItem('selected_ring', ringId);

    if (supabase && user?.id) {
      try {
        await supabase
          .from('users')
          .update({ selected_ring: ringId, ring: ringId })
          .eq('id', user.id);
      } catch (err) {
        console.warn('Supabase ring update error:', err);
      }
    }

    if (API && user?.id) {
      try {
        await fetch(`${API}/user/ring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, selected_ring: ringId })
        });
      } catch (e) {}
    }

    setIsSavingRing(false);
    showToast('Aura Ring saved & equipped! ✨');
  };

  const tier1Progress = Math.min(100, Math.round((effectiveInvites / 3) * 100));
  const tier2Progress = Math.min(100, Math.round((effectiveInvites / 25) * 100));

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '460px',
        margin: '0 auto',
        padding: '16px 14px 80px 14px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#ffffff'
      }}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              background: '#000000',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontWeight: '800',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>✓</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIP Crown Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '20px', width: '100%' }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '20px',
            background: hasLifetimeLegend ? '#fef3c7' : '#f3f4f6',
            border: hasLifetimeLegend ? '1px solid #fde68a' : '1px solid #e5e7eb',
            color: hasLifetimeLegend ? '#92400e' : '#111827',
            fontSize: '11px',
            fontWeight: '900',
            letterSpacing: '0.04em',
            marginBottom: '8px'
          }}
        >
          <span>👑</span> {hasLifetimeLegend ? 'LIFETIME LEGEND' : hasMonthAccess ? '1 MONTH ACCESS' : 'PURE INVITE GOD MODE'}
        </div>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: '900',
            margin: '0 0 6px 0',
            color: '#000000',
            letterSpacing: '-0.5px'
          }}
        >
          {hasLifetimeLegend ? 'Lifetime Legend Active 👑' : hasMonthAccess ? 'God Mode Active (1 Month)' : 'Unlock God Mode With Friends'}
        </h2>
        <p
          style={{
            color: '#6b7280',
            fontSize: '13px',
            lineHeight: '1.45',
            margin: 0,
            padding: '0 8px'
          }}
        >
          {hasLifetimeLegend
            ? 'You are an official School Legend! Unlimited voting, voter reveals, aura rings, and Legends tab placement are permanently active.'
            : hasMonthAccess
            ? '1 Month God Mode active! Reveal voter identities, cast unlimited votes, and create up to 3 custom polls.'
            : 'Zero subscriptions. Unlock premium features purely by inviting your classmates.'}
        </p>
      </motion.div>

      {/* 3D Showcase Card */}
      <div style={{ width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
        <HolographicCard
          title={hasLifetimeLegend ? 'LIFETIME LEGEND' : hasMonthAccess ? '1 MONTH ACCESS' : 'INVITE UNLOCK'}
          subtitle={hasLifetimeLegend ? 'All Perks Permanently Unlocked' : hasMonthAccess ? 'Voter Names Revealed' : 'Invite Friends to Unlock'}
          price={`${effectiveInvites}`}
          period={hasLifetimeLegend ? '/ 25 Invites (Complete)' : '/ 25 Invites'}
          perks={[
            'Instant Voter Reveals (See who voted)',
            'Profile Visitor Tracking',
            'Unlimited Votes (No 30m Cooldowns)',
            'Custom Poll Creation',
            'Exclusive Aura Rings & Legends Tab'
          ]}
          onAction={handleCopyLink}
          actionText={hasLifetimeLegend ? '👑 Lifetime Legend Active' : 'Copy Invite Link ➔'}
        />
      </div>

      {/* Quick Invite Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginBottom: '20px' }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCopyLink}
          type="button"
          style={{
            background: '#ffffff',
            border: '1.5px solid #000000',
            color: '#000000',
            padding: '12px 14px',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>📋</span>
          <span>Copy Invite Link</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleWhatsAppShare}
          type="button"
          style={{
            background: '#25D366',
            border: 'none',
            color: '#ffffff',
            padding: '12px 14px',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>💬</span>
          <span>WhatsApp Share</span>
        </motion.button>
      </div>

      {/* ======================================================== */}
      {/* TWO PROMINENT INVITE-ONLY MILESTONE CARDS (LANDING MATCH) */}
      {/* ======================================================== */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        {/* MILESTONE 1: 3 Invites (1 Month Access) */}
        <div
          style={{
            background: '#ffffff',
            border: hasMonthAccess ? '2px solid #10b981' : '1px solid #e5e7eb',
            borderRadius: '20px',
            padding: '18px 16px',
            boxSizing: 'border-box',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '900',
                background: hasMonthAccess ? '#d1fae5' : '#f3f4f6',
                color: hasMonthAccess ? '#065f46' : '#374151',
                padding: '3px 10px',
                borderRadius: '12px',
                letterSpacing: '0.04em'
              }}
            >
              🔥 3 INVITES MILESTONE
            </span>

            <span style={{ fontSize: '11px', fontWeight: '800', color: hasMonthAccess ? '#059669' : '#6b7280' }}>
              {hasMonthAccess ? '✓ UNLOCKED (1 Month)' : `${effectiveInvites} / 3 Invites`}
            </span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '900', margin: '0 0 4px 0', color: '#000000' }}>
            Invite 3 Friends (1 Month Access)
          </h3>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', margin: '8px 0 12px 0' }}>
            <div
              style={{
                width: `${tier1Progress}%`,
                height: '100%',
                background: hasMonthAccess ? '#10b981' : '#000000',
                transition: 'width 0.4s ease'
              }}
            />
          </div>

          {/* Exact Perks Listed */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#111827' }}>
              <span style={{ color: hasMonthAccess ? '#10b981' : '#000000', fontWeight: '900' }}>✓</span>
              <span><strong>See who voted for you</strong></span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#111827' }}>
              <span style={{ color: hasMonthAccess ? '#10b981' : '#000000', fontWeight: '900' }}>✓</span>
              <span><strong>See who secretly views your profile</strong></span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#111827' }}>
              <span style={{ color: hasMonthAccess ? '#10b981' : '#000000', fontWeight: '900' }}>✓</span>
              <span><strong>Cast unlimited votes</strong></span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#111827' }}>
              <span style={{ color: hasMonthAccess ? '#10b981' : '#000000', fontWeight: '900' }}>✓</span>
              <span><strong>Create up to 3 custom polls</strong></span>
            </li>
          </ul>
        </div>

        {/* MILESTONE 2: 25 Invites (Lifetime Legend) */}
        <div
          style={{
            background: '#000000',
            border: hasLifetimeLegend ? '2px solid #fbbf24' : '1px solid #262626',
            borderRadius: '20px',
            padding: '18px 16px',
            boxSizing: 'border-box',
            color: '#ffffff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '900',
                background: hasLifetimeLegend ? '#fbbf24' : '#262626',
                color: hasLifetimeLegend ? '#000000' : '#fbbf24',
                padding: '3px 10px',
                borderRadius: '12px',
                letterSpacing: '0.04em'
              }}
            >
              👑 25 INVITES MILESTONE
            </span>

            <span style={{ fontSize: '11px', fontWeight: '800', color: hasLifetimeLegend ? '#fbbf24' : '#a3a3a3' }}>
              {hasLifetimeLegend ? '★ LIFETIME LEGEND ACTIVE' : `${effectiveInvites} / 25 Invites`}
            </span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '900', margin: '0 0 4px 0', color: '#ffffff' }}>
            Invite 25 Friends (Lifetime Legend)
          </h3>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: '#262626', borderRadius: '4px', overflow: 'hidden', margin: '8px 0 12px 0' }}>
            <div
              style={{
                width: `${tier2Progress}%`,
                height: '100%',
                background: hasLifetimeLegend ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : '#ffffff',
                transition: 'width 0.4s ease'
              }}
            />
          </div>

          {/* Exact Perks Listed */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ffffff' }}>
              <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
              <span><strong>Get featured in the Legends tab</strong></span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ffffff' }}>
              <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
              <span><strong>Create up to 150 custom polls/month</strong></span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ffffff' }}>
              <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
              <span><strong>Cast unlimited votes</strong></span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ffffff' }}>
              <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
              <span><strong>See all voters and profile visitors</strong></span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ffffff' }}>
              <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
              <span><strong>Unlock preferred aura rings</strong></span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ffffff' }}>
              <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
              <span><strong>Get boosted visibility in the feed</strong></span>
            </li>
          </ul>
        </div>
      </div>

      {/* CUSTOM POLL SUBMISSION (AI-MODERATED) */}
      <CustomPollSubmit
        user={{ ...user, is_god_mode: hasLifetimeLegend, is_pro: hasMonthAccess, invites: effectiveInvites }}
        API={API}
        supabase={supabase}
      />

      {/* AURA RING EQUIPMENT (Interactive for 25-invite Lifetime Legends) */}
      <div
        style={{
          width: '100%',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '20px',
          padding: '18px 16px',
          marginBottom: '16px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>💍</span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#000000' }}>
                Preferred Aura Rings
              </h3>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#6b7280' }}>
              {hasLifetimeLegend
                ? 'Equip your halo ring to stand out on your profile & across school feeds.'
                : '🔒 Unlocks exclusively at 25 Invites (Lifetime Legend).'}
            </p>
          </div>

          <span
            style={{
              background: hasLifetimeLegend ? '#000000' : '#f3f4f6',
              color: hasLifetimeLegend ? '#ffffff' : '#6b7280',
              fontSize: '9.5px',
              fontWeight: '900',
              padding: '3px 8px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}
          >
            {hasLifetimeLegend ? 'UNLOCKED' : `${effectiveInvites}/25 INVITES`}
          </span>
        </div>

        {/* Ring Options Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {AURA_RING_OPTIONS.map((ring) => {
            const isEquipped = selectedRing === ring.id;
            return (
              <motion.button
                key={ring.id}
                whileTap={{ scale: 0.99 }}
                type="button"
                disabled={isSavingRing || !hasLifetimeLegend}
                onClick={() => handleRingSelect(ring.id)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isEquipped ? '2px solid #000000' : '1px solid #e5e7eb',
                  background: isEquipped ? '#ffffff' : '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: hasLifetimeLegend ? 'pointer' : 'not-allowed',
                  opacity: hasLifetimeLegend ? 1 : 0.6,
                  transition: 'all 0.15s ease',
                  boxShadow: isEquipped ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: `3px solid ${ring.color}`,
                      background: ring.id === 'none' ? 'transparent' : `${ring.color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  />

                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#000000' }}>
                      {ring.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {ring.desc}
                    </div>
                  </div>
                </div>

                <div>
                  {isEquipped ? (
                    <span
                      style={{
                        background: '#000000',
                        color: '#ffffff',
                        fontSize: '10.5px',
                        fontWeight: '800',
                        padding: '4px 10px',
                        borderRadius: '8px'
                      }}
                    >
                      Equipped ✓
                    </span>
                  ) : hasLifetimeLegend ? (
                    <span style={{ color: '#6b7280', fontSize: '11px', fontWeight: '700' }}>
                      Equip
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px' }}>🔒</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Return to Feed Action */}
      <div
        style={{
          width: '100%',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '18px',
          padding: '16px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#6b7280' }}>
          {hasMonthAccess ? 'God Mode privileges active in your feed & inbox.' : 'Share your invite link with 3 classmates to unlock God Mode.'}
        </p>
        <button
          type="button"
          onClick={() => onNavigate('poll')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            background: '#000000',
            color: '#ffffff',
            border: 'none',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer'
          }}
        >
          Return to Feed ➔
        </button>
      </div>
    </div>
  );
}
