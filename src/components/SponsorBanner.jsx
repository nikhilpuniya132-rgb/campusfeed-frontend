import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const ACADEMIC_B2B_SPONSORS = [
  {
    id: 'aakash-demo',
    name: 'Aakash Institute',
    location: '100 Feet Road Hub, Bathinda',
    category: 'Verified Coaching Partner',
    logo: '🩺',
    deal: 'Book a Free 11th Medical Demo',
    subtext: 'Includes complimentary NEET Diagnostic Test & Rank Analysis.',
    code: 'AAKASH11MED',
    gradient: 'linear-gradient(135deg, #0284c7, #2563eb)',
    tag: 'B2B EXCLUSIVE'
  },
  {
    id: 'allen-scholarship',
    name: 'ALLEN Career Institute',
    location: 'Bathinda Campus',
    category: 'Academic Sponsor',
    logo: '🏆',
    deal: 'TALLENTEX: Up to 90% Scholarship',
    subtext: 'Free registration & previous year solved sample papers for Bathinda students.',
    code: 'ALLENBTI',
    gradient: 'linear-gradient(135deg, #10b981, #0d9488)',
    tag: 'SCHOLARSHIP'
  },
  {
    id: 'pw-vidyapeeth',
    name: 'Physics Wallah Vidyapeeth',
    location: 'Bathinda Offline Centre',
    category: 'Premier Coaching Partner',
    logo: '⚡',
    deal: 'Flat ₹5,000 Off on 11th/12th Batches',
    subtext: 'Valid for JEE/NEET offline batches. Instant verification with CampusFeed.',
    code: 'PWBTI5K',
    gradient: 'linear-gradient(135deg, #f97316, #dc2626)',
    tag: 'POPULAR'
  },
  {
    id: 'kapil-ajit',
    name: 'Kapil Institute',
    location: 'Ajit Road Hub, Bathinda',
    category: 'Ajit Road Anchor',
    logo: '🎯',
    deal: 'Free 3-Day Crash Course Pass',
    subtext: 'Specialized faculty for Board + Competitive exam synergy.',
    code: 'KAPILAJIT',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    tag: 'HUB SPECIAL'
  }
];

export default function SponsorBanner({ city = 'Bathinda', hub = 'Ajit Road Hub' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);

  const currentSponsor = ACADEMIC_B2B_SPONSORS[currentIndex] || ACADEMIC_B2B_SPONSORS[0];

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    
    // Haptic feedback
    if (window.navigator?.vibrate) {
      window.navigator.vibrate([15, 30, 15]);
    }

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

  const nextSponsor = () => {
    setCurrentIndex((prev) => (prev + 1) % ACADEMIC_B2B_SPONSORS.length);
  };

  const prevSponsor = () => {
    setCurrentIndex((prev) => (prev - 1 + ACADEMIC_B2B_SPONSORS.length) % ACADEMIC_B2B_SPONSORS.length);
  };

  return (
    <div
      style={{
        marginTop: '18px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          padding: '0 4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '900', color: '#ff5500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🎓 Bathinda Coaching Perks
          </span>
          <span
            style={{
              fontSize: '9.5px',
              padding: '2px 7px',
              borderRadius: '10px',
              background: 'rgba(255, 85, 0, 0.15)',
              border: '1px solid rgba(255, 85, 0, 0.35)',
              color: '#ff8800',
              fontWeight: '800'
            }}
          >
            Verified Partner
          </span>
        </div>

        {/* Carousel indicators & navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={prevSponsor}
            aria-label="Previous Offer"
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            ‹
          </button>
          <span style={{ fontSize: '10.5px', color: '#71717a', fontWeight: '700' }}>
            {currentIndex + 1}/{ACADEMIC_B2B_SPONSORS.length}
          </span>
          <button
            onClick={nextSponsor}
            aria-label="Next Offer"
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              cursor: 'pointer',
              padding: 0
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Interactive Academic Offer Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSponsor.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'relative',
            borderRadius: '20px',
            background: '#141416',
            border: '1px solid #27272a',
            overflow: 'hidden',
            padding: '14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            boxSizing: 'border-box'
          }}
        >
          {/* Subtle Ambient Accent Top Bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: currentSponsor.gradient
            }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            {/* Institute Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  background: currentSponsor.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                {currentSponsor.logo}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#ffffff' }}>
                    {currentSponsor.name}
                  </h4>
                  <span
                    style={{
                      fontSize: '9px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      padding: '1px 6px',
                      borderRadius: '6px',
                      fontWeight: '800'
                    }}
                  >
                    {currentSponsor.tag}
                  </span>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#71717a', fontWeight: '600' }}>
                  📍 {currentSponsor.location}
                </p>
              </div>
            </div>

            {/* Voucher Code / Claim Button */}
            <button
              onClick={(e) => handleCopyCode(currentSponsor.code, e)}
              style={{
                background: copiedCode === currentSponsor.code ? '#10b981' : '#1e1e24',
                border: copiedCode === currentSponsor.code ? '1px solid #10b981' : '1px solid #333338',
                color: copiedCode === currentSponsor.code ? '#ffffff' : '#f4f4f5',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '11.5px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <span>{copiedCode === currentSponsor.code ? '✓' : '🎟️'}</span>
              <span>{copiedCode === currentSponsor.code ? 'Copied' : currentSponsor.code}</span>
            </button>
          </div>

          {/* Deal Headline & Subtext */}
          <div style={{ marginTop: '10px', padding: '10px 12px', background: '#0e0e10', borderRadius: '12px', border: '1px solid #1f1f23' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#fbbf24', marginBottom: '2px' }}>
              ⚡ {currentSponsor.deal}
            </div>
            <div style={{ fontSize: '11.5px', color: '#a1a1aa', lineHeight: '1.35' }}>
              {currentSponsor.subtext}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
