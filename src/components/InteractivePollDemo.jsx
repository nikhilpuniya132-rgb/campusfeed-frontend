import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TiltCard from './TiltCard';

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    question: "Has the biggest drip in Class 11 🔥",
    options: [
      { id: 'opt1', name: 'Gursharan Singh', avatar: '😎', ring: 'gold' },
      { id: 'opt2', name: 'Piyush', avatar: '🔥', ring: 'crimsonFire' },
      { id: 'opt3', name: 'Harsh Pawar', avatar: '🦊', ring: 'neonPurple' },
      { id: 'opt4', name: 'Altaf', avatar: '👑', ring: 'blueEnergy' }
    ]
  },
  {
    id: 2,
    question: "Most likely to build a billion-dollar startup 🚀",
    options: [
      { id: 'opt3', name: 'Harsh Pawar', avatar: '🦊', ring: 'neonPurple' },
      { id: 'opt1', name: 'Gursharan Singh', avatar: '😎', ring: 'gold' },
      { id: 'opt4', name: 'Altaf', avatar: '👑', ring: 'blueEnergy' },
      { id: 'opt2', name: 'Piyush', avatar: '🔥', ring: 'crimsonFire' }
    ]
  },
  {
    id: 3,
    question: "The person everyone secretly has a crush on 👀",
    options: [
      { id: 'opt4', name: 'Altaf', avatar: '👑', ring: 'blueEnergy' },
      { id: 'opt2', name: 'Piyush', avatar: '🔥', ring: 'crimsonFire' },
      { id: 'opt1', name: 'Gursharan Singh', avatar: '😎', ring: 'gold' },
      { id: 'opt3', name: 'Harsh Pawar', avatar: '🦊', ring: 'neonPurple' }
    ]
  }
];

export default function InteractivePollDemo({ onCtaClick }) {
  const [qIndex, setQIndex] = useState(0);
  const [votedName, setVotedName] = useState(null);
  const [flameCount, setFlameCount] = useState(1284);
  const [isShuffling, setIsShuffling] = useState(false);

  const currentQ = SAMPLE_QUESTIONS[qIndex % SAMPLE_QUESTIONS.length];

  const handleVote = (opt) => {
    setVotedName(opt.name);
    setFlameCount(prev => prev + 1);

    setTimeout(() => {
      setVotedName(null);
      setQIndex(prev => prev + 1);
    }, 1200);
  };

  const handleShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setQIndex(prev => prev + 1);
      setIsShuffling(false);
    }, 300);
  };

  return (
    <TiltCard
      maxTilt={12}
      perspective={1200}
      className="interactive-demo-card overflow-visible"
      style={{
        width: '100%',
        maxWidth: 'min(380px, 100%)',
        borderRadius: '24px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        boxShadow: 'none',
        padding: 'clamp(16px, 4vw, 22px) clamp(14px, 3.5vw, 18px)',
        position: 'relative',
        userSelect: 'none',
        boxSizing: 'border-box',
        overflow: 'visible',
        touchAction: 'pan-y',
        height: 'auto',
        minHeight: 'auto'
      }}
    >
      {/* 3D Floating Tag */}
      <div className="overflow-visible" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', transform: 'translateZ(30px)', overflow: 'visible', touchAction: 'pan-y' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#000000', boxShadow: 'none' }} />
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Interactive Demo
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', color: '#111827' }}>
          <span>🔥</span> {flameCount.toLocaleString()} votes
        </div>
      </div>

      {/* Question Heading with 3D Depth */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="overflow-visible"
          style={{ transform: 'translateZ(35px)', height: 'auto', minHeight: 'auto', overflow: 'visible', touchAction: 'pan-y', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', margin: '0 0 20px 0' }}
        >
          <h3
            style={{
              fontSize: '20px',
              fontWeight: '900',
              lineHeight: '1.35',
              color: '#000000',
              margin: 0,
            }}
          >
            "{currentQ.question}"
          </h3>
        </motion.div>
      </AnimatePresence>

      {/* Feedback Overlay when Voted */}
      <AnimatePresence>
        {votedName && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="overflow-visible"
            style={{
              position: 'absolute',
              top: '55%',
              left: '50%',
              transform: 'translate(-50%, -50%) translateZ(60px)',
              background: '#000000',
              border: '1px solid #374151',
              padding: '16px 24px',
              borderRadius: '20px',
              color: '#ffffff',
              fontWeight: '900',
              fontSize: '16px',
              boxShadow: 'none',
              zIndex: 50,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'visible',
              pointerEvents: 'none'
            }}
          >
            <div>🔥 +1 Flame Sent!</div>
            <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>to {votedName}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4 Classmate Options Grid */}
      <motion.div
        animate={isShuffling ? { rotateY: 180, opacity: 0.3 } : { rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="overflow-visible"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '18px',
          transform: 'translateZ(25px)',
          overflow: 'visible',
          touchAction: 'pan-y',
          height: 'auto'
        }}
      >
        {currentQ.options.map((opt) => (
          <motion.button
            key={opt.id + qIndex}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.94, y: 1 }}
            onClick={() => handleVote(opt)}
            style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: 'clamp(12px, 3vw, 16px) 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              cursor: 'pointer',
              outline: 'none',
              transition: 'background 0.2s, border-color 0.2s',
              boxShadow: 'none',
              height: 'auto',
              minHeight: '88px',
              boxSizing: 'border-box',
              overflow: 'visible',
              touchAction: 'pan-y'
            }}
            className="gas-demo-opt-btn overflow-visible"
          >
            <div
              className="overflow-visible"
              style={{
                width: 'clamp(40px, 9vw, 46px)',
                height: 'clamp(40px, 9vw, 46px)',
                borderRadius: '50%',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(20px, 5vw, 24px)',
                marginBottom: '6px',
                border: '1px solid #e5e7eb',
                boxShadow: 'none',
                overflow: 'visible',
                pointerEvents: 'none'
              }}
            >
              {opt.avatar}
            </div>
            <span style={{ fontSize: 'clamp(12px, 3.2vw, 13px)', fontWeight: '800', textAlign: 'center', lineHeight: '1.2', color: '#000000', pointerEvents: 'none' }}>
              {opt.name}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Card Footer Actions */}
      <div className="overflow-visible" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', transform: 'translateZ(30px)', overflow: 'visible', touchAction: 'pan-y', height: 'auto' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShuffle}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '8px',
            touchAction: 'pan-y'
          }}
        >
          <span style={{ fontSize: '14px' }}>🔀</span> Shuffle Options
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCtaClick}
          style={{
            background: '#000000',
            border: 'none',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '20px',
            boxShadow: 'none',
            touchAction: 'pan-y'
          }}
        >
          Play For Real ➔
        </motion.button>
      </div>
    </TiltCard>
  );
}
