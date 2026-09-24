import React from 'react';

export default function SkeletonExplore() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
      {/* Top Banner Skeleton */}
      <div
        style={{
          height: '110px',
          background: '#161616',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          animation: 'pulse 1.8s ease-in-out infinite'
        }}
      />

      {/* Grid of Poll Skeletons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: '#161616',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'pulse 1.8s ease-in-out infinite'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <div
                style={{
                  width: '75%',
                  height: '14px',
                  background: 'linear-gradient(90deg, #222222 0%, #2e2e2e 50%, #222222 100%)',
                  borderRadius: '6px'
                }}
              />
              <div
                style={{
                  width: '40%',
                  height: '11px',
                  background: 'linear-gradient(90deg, #222222 0%, #2e2e2e 50%, #222222 100%)',
                  borderRadius: '5px'
                }}
              />
            </div>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#222222'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
