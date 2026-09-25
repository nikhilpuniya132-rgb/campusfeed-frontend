import React from 'react';
import { motion } from 'framer-motion';

export default function SponsorBanner({ city = 'Bathinda', hub = 'Ajit Road Hub' }) {
  const mailtoHref = "mailto:admin@centerinsider.com?cc=nikhilpuniya132@gmail.com&subject=CenterInsider%20B2B%20Sponsorship%20Inquiry&body=Hi%20CenterInsider%20Team,%0A%0AWe%20are%20interested%20in%20the%20exclusive%20CenterInsider%20B2B%20Retainer%20for%20our%20institute.%0A%0AInstitute%20Name:%20%0ALocation:%20%0AContact%20Number:%20";

  return (
    <div
      style={{
        marginTop: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Subtle Dark-Mode B2B Sponsorship Placeholder Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'relative',
          borderRadius: '16px',
          background: '#0d0d0f',
          border: '1.5px dashed #404040',
          padding: '18px 18px',
          boxSizing: 'border-box',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Header Tag & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '800',
                color: '#ffffff',
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
              letterSpacing: '0.08em',
              background: '#1c1c21',
              color: '#a1a1aa',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #2e2e36'
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
            color: '#a1a1aa',
            lineHeight: 1.45,
            fontWeight: '500'
          }}
        >
          Want to feature your Bathinda institute directly to 11th & 12th graders? Secure an exclusive CenterInsider B2B Retainer.
        </p>

        {/* CTA Button Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '2px' }}>
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            href={mailtoHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              color: '#000000',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: '800',
              textDecoration: 'none',
              cursor: 'pointer',
              border: 'none',
              transition: 'background 0.15s ease'
            }}
          >
            <span>✉️</span>
            <span>Contact Admin</span>
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
}
