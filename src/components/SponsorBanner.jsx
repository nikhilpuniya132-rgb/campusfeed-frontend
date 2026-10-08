import React from 'react';
import { motion } from 'framer-motion';
import { isJuniorUser } from '../constants/classes';

export function JuniorSponsorBanner({ city = 'Bathinda', hub = 'Bathinda Schools' }) {
  return (
    <div
      style={{
        marginTop: '8px',
        width: '100%',
        boxSizing: 'border-box',
        flexShrink: 0
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'relative',
          borderRadius: '16px',
          background: '#ffffff',
          border: '1.5px solid #000000',
          padding: '10px 14px',
          boxSizing: 'border-box',
          color: '#000000',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
        }}
      >
        {/* Header Tag & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px' }}>🏫</span>
            <h3
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: '900',
                color: '#000000',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              Feature your School Admissions here
            </h3>
          </div>

          <span
            style={{
              fontSize: '9px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: '#f3f4f6',
              color: '#374151',
              padding: '2px 6px',
              borderRadius: '5px',
              border: '1px solid #e5e7eb'
            }}
          >
            SPONSOR SPOTLIGHT
          </span>
        </div>

        {/* Subtitle / Description */}
        <p
          style={{
            margin: 0,
            fontSize: '11px',
            color: '#6b7280',
            lineHeight: 1.35,
            fontWeight: '500'
          }}
        >
          Reach students across Classes 6 to 9 in {city}. Promote admissions & scholarship exams.
        </p>

        {/* CTA Button Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '2px' }}>
          <a
            href="mailto:nikhilpuniya132@gmail.com?subject=School%20Admissions%20Sponsorship"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#000000',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '11.5px',
              fontWeight: '800',
              textDecoration: 'none',
              cursor: 'pointer',
              border: '1px solid #000000',
              transition: 'transform 0.15s ease'
            }}
          >
            <span>✉️</span>
            <span>Contact School Admissions Desk</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export function SeniorSponsorBanner({ city = 'Bathinda', hub = 'Ajit Road Hub' }) {
  return (
    <div
      style={{
        marginTop: '8px',
        width: '100%',
        boxSizing: 'border-box',
        flexShrink: 0
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'relative',
          borderRadius: '16px',
          background: '#ffffff',
          border: '1.5px solid #000000',
          padding: '10px 14px',
          boxSizing: 'border-box',
          color: '#000000',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
        }}
      >
        {/* Header Tag & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px' }}>🚀</span>
            <h3
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: '900',
                color: '#000000',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              Feature your Coaching Institute here
            </h3>
          </div>

          <span
            style={{
              fontSize: '9px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: '#f3f4f6',
              color: '#374151',
              padding: '2px 6px',
              borderRadius: '5px',
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
            fontSize: '11px',
            color: '#6b7280',
            lineHeight: 1.35,
            fontWeight: '500'
          }}
        >
          Feature your {city} institute directly to 10th-12th graders. Secure an exclusive B2B Retainer.
        </p>

        {/* CTA Button Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '2px' }}>
          <a
            href="mailto:nikhilpuniya132@gmail.com?subject=Coaching%20Institute%20Sponsorship"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#000000',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '11.5px',
              fontWeight: '800',
              textDecoration: 'none',
              cursor: 'pointer',
              border: '1px solid #000000',
              transition: 'transform 0.15s ease'
            }}
          >
            <span>✉️</span>
            <span>Contact Coaching Partner Desk</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}

export default function SponsorBanner({ user, isJunior: propIsJunior, city = 'Bathinda', hub = 'Ajit Road Hub' }) {
  const isJunior = propIsJunior !== undefined ? propIsJunior : isJuniorUser(user);

  if (isJunior) {
    return <JuniorSponsorBanner city={city} hub={hub} />;
  }

  return <SeniorSponsorBanner city={city} hub={hub} />;
}
