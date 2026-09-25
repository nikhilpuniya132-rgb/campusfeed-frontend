import React from 'react';
import { motion } from 'framer-motion';

export default function SponsorBanner() {
  return (
    <div
      style={{
        marginTop: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Static B2B Sponsorship Placeholder Card (Minimalist White UI) */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'relative',
          borderRadius: '18px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          padding: '18px 18px',
          boxSizing: 'border-box',
          color: '#000000',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header Tag & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '900',
                color: '#000000',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Claim This Space 🚀
            </h3>
          </div>

          <span
            style={{
              fontSize: '10px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              background: '#f3f4f6',
              color: '#374151',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}
          >
            SPONSOR SPOTLIGHT
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            margin: 0,
            fontSize: '12.5px',
            color: '#6b7280',
            lineHeight: 1.45,
            fontWeight: '500'
          }}
        >
          Want to feature your Bathinda institute directly to 11th & 12th graders? Secure an exclusive CenterInsider B2B Retainer.
        </p>

        {/* CTA Button Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '4px' }}>
          <a
            href="mailto:nikhilpuniya132@gmail.com"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#000000',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '12.5px',
              fontWeight: '800',
              textDecoration: 'none',
              cursor: 'pointer',
              border: '1px solid #000000',
              transition: 'transform 0.15s ease'
            }}
          >
            <span>✉️</span>
            <span>Contact Admin</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
