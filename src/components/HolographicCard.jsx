import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function HolographicCard({
  title = 'GOD MODE VIP',
  subtitle = 'Reveal Every Secret Voter',
  price = '₹99',
  period = '/week',
  perks = [
    'Unlimited Instant Name Reveals',
    'Exclusive Animated 3D Aura Rings',
    'Real-time Crush & Vote Alerts',
    'Class 11 & 12 VIP Crown Badge',
  ],
  onAction,
  actionText = 'Unlock God Mode ➔',
}) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const spring = { damping: 18, stiffness: 220 };
  const smoothX = useSpring(x, spring);
  const smoothY = useSpring(y, spring);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [16, -16]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-16, 16]);

  const holoBgPos = useTransform(
    [smoothX, smoothY],
    ([sx, sy]) => `${(sx + 0.5) * 100}% ${(sy + 0.5) * 100}%`
  );

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
          background: 'linear-gradient(135deg, #181926 0%, #0d0e15 100%)',
          border: '2px solid rgba(251, 191, 36, 0.4)',
          boxShadow: isHovered
            ? '0 25px 50px -12px rgba(251, 191, 36, 0.35), 0 0 30px rgba(251, 191, 36, 0.2)'
            : '0 15px 35px -10px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {/* Holographic Rainbow Iridescence Foil */}
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '24px',
            pointerEvents: 'none',
            opacity: isHovered ? 0.35 : 0.15,
            transition: 'opacity 0.3s ease',
            background:
              'linear-gradient(115deg, transparent 20%, rgba(255,0,128,0.4) 36%, rgba(0,255,255,0.4) 48%, rgba(255,230,0,0.5) 60%, transparent 80%)',
            backgroundSize: '200% 200%',
            backgroundPosition: holoBgPos,
            mixBlendMode: 'color-dodge',
            zIndex: 1,
          }}
        />

        {/* 3D Depth Content Layer */}
        <div style={{ position: 'relative', zIndex: 2, transform: 'translateZ(30px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span
              style={{
                background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                color: '#000',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '900',
                letterSpacing: '1px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              👑 {title}
            </span>
            <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 'bold' }}>BATHINDA EXCLUSIVE</span>
          </div>

          <h3
            style={{
              fontSize: '26px',
              fontWeight: '900',
              margin: '0 0 6px 0',
              background: 'linear-gradient(135deg, #fff 0%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {subtitle}
          </h3>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '14px 0 20px 0' }}>
            <span style={{ fontSize: '38px', fontWeight: '900', color: '#fbbf24' }}>{price}</span>
            <span style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: 'bold' }}>{period}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {perks.map((perk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#e4e4e7', fontWeight: '600' }}>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'rgba(251, 191, 36, 0.2)',
                    color: '#fbbf24',
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
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAction}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              border: 'none',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#000',
              fontSize: '15px',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              letterSpacing: '0.5px',
            }}
          >
            {actionText}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
