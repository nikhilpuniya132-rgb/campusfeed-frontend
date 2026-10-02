import React from 'react';
import { motion } from 'framer-motion';
import { isJuniorUser } from '../constants/classes';

export function JuniorSponsorBanner({ city = 'Bathinda', hub = 'Bathinda Schools' }) {
  return (
    <div
      style={{
        marginTop: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'relative',
          borderRadius: '18px',
          background: '#ffffff',
          border: '1.5px solid #000000',
          padding: '18px 18px',
          boxSizing: 'border-box',
          color: '#000000',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header Tag & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🏫</span>
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
              Feature your School Admissions here
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

        {/* Subtitle / Description */}
        <p
          style={{
            margin: 0,
            fontSize: '12.5px',
            color: '#6b7280',
            lineHeight: 1.45,
            fontWeight: '500'
          }}
        >
          Reach students and parents across Classes 6 to 9 in {city}. Promote admissions, scholarship exams, and foundation batches.
        </p>

        {/* CTA Button Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '4px' }}>
          <a
            href="mailto:nikhilpuniya132@gmail.com?subject=School%20Admissions%20Sponsorship"
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
        marginTop: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'relative',
          borderRadius: '18px',
          background: '#ffffff',
          border: '1.5px solid #000000',
          padding: '18px 18px',
          boxSizing: 'border-box',
          color: '#000000',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Header Tag & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🚀</span>
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
              Feature your Coaching Institute here
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
          Want to feature your {city} institute directly to 10th, 11th & 12th graders? Secure an exclusive CenterInsider B2B Retainer.
        </p>

        {/* CTA Button Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '4px' }}>
          <a
            href="mailto:nikhilpuniya132@gmail.com?subject=Coaching%20Institute%20Sponsorship"
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
