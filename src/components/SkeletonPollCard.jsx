import React from 'react';
import { motion } from 'framer-motion';

export default function SkeletonPollCard() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        animation: 'pulse 1.8s ease-in-out infinite'
      }}
    >
      {/* Question Card Skeleton */}
      <div
        style={{
          background: '#161616',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '28px 20px',
          minHeight: '110px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <div
          style={{
            width: '80%',
            height: '18px',
            background: 'linear-gradient(90deg, #222222 0%, #2e2e2e 50%, #222222 100%)',
            borderRadius: '10px'
          }}
        />
        <div
          style={{
            width: '55%',
            height: '14px',
            background: 'linear-gradient(90deg, #222222 0%, #2e2e2e 50%, #222222 100%)',
            borderRadius: '8px'
          }}
        />
      </div>

      {/* 4 Candidate Cards Skeleton (2x2 Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: '#161616',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '20px',
              padding: '16px 8px',
              minHeight: '96px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {/* Avatar Circle Skeleton */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(90deg, #262626 0%, #333333 50%, #262626 100%)'
              }}
            />
            {/* Handle Bar Skeleton */}
            <div
              style={{
                width: '60px',
                height: '12px',
                background: 'linear-gradient(90deg, #222222 0%, #2e2e2e 50%, #222222 100%)',
                borderRadius: '6px'
              }}
            />
          </div>
        ))}
      </div>

      {/* Bottom Action Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px' }}>
        <div
          style={{
            width: '110px',
            height: '36px',
            borderRadius: '14px',
            background: '#161616',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        />
        <div
          style={{
            width: '80px',
            height: '36px',
            borderRadius: '14px',
            background: '#161616',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        />
      </div>
    </div>
  );
}
