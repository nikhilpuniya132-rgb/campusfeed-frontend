import React, { useState } from 'react';
import { motion } from 'framer-motion';
import HolographicCard from './HolographicCard';

export default function GodMode({ user, onUpgrade = () => {}, onNavigate = () => {} }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // default to high-value tier

  const isPro = !!user?.is_pro;

  const handlePay = (tier) => {
    const planToPay = tier || selectedPlan;
    const amount = planToPay === 'weekly' ? 99 : 149;
    onUpgrade(amount);
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
            ? 'You have VIP status. All voter names are revealed and 30m cooldowns bypassed.'
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
          actionText={isPro ? '✓ Active Membership' : (selectedPlan === 'weekly' ? 'Get Weekly Pass - ₹99 ⚡' : 'Get Monthly Pass - ₹149 👑')}
        />
      </div>

      {!isPro ? (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Side-by-Side Pricing Selection Cards (Restored ₹99/wk & ₹149/mo) */}
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
                <span><strong>Minimalist Halos:</strong> Equip Gold, Crimson, Charcoal & Minimal rings</span>
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
        /* Pro Active State */
        <div style={{
          width: '100%',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '18px',
          padding: '20px',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👑</div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '800', color: '#000000' }}>
            VIP Membership Active
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#6b7280' }}>
            Your account has full God Mode access. Enjoy uninhibited identity reveals and custom halos.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
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
            Customize Halo Rings in Profile ➔
          </button>
        </div>
      )}
    </div>
  );
}
