import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HolographicCard from './HolographicCard';

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
  onUpgrade = () => {},
  onNavigate = () => {},
  supabase,
  API,
  onUpdateUser,
  renderProfilePic
}) {
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // default to high-value tier
  const isPro = Boolean(user?.is_pro);

  const [selectedRing, setSelectedRing] = useState(
    user?.selected_ring || user?.ring || localStorage.getItem('campus_user_ring') || 'gold'
  );
  const [isSavingRing, setIsSavingRing] = useState(false);
  const [ringToast, setRingToast] = useState('');

  useEffect(() => {
    if (user?.selected_ring || user?.ring) {
      setSelectedRing(user.selected_ring || user.ring);
    }
  }, [user?.selected_ring, user?.ring]);

  const handlePay = (tier) => {
    const planToPay = tier || selectedPlan;
    const amount = planToPay === 'weekly' ? 99 : 149;
    onUpgrade(amount);
  };

  const handleRingSelect = async (ringId) => {
    setSelectedRing(ringId);
    setIsSavingRing(true);
    setRingToast('Saving ring to profile...');

    const updatedUser = { ...user, ring: ringId, selected_ring: ringId };

    // 1. Immediately update local React state
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    // 2. Persist locally across browser refreshes
    localStorage.setItem('campus_user_ring', ringId);
    localStorage.setItem('selected_ring', ringId);

    // 3. Execute Supabase UPDATE query on users table
    if (supabase && user?.id) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ selected_ring: ringId, ring: ringId })
          .eq('id', user.id);

        if (error) {
          // Fallback if column is named ring in Supabase schema
          await supabase
            .from('users')
            .update({ ring: ringId })
            .eq('id', user.id);
        }
      } catch (err) {
        console.warn('Supabase ring update error:', err);
      }
    }

    // 4. API endpoint update for full redundancy
    try {
      if (API && user?.id) {
        await fetch(`${API}/user/ring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, selected_ring: ringId })
        });
      }
    } catch (err) {
      console.warn('API ring update error:', err);
    } finally {
      setIsSavingRing(false);
      setRingToast('Aura Ring saved & equipped! ✨');
      setTimeout(() => setRingToast(''), 2500);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '460px',
      margin: '0 auto',
      padding: '16px 14px 80px 14px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#ffffff'
    }}>
      {/* VIP Crown Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '20px', width: '100%' }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '20px',
          background: '#f3f4f6',
          border: '1px solid #e5e7eb',
          color: '#111827',
          fontSize: '11px',
          fontWeight: '800',
          letterSpacing: '0.04em',
          marginBottom: '8px'
        }}>
          <span>👑</span> GOD MODE VIP
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '900',
          margin: '0 0 6px 0',
          color: '#000000',
          letterSpacing: '-0.5px'
        }}>
          {isPro ? 'God Mode Active' : 'Unlock God Mode'}
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '13px',
          lineHeight: '1.45',
          margin: 0,
          padding: '0 8px'
        }}>
          {isPro
            ? 'You have VIP status. All voter names are revealed, cooldowns bypassed, and aura rings unlocked.'
            : 'Stop wondering who voted for you. Reveal real names, equip exclusive aura rings, and dominate the coaching loop.'}
        </p>
      </motion.div>

      {/* 3D Preview Card */}
      <div style={{ width: '100%', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
        <HolographicCard
          title={isPro ? 'GOD MODE ACTIVE' : 'GOD MODE VIP'}
          subtitle={isPro ? 'All Features Unlocked' : 'Reveal Every Secret Vote'}
          price={isPro ? 'ACTIVE' : (selectedPlan === 'weekly' ? '₹99' : '₹149')}
          period={isPro ? '' : (selectedPlan === 'weekly' ? '/week' : '/month')}
          onAction={() => handlePay(selectedPlan)}
          actionText={isPro ? '✓ Active VIP Membership' : (selectedPlan === 'weekly' ? 'Get Weekly Pass - ₹99 ⚡' : 'Get Monthly Pass - ₹149 👑')}
        />
      </div>

      {/* Toast Notification for Ring Updates */}
      <AnimatePresence>
        {ringToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
            <span>{ringToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AURA RING EQUIPMENT (Interactive for Pro Users, Preview for Non-Pro) */}
      <div style={{
        width: '100%',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '18px',
        padding: '18px 16px',
        marginBottom: '16px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>💍</span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#000000' }}>
                Profile Ring Equipment
              </h3>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#6b7280' }}>
              {isPro
                ? 'Select an aura ring to instantly equip and save to your profile.'
                : 'Exclusive halo rings for God Mode VIP members.'}
            </p>
          </div>
          {isPro && (
            <span style={{
              background: '#000000',
              color: '#ffffff',
              fontSize: '9.5px',
              fontWeight: '900',
              padding: '2px 8px',
              borderRadius: '6px'
            }}>
              VIP UNLOCKED
            </span>
          )}
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
                disabled={isSavingRing || !isPro}
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
                  cursor: isPro ? 'pointer' : 'default',
                  opacity: isPro ? 1 : 0.65,
                  transition: 'all 0.15s ease',
                  boxShadow: isEquipped ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Aura Dot Indicator */}
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `3px solid ${ring.color}`,
                    background: ring.id === 'none' ? 'transparent' : `${ring.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }} />

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
                    <span style={{
                      background: '#000000',
                      color: '#ffffff',
                      fontSize: '10.5px',
                      fontWeight: '800',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      Equipped ✓
                    </span>
                  ) : isPro ? (
                    <span style={{
                      color: '#6b7280',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
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

      {!isPro ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Side-by-Side Pricing Selection Cards (₹99/wk & ₹149/mo) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            width: '100%'
          }}>
            {/* Weekly Plan Card */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPlan('weekly')}
              style={{
                padding: '16px 12px',
                borderRadius: '18px',
                border: selectedPlan === 'weekly' ? '2px solid #000000' : '1px solid #e5e7eb',
                background: selectedPlan === 'weekly' ? '#f9fafb' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: selectedPlan === 'weekly' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: selectedPlan === 'weekly' ? '#000000' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Weekly Pass
                </span>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#000000', margin: '6px 0 2px 0' }}>
                  ₹99
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>/wk</span>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                  7 Days Access
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePay('weekly');
                }}
                style={{
                  marginTop: '14px',
                  width: '100%',
                  padding: '9px 6px',
                  borderRadius: '10px',
                  border: '1px solid #000000',
                  background: selectedPlan === 'weekly' ? '#000000' : '#f3f4f6',
                  color: selectedPlan === 'weekly' ? '#ffffff' : '#000000',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Pay ₹99 ⚡
              </button>
            </motion.div>

            {/* Monthly Plan Card (Best Value) */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPlan('monthly')}
              style={{
                padding: '16px 12px',
                borderRadius: '18px',
                border: selectedPlan === 'monthly' ? '2px solid #000000' : '1px solid #e5e7eb',
                background: selectedPlan === 'monthly' ? '#f9fafb' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: selectedPlan === 'monthly' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              {/* Badge */}
              <div style={{
                position: 'absolute',
                top: '-9px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#000000',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: '900',
                padding: '2px 8px',
                borderRadius: '8px',
                letterSpacing: '0.03em',
                whiteSpace: 'nowrap'
              }}>
                SAVE 62%
              </div>

              <div style={{ marginTop: '2px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: selectedPlan === 'monthly' ? '#000000' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Monthly Pass
                </span>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#000000', margin: '6px 0 2px 0' }}>
                  ₹149
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>/mo</span>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '700' }}>
                  👑 ~₹37 / week
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePay('monthly');
                }}
                style={{
                  marginTop: '14px',
                  width: '100%',
                  padding: '9px 6px',
                  borderRadius: '10px',
                  border: '1px solid #000000',
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Pay ₹149 👑
              </button>
            </motion.div>
          </div>

          {/* Perks Feature Box */}
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '18px',
            padding: '16px 14px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '10px'
            }}>
              God Mode Privileges
            </span>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#111827' }}>
                <span style={{ color: '#000000', fontWeight: '900' }}>✓</span>
                <span><strong>Instant Voter Reveals:</strong> View full names of who voted for you</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#111827' }}>
                <span style={{ color: '#000000', fontWeight: '900' }}>✓</span>
                <span><strong>Unlimited Poll Voting:</strong> No more 30-minute waiting cooldowns</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#111827' }}>
                <span style={{ color: '#000000', fontWeight: '900' }}>✓</span>
                <span><strong>Verified VIP Crown:</strong> Stand out across class feeds and leaderboards</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#111827' }}>
                <span style={{ color: '#000000', fontWeight: '900' }}>✓</span>
                <span><strong>Aura Rings:</strong> Equip Gold, Crimson, Cosmic, Blue & Emerald rings</span>
              </li>
              {selectedPlan === 'monthly' && (
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#111827', fontWeight: '700' }}>
                  <span>⭐</span>
                  <span><strong>Save 62%:</strong> Best value at just ~₹37 per week</span>
                </li>
              )}
            </ul>
          </div>

          {/* Primary Action Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePay(selectedPlan)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              border: '1px solid #000000',
              background: '#000000',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: 'none'
            }}
          >
            <span>⚡</span>
            <span>
              {selectedPlan === 'weekly' ? 'Upgrade to Weekly Pass (₹99)' : 'Upgrade to Monthly Pass (₹149)'}
            </span>
          </motion.button>
        </div>
      ) : (
        /* Pro Active Footer Info */
        <div style={{
          width: '100%',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '18px',
          padding: '16px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#6b7280' }}>
            VIP membership active. All voter reveals unlocked and 30m cooldowns bypassed.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('poll')}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              background: '#000000',
              color: '#ffffff',
              border: 'none',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Return to Feed ➔
          </button>
        </div>
      )}
    </div>
  );
}
