import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    tag: 'SCHOLARSHIP'
  },
  {
    id: 'pw-vidyapeeth',
    name: 'Physics Wallah Vidyapeeth',
    location: 'Bathinda Offline Centre',
    category: 'Premier Coaching Partner',
    logo: '⚡',
    deal: 'Flat ₹5,000 Off on 11th/12th Batches',
    subtext: 'Valid for JEE/NEET offline batches. Instant verification with CenterInsider.',
    code: 'PWBTI5K',
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
          <span style={{ fontSize: '11px', fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🎓 Bathinda Coaching Perks
          </span>
          <span
            style={{
              fontSize: '9.5px',
              padding: '2px 7px',
              borderRadius: '10px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              color: '#374151',
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
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              color: '#374151',
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
          <span style={{ fontSize: '10.5px', color: '#6b7280', fontWeight: '700' }}>
            {currentIndex + 1}/{ACADEMIC_B2B_SPONSORS.length}
          </span>
          <button
            onClick={nextSponsor}
            aria-label="Next Offer"
            style={{
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              color: '#374151',
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
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            padding: '14px',
            boxShadow: 'none',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            {/* Institute Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  background: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0
                }}
              >
                {currentSponsor.logo}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#000000' }}>
                    {currentSponsor.name}
                  </h4>
                  <span
                    style={{
                      fontSize: '9px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      padding: '1px 6px',
                      borderRadius: '6px',
                      fontWeight: '800'
                    }}
                  >
                    {currentSponsor.tag}
                  </span>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                  📍 {currentSponsor.location}
                </p>
              </div>
            </div>

            {/* Voucher Code / Claim Button */}
            <button
              onClick={(e) => handleCopyCode(currentSponsor.code, e)}
              style={{
                background: copiedCode === currentSponsor.code ? '#111827' : '#f3f4f6',
                border: '1px solid #e5e7eb',
                color: copiedCode === currentSponsor.code ? '#ffffff' : '#111827',
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
          <div style={{ marginTop: '10px', padding: '10px 12px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#000000', marginBottom: '2px' }}>
              ⚡ {currentSponsor.deal}
            </div>
            <div style={{ fontSize: '11.5px', color: '#6b7280', lineHeight: '1.35' }}>
              {currentSponsor.subtext}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
