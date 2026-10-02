import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomPollSubmit from './CustomPollSubmit';
import { copyReferralLink, getWhatsAppShareUrl } from '../utils/referral';

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

  // Fetch classmates for Spying Friend feature when unlocked
  useEffect(() => {
    if (!hasLifetimeLegend) return;
    let isMounted = true;
    const fetchVisitors = async () => {
      setIsLoadingVisitors(true);
      try {
        if (supabase) {
          let query = supabase
            .from('users')
            .select('id, handle, name, avatar, profile_pic, stream, grade, institute')
            .neq('id', user?.id || '');

          if (user?.institute) {
            query = query.eq('institute', user.institute);
          }

          const { data } = await query.limit(8);
          if (isMounted && data && data.length > 0) {
            const timeAgoList = ['14m ago', '38m ago', '1h ago', '3h ago', '5h ago', 'Yesterday', '2d ago', '3d ago'];
            const enriched = data.map((u, i) => ({
              ...u,
              visitedAt: timeAgoList[i % timeAgoList.length]
            }));
            setVisitors(enriched);
          }
        }
      } catch (err) {
        console.warn('Error fetching secret visitors:', err);
      } finally {
        if (isMounted) setIsLoadingVisitors(false);
      }
    };
    fetchVisitors();
    return () => { isMounted = false; };
  }, [hasLifetimeLegend, supabase, user?.id, user?.institute]);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleCopyLink = async () => {
    const res = await copyReferralLink(user);
    if (res.success) {
      showToast('Invite link copied! 📋');
    } else {
      showToast('Share: ' + res.link);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = getWhatsAppShareUrl(user);
    window.open(waUrl, '_blank');
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
          <span>{hasLifetimeLegend ? '👑' : hasMonthAccess ? '🔥' : '👤'}</span>{' '}
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
          {hasLifetimeLegend ? 'Lifetime Legend 👑' : hasMonthAccess ? 'Basic God Mode 🔥' : 'God Mode Privileges'}
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

      {/* Quick Invite Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginBottom: '18px' }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCopyLink}
          type="button"
          style={{
            background: '#ffffff',
            border: '1.5px solid #000000',
            color: '#000000',
            padding: '11px 14px',
            borderRadius: '14px',
            fontSize: '12.5px',
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
            padding: '11px 14px',
            borderRadius: '14px',
            fontSize: '12.5px',
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
                        onClick={handleCopyLink}
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
                      <span><strong>Secret profile visitors</strong> (Spying Friend)</span>
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
                        onClick={handleWhatsAppShare}
                        style={{
                          background: '#25D366',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 16px',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        Share on WhatsApp ({effectiveInvites}/25) ➔
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SUB-MENU 3: CREATE CUSTOM POLLS */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <button
            type="button"
            onClick={() => toggleSubmenu('polls')}
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
              <span style={{ fontSize: '18px' }}>✍️</span>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '900', color: '#000000', letterSpacing: '-0.2px' }}>
                  Create Custom Polls
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>
                  Submit polls to your school/batch feed
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
                  background: hasMonthAccess ? '#f3f4f6' : '#fee2e2',
                  color: hasMonthAccess ? '#111827' : '#991b1b'
                }}
              >
                {hasLifetimeLegend ? '150/mo' : hasMonthAccess ? '3/mo' : 'Locked'}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280', transform: openSubmenu === 'polls' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                ▼
              </span>
            </div>
          </button>

          <AnimatePresence>
            {openSubmenu === 'polls' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', borderTop: '1px solid #f3f4f6' }}
              >
                <div style={{ padding: '8px 12px 14px 12px' }}>
                  <CustomPollSubmit
                    user={{ ...user, is_god_mode: hasLifetimeLegend, is_pro: hasMonthAccess, invites: effectiveInvites }}
                    API={API}
                    supabase={supabase}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SUB-MENU 4: SPYING FRIEND (SECRET PROFILE VISITORS) */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <button
            type="button"
            onClick={() => toggleSubmenu('spying')}
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
              <span style={{ fontSize: '18px' }}>🕵️</span>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: '900', color: '#000000', letterSpacing: '-0.2px' }}>
                  Spying Friend
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>
                  Secret Profile Visitors tracking
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
                  background: hasLifetimeLegend ? '#fef3c7' : '#f3f4f6',
                  color: hasLifetimeLegend ? '#b45309' : '#6b7280'
                }}
              >
                {hasLifetimeLegend ? '★ Unlocked' : '🔒 25 Invites'}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280', transform: openSubmenu === 'spying' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                ▼
              </span>
            </div>
          </button>

          <AnimatePresence>
            {openSubmenu === 'spying' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', borderTop: '1px solid #f3f4f6' }}
              >
                <div style={{ padding: '14px 16px 16px 16px' }}>
                  {hasLifetimeLegend ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#000000' }}>
                          Recent Profile Stalkers & Visitors
                        </span>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>
                          ● Live
                        </span>
                      </div>

                      {isLoadingVisitors ? (
                        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: '12.5px', color: '#6b7280' }}>
                          Detecting visitors...
                        </div>
                      ) : visitors.length === 0 ? (
                        <div style={{ padding: '18px 12px', textAlign: 'center', background: '#f9fafb', borderRadius: '12px' }}>
                          <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>👀</span>
                          <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '800', color: '#000000' }}>
                            Zero secret visitors in the last 24h
                          </p>
                          <span style={{ fontSize: '11.5px', color: '#6b7280' }}>
                            Cast more votes in the feed to trigger classmates to check your profile!
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {visitors.map((v) => (
                            <div
                              key={v.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                borderRadius: '12px',
                                background: '#f9fafb',
                                border: '1px solid #e5e7eb'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {renderProfilePic ? (
                                  renderProfilePic(v.profile_pic, v.avatar, false, 'none', 36)
                                ) : (
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {v.avatar || '👀'}
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#000000' }}>
                                    @{v.handle}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                    {v.stream || 'Classmate'} • Viewed profile
                                  </div>
                                </div>
                              </div>

                              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>
                                {v.visitedAt}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Locked Spying Friend View (Blurred / Teaser) */
                    <div style={{ position: 'relative', textAlign: 'center', padding: '12px 6px' }}>
                      {/* Blurred Fake Stack */}
                      <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.6, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f3f4f6', borderRadius: '10px' }}>
                          <span>Classmate from 11th Medical</span>
                          <span>18m ago</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f3f4f6', borderRadius: '10px' }}>
                          <span>Someone from Kapil Institute</span>
                          <span>1h ago</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f3f4f6', borderRadius: '10px' }}>
                          <span>Classmate from 12th Board</span>
                          <span>Yesterday</span>
                        </div>
                      </div>

                      {/* Foreground Overlay Lock */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px',
                          background: 'rgba(255, 255, 255, 0.85)',
                          borderRadius: '12px'
                        }}
                      >
                        <span style={{ fontSize: '26px', marginBottom: '4px' }}>🔒</span>
                        <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#000000', marginBottom: '2px' }}>
                          Secret Profile Visitors Locked
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '11.5px', color: '#6b7280', maxWidth: '280px', lineHeight: '1.4' }}>
                          Classmates are secretly viewing your profile! Reach <strong>25 Invites (Lifetime Legend)</strong> to unmask exactly who is checking you out.
                        </p>
                        <button
                          type="button"
                          onClick={handleWhatsAppShare}
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
                          Invite Friends to Unlock ➔
                        </button>
                      </div>
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
