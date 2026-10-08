import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { handleShare } from '../utils/share';
import { Share2, Sword } from 'lucide-react';

export default function GodMode({
  user,
  onNavigate = () => {},
  supabase,
  API,
  onUpdateUser,
  renderProfilePic
}) {
  const [openSubmenu, setOpenSubmenu] = useState(null); // strictly closed by default
  const [toastMessage, setToastMessage] = useState('');
  const [liveInvites, setLiveInvites] = useState(user?.invites || user?.recruits || 0);
  const [visitors, setVisitors] = useState([]);
  const [isLoadingVisitors, setIsLoadingVisitors] = useState(false);

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
  // Tier 1: 3 Friends -> 1 Month Access (Utility perks only)
  const hasMonthAccess = effectiveInvites >= 3 || Boolean(user?.is_pro || user?.is_god_mode);
  // Tier 2: 25 Friends -> Lifetime Legend (Utility + Vanity perks)
  const hasLifetimeLegend = effectiveInvites >= 25 || Boolean(user?.is_god_mode);

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

  const showToast = (msg) => {
    setToastMessage(msg);
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleNativeShare = async () => {
    const referralCode = (user?.invite_code || user?.handle || user?.id || 'friend').replace(/^@/, '').trim();
    const shareUrl = `${window.location.origin}/?ref=${encodeURIComponent(referralCode)}`;
    const streamText = user?.stream || user?.grade || 'your coaching batch';
    const shareText = `Someone from ${streamText} voted for you on CenterInsider! Join to see who: ${shareUrl}`;

    await handleShare({
      title: 'CenterInsider',
      text: shareText,
      url: shareUrl
    });
  };

  const toggleSubmenu = (menuId) => {
    setOpenSubmenu(prev => (prev === menuId ? null : menuId));
  };

  const tier1Progress = Math.min(100, Math.round((effectiveInvites / 3) * 100));
  const tier2Progress = Math.min(100, Math.round((effectiveInvites / 25) * 100));

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '460px',
        margin: '0 auto',
        padding: '16px 14px 85px 14px',
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
        style={{ textAlign: 'center', marginBottom: '18px', width: '100%' }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '20px',
            background: hasLifetimeLegend ? '#fef3c7' : hasMonthAccess ? '#d1fae5' : '#f3f4f6',
            border: hasLifetimeLegend ? '1px solid #fde68a' : hasMonthAccess ? '1px solid #a7f3d0' : '1px solid #e5e7eb',
            color: hasLifetimeLegend ? '#92400e' : hasMonthAccess ? '#065f46' : '#111827',
            fontSize: '11px',
            fontWeight: '900',
            letterSpacing: '0.04em',
            marginBottom: '8px'
          }}
        >
          <span>{hasLifetimeLegend ? '👑' : hasMonthAccess ? <Sword size={13} strokeWidth={2} /> : '👤'}</span>{' '}
          {hasLifetimeLegend ? 'LIFETIME LEGEND' : hasMonthAccess ? 'BASIC GOD MODE (1 MONTH)' : 'NORMAL USER'}
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
          {hasLifetimeLegend ? 'Lifetime Legend 👑' : hasMonthAccess ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              Basic God Mode <Sword size={20} strokeWidth={2} />
            </span>
          ) : 'God Mode Privileges'}
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
            ? 'Full status + utility powers active. Tap below to manage privileges.'
            : hasMonthAccess
            ? 'Basic utility powers active for 1 month! Invite 25 friends for Lifetime Legend.'
            : 'Invite classmates to unlock unlimited voting, voter reveals, and custom polls.'}
        </p>
      </motion.div>

      {/* Universal Share Button */}
      <div style={{ width: '100%', marginBottom: '18px' }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleNativeShare}
          type="button"
          aria-label="Share"
          style={{
            width: '100%',
            background: '#000000',
            border: 'none',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '14px',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <Share2 size={16} strokeWidth={2} />
          <span>Share</span>
        </motion.button>
      </div>

      {/* ======================================================== */}
      {/* 4 TAP-TO-EXPAND COLLAPSIBLE SUB-MENUS (ACCORDIONS)       */}
      {/* ======================================================== */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* SUB-MENU 1: UTILITY FEATURES UNLOCKED */}
        <div
          style={{
            background: '#ffffff',
            border: hasMonthAccess ? '2px solid #10b981' : '1px solid #e5e7eb',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <button
            type="button"
            onClick={() => toggleSubmenu('utility')}
            style={{
              width: '100%',
              padding: '15px 16px',
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
              <span style={{ fontSize: '18px' }}>⚡</span>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '900', color: '#000000', letterSpacing: '-0.2px' }}>
                  Utility Features Unlocked
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>
                  3-invite perks • 1 Month Access
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  background: hasMonthAccess ? '#d1fae5' : '#f3f4f6',
                  color: hasMonthAccess ? '#065f46' : '#4b5563'
                }}
              >
                {hasMonthAccess ? '✓ Unlocked' : `${effectiveInvites}/3 Invites`}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280', transform: openSubmenu === 'utility' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                ▼
              </span>
            </div>
          </button>

          <AnimatePresence>
            {openSubmenu === 'utility' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', borderTop: '1px solid #f3f4f6' }}
              >
                <div style={{ padding: '14px 16px 16px 16px' }}>
                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '5px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: `${tier1Progress}%`,
                        height: '100%',
                        background: hasMonthAccess ? '#10b981' : '#000000',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  {/* Clean bullet points only */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#111827' }}>
                      <span style={{ color: hasMonthAccess ? '#10b981' : '#000000', fontWeight: '900' }}>✓</span>
                      <span><strong>Unlimited votes</strong> (cooldown timer permanently disabled for 1 month)</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#111827' }}>
                      <span style={{ color: hasMonthAccess ? '#10b981' : '#000000', fontWeight: '900' }}>✓</span>
                      <span><strong>See who voted for you</strong> (Voter Reveal)</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#111827' }}>
                      <span style={{ color: hasMonthAccess ? '#10b981' : '#000000', fontWeight: '900' }}>✓</span>
                      <span><strong>Create up to 3 custom polls</strong> per month</span>
                    </li>
                  </ul>

                  {!hasMonthAccess && (
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={handleNativeShare}
                        style={{
                          background: '#000000',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 16px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        Invite {Math.max(1, 3 - effectiveInvites)} more to unlock ➔
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SUB-MENU 2: FEATURES LOCKED 👑 (LIFETIME LEGEND PERKS) */}
        <div
          style={{
            background: hasLifetimeLegend ? '#000000' : '#ffffff',
            border: hasLifetimeLegend ? '2px solid #fbbf24' : '1px solid #e5e7eb',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            color: hasLifetimeLegend ? '#ffffff' : '#000000'
          }}
        >
          <button
            type="button"
            onClick={() => toggleSubmenu('locked')}
            style={{
              width: '100%',
              padding: '15px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: hasLifetimeLegend ? '#000000' : '#ffffff',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              color: 'inherit'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>👑</span>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '900', color: hasLifetimeLegend ? '#fbbf24' : '#000000', letterSpacing: '-0.2px' }}>
                  Features Locked 👑
                </div>
                <div style={{ fontSize: '11px', color: hasLifetimeLegend ? '#d1d5db' : '#6b7280', marginTop: '1px' }}>
                  25-invite Lifetime Legend perks
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  background: hasLifetimeLegend ? '#fbbf24' : '#f3f4f6',
                  color: hasLifetimeLegend ? '#000000' : '#4b5563'
                }}
              >
                {hasLifetimeLegend ? '★ Unlocked' : `${effectiveInvites}/25 Invites`}
              </span>
              <span style={{ fontSize: '12px', color: hasLifetimeLegend ? '#fbbf24' : '#6b7280', transform: openSubmenu === 'locked' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                ▼
              </span>
            </div>
          </button>

          <AnimatePresence>
            {openSubmenu === 'locked' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', borderTop: hasLifetimeLegend ? '1px solid #262626' : '1px solid #f3f4f6' }}
              >
                <div style={{ padding: '14px 16px 16px 16px' }}>
                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '5px', background: hasLifetimeLegend ? '#262626' : '#f3f4f6', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: `${tier2Progress}%`,
                        height: '100%',
                        background: hasLifetimeLegend ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : '#000000',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>

                  {/* Clean bullet points only */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: hasLifetimeLegend ? '#ffffff' : '#111827' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
                      <span><strong>Unlimited votes</strong> (no timers ever)</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: hasLifetimeLegend ? '#ffffff' : '#111827' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
                      <span><strong>See who voted for you</strong> (Voter Reveal)</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: hasLifetimeLegend ? '#ffffff' : '#111827' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
                      <span><strong>Create up to 150 custom polls/month</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: hasLifetimeLegend ? '#ffffff' : '#111827' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
                      <span><strong>Select & equip custom Aura Rings</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: hasLifetimeLegend ? '#ffffff' : '#111827' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
                      <span><strong>Crown badge under profile picture</strong></span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: hasLifetimeLegend ? '#ffffff' : '#111827' }}>
                      <span style={{ color: '#fbbf24', fontWeight: '900' }}>★</span>
                      <span><strong>Prominently featured in Legends Tab</strong></span>
                    </li>
                  </ul>

                  {!hasLifetimeLegend && (
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={handleNativeShare}
                        title="Share / Invite Friends"
                        aria-label="Share / Invite Friends"
                        style={{
                          background: 'transparent',
                          color: hasLifetimeLegend ? '#ffffff' : '#000000',
                          border: hasLifetimeLegend ? '1.5px solid #ffffff' : '1.5px solid #000000',
                          borderRadius: '12px',
                          padding: '8px 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Share2 size={16} strokeWidth={1.8} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Return to Feed Action */}
      <div
        style={{
          width: '100%',
          marginTop: '20px',
          textAlign: 'center'
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate('poll')}
          style={{
            padding: '11px 24px',
            borderRadius: '14px',
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
