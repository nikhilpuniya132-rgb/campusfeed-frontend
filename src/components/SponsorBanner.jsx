import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const CITY_SPONSORS = {
  bathinda: [
    {
      id: 'bti-waffle',
      name: 'The Belgian Waffle Co.',
      location: 'Mall Road, Bathinda',
      category: 'Student Treat',
      logo: '🧇',
      deal: 'Buy 1 Waffle, Get 1 FREE',
      subtext: 'Exclusive perk for verified St. Kabir students with ID.',
      code: 'BTIWAFFLE',
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)'
    },
    {
      id: 'bti-browntown',
      name: 'Brown Town Cafe',
      location: '100 Ft. Road, Bathinda',
      category: 'Youth Hangout',
      logo: '☕',
      deal: 'Flat 20% Off Burgers & Cold Coffee',
      subtext: 'Valid during after-school study hours (2 PM – 6 PM).',
      code: 'BROWNTOWN',
      gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)'
    },
    {
      id: 'bti-mindstone',
      name: 'Mindstone Learning Hub',
      location: 'Civil Lines, Bathinda',
      category: 'Academic Partner',
      logo: '📚',
      deal: 'Free JEE/NEET Diagnostic Test',
      subtext: 'Complimentary mentorship session for Class 9-12.',
      code: 'MINDSTONE',
      gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)'
    }
  ],
  ludhiana: [
    {
      id: 'ldh-niks',
      name: "Nik Baker's",
      location: 'Kipps Market, Sarabha Nagar',
      category: 'Gourmet Bakery',
      logo: '🥐',
      deal: 'Free Hot Chocolate on ₹299+',
      subtext: 'Flash your CampusFeed app at billing for instant unlock.',
      code: 'LDHNIK',
      gradient: 'linear-gradient(135deg, #f97316, #e11d48)'
    },
    {
      id: 'ldh-bakefresh',
      name: 'Bake Fresh Cafe',
      location: 'Model Town, Ludhiana',
      category: 'Student Cafe',
      logo: '🍕',
      deal: 'Flat 25% Off Pizza & Shakes',
      subtext: 'Valid for group tables of 2 or more classmates.',
      code: 'BAKEFRESH',
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)'
    },
    {
      id: 'ldh-masterprep',
      name: 'Masterprep Study Abroad',
      location: 'Ferozepur Road, Ludhiana',
      category: 'Global Careers',
      logo: '🎓',
      deal: 'Free SAT/IELTS Counseling',
      subtext: 'One-on-one study abroad roadmap for high schoolers.',
      code: 'MASTERLDH',
      gradient: 'linear-gradient(135deg, #6366f1, #a855f7)'
    }
  ]
};

export default function SponsorBanner({ city = 'Bathinda' }) {
  const normalizedCity = (city || 'Bathinda').toLowerCase().trim();
  const activeCityKey = normalizedCity.includes('ludhiana') ? 'ludhiana' : 'bathinda';
  const sponsors = CITY_SPONSORS[activeCityKey] || CITY_SPONSORS.bathinda;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);

  const currentSponsor = sponsors[currentIndex] || sponsors[0];
  const cityName = activeCityKey === 'ludhiana' ? 'Ludhiana' : 'Bathinda';

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#fbbf24', '#ff5500', '#10b981']
      });
    } catch (_) {}
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleNextSponsor = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % sponsors.length);
  };

  return (
    <div style={{ width: '100%', marginTop: '16px', marginBottom: '8px', boxSizing: 'border-box' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px' }}>📍</span>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#a1a1aa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {cityName} Student Perks
          </span>
          <span style={{ background: 'rgba(255, 85, 0, 0.15)', border: '1px solid rgba(255, 85, 0, 0.3)', color: '#ff7700', fontSize: '9.5px', fontWeight: '900', padding: '1px 6px', borderRadius: '10px' }}>
            SPONSORED
          </span>
        </div>

        {sponsors.length > 1 && (
          <button
            onClick={handleNextSponsor}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Next deal</span>
            <span>➔</span>
          </button>
        )}
      </div>

      {/* Main Sponsor Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSponsor.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          style={{
            background: '#121214',
            border: '1px solid #27272a',
            borderRadius: '20px',
            padding: '14px 16px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          {/* Subtle Glow Accent */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: currentSponsor.gradient,
              filter: 'blur(35px)',
              opacity: 0.25,
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0
                }}
              >
                {currentSponsor.logo}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '13.5px', fontWeight: '800' }}>
                    {currentSponsor.name}
                  </h4>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '800' }}>✓</span>
                </div>
                <div style={{ fontSize: '11px', color: '#71717a', marginTop: '1px' }}>
                  {currentSponsor.location}
                </div>
              </div>
            </div>

            {/* Code / Claim Pill */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={(e) => handleCopyCode(currentSponsor.code, e)}
              style={{
                background: copiedCode === currentSponsor.code ? '#10b981' : '#18181b',
                border: copiedCode === currentSponsor.code ? '1px solid #10b981' : '1px dashed #ff7700',
                color: copiedCode === currentSponsor.code ? '#ffffff' : '#fbbf24',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              title="Click to copy student promo code"
            >
              <span>{copiedCode === currentSponsor.code ? '✓' : '🏷️'}</span>
              <span>{copiedCode === currentSponsor.code ? 'COPIED!' : currentSponsor.code}</span>
            </motion.button>
          </div>

          {/* Deal Description */}
          <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ color: '#ffffff', fontSize: '12.5px', fontWeight: '800' }}>
              {currentSponsor.deal}
            </div>
            <div style={{ color: '#a1a1aa', fontSize: '11px', marginTop: '2px', lineHeight: '1.3' }}>
              {currentSponsor.subtext}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
