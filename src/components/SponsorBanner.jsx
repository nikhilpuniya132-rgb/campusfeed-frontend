import React from 'react';
import { motion } from 'framer-motion';
import { isJuniorUser } from '../constants/classes';

export function JuniorSponsorBanner({ city = 'Bathinda', hub = 'Bathinda Schools' }) {
  return (
    <div
      style={{
        marginTop: '4px',
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
          borderRadius: '14px',
          background: '#09090b',
          border: '1.5px solid #27272a',
          padding: '6px 12px',
          boxSizing: 'border-box',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          boxShadow: 'none'
        }}
      >
        {/* Header Tag & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '13px' }}>🏫</span>
            <h3
              style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: '900',
                color: '#ffffff',
                letterSpacing: '-0.01em',
                lineHeight: 1.2
              }}
            >
              School Admissions Spotlight
            </h3>
          </div>

          <span
            style={{
              fontSize: '8.5px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: '#18181b',
              color: '#a1a1aa',
              padding: '1px 5px',
              borderRadius: '4px',
              border: '1px solid #27272a'
            }}
          >
            SPONSOR
          </span>
        </div>

        {/* Subtitle / Description */}
        <p
          style={{
            margin: 0,
            fontSize: '10px',
            color: '#a1a1aa',
            lineHeight: 1.25,
            fontWeight: '600',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          Reach Classes 6-9 in {city}. Promote admissions & scholarship tests.
        </p>

        {/* CTA Button Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '1px' }}>
          <a
            href="mailto:nikhilpuniya132@gmail.com?subject=School%20Admissions%20Sponsorship"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#18181b',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '10.5px',
              fontWeight: '800',
              textDecoration: 'none',
              cursor: 'pointer',
              border: '1px solid #3f3f46'
            }}
          >
            <span>✉️</span>
            <span>Contact School Desk</span>
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
        marginTop: '4px',
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
          borderRadius: '14px',
          background: '#09090b',
          border: '1.5px solid #27272a',
          padding: '6px 12px',
          boxSizing: 'border-box',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          boxShadow: 'none'
        }}
      >
        {/* Header Tag & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '13px' }}>🚀</span>
            <h3
              style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: '900',
                color: '#ffffff',
                letterSpacing: '-0.01em',
                lineHeight: 1.2
              }}
            >
              Feature Your Coaching Institute
            </h3>
          </div>

          <span
            style={{
              fontSize: '8.5px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: '#18181b',
              color: '#a1a1aa',
              padding: '1px 5px',
              borderRadius: '4px',
              border: '1px solid #27272a'
            }}
          >
            SPONSOR
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            margin: 0,
            fontSize: '10px',
            color: '#a1a1aa',
            lineHeight: 1.25,
            fontWeight: '600',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          Target 10th-12th graders in {city}. Exclusive B2B partnership.
        </p>

        {/* CTA Button Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '1px' }}>
          <a
            href="mailto:nikhilpuniya132@gmail.com?subject=Coaching%20Institute%20Sponsorship"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#18181b',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '10.5px',
              fontWeight: '800',
              textDecoration: 'none',
              cursor: 'pointer',
              border: '1px solid #3f3f46'
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
