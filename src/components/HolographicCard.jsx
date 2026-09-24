import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function HolographicCard({
  title = 'GOD MODE VIP',
  subtitle = 'Reveal Every Secret Voter',
  price = '₹99',
  period = '/week',
  perks = [
    'Unlimited Instant Name Reveals',
    'Exclusive 3D Aura Rings',
    'Real-time Batch Alerts',
    'Class 11 & 12 VIP Badge',
  ],
  onAction,
  actionText = 'Unlock God Mode ➔',
}) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const spring = { damping: 20, stiffness: 200 };
  const smoothX = useSpring(x, spring);
  const smoothY = useSpring(y, spring);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-10, 10]);

  const handlePointerMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || rect.left + rect.width / 2;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || rect.top + rect.height / 2;

    x.set((clientX - rect.left) / rect.width - 0.5);
    y.set((clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
      }}
      style={{
        perspective: 1200,
        width: '100%',
        maxWidth: 'min(380px, 100%)',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          borderRadius: '24px',
          padding: '28px 24px',
          background: '#1A1A1A',
          border: '1px solid #262626',
          boxShadow: 'none',
          position: 'relative',
          overflow: 'hidden',
          color: '#ffffff',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, transform: 'translateZ(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span
              style={{
                background: '#262626',
                border: '1px solid #3f3f46',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '1px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              👑 {title}
            </span>
            <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 'bold' }}>BATHINDA EXCLUSIVE</span>
          </div>

          <h3
            style={{
              fontSize: '24px',
              fontWeight: '900',
              margin: '0 0 6px 0',
              color: '#ffffff',
            }}
          >
            {subtitle}
          </h3>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '14px 0 20px 0' }}>
            <span style={{ fontSize: '36px', fontWeight: '900', color: '#ffffff' }}>{price}</span>
            <span style={{ fontSize: '13px', color: '#71717a', fontWeight: 'bold' }}>{period}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {perks.map((perk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#d4d4d8', fontWeight: '500' }}>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#262626',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                {perk}
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAction}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: '#ffffff',
              color: '#000000',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {actionText}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
