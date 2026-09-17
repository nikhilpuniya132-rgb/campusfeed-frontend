import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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

    // Fire Confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff6200', '#ff2e93', '#fbbf24', '#00f0ff']
    });

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
      className="interactive-demo-card"
      style={{
        width: '100%',
        maxWidth: 'min(380px, 100%)',
        borderRadius: '24px',
        background: 'linear-gradient(165deg, rgba(30, 32, 48, 0.85) 0%, rgba(15, 16, 24, 0.95) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 98, 0, 0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(255, 98, 0, 0.15)',
        padding: 'clamp(16px, 4vw, 22px) clamp(14px, 3.5vw, 18px)',
        position: 'relative',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* 3D Floating Tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', transform: 'translateZ(30px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#ff6200', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Interactive Demo
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 98, 0, 0.15)', border: '1px solid rgba(255, 98, 0, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', color: '#ff8800' }}>
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
          style={{ transform: 'translateZ(35px)', minHeight: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', margin: '0 0 20px 0' }}
        >
          <h3
            style={{
              fontSize: '20px',
              fontWeight: '900',
              lineHeight: '1.35',
              color: '#ffffff',
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
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
            style={{
              position: 'absolute',
              top: '55%',
              left: '50%',
              transform: 'translate(-50%, -50%) translateZ(60px)',
              background: 'linear-gradient(135deg, #ff6200, #ff2e93)',
              padding: '16px 24px',
              borderRadius: '20px',
              color: '#fff',
              fontWeight: '900',
              fontSize: '16px',
              boxShadow: '0 10px 30px rgba(255, 98, 0, 0.6)',
              zIndex: 50,
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <div>🔥 +1 Flame Sent!</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>to {votedName}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4 Classmate Options Grid */}
      <motion.div
        animate={isShuffling ? { rotateY: 180, opacity: 0.3 } : { rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '18px',
          transform: 'translateZ(25px)',
        }}
      >
        {currentQ.options.map((opt) => (
          <motion.button
            key={opt.id + qIndex}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.94, y: 1 }}
            onClick={() => handleVote(opt)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              padding: 'clamp(12px, 3vw, 16px) 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
              boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
              minHeight: '88px',
              boxSizing: 'border-box',
            }}
            className="gas-demo-opt-btn"
          >
            <div
              style={{
                width: 'clamp(40px, 9vw, 46px)',
                height: 'clamp(40px, 9vw, 46px)',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(20px, 5vw, 24px)',
                marginBottom: '6px',
                border: opt.ring === 'gold' ? '2.5px solid #fbbf24' : '2px solid rgba(255,255,255,0.2)',
                boxShadow: opt.ring === 'gold' ? '0 0 12px rgba(251, 191, 36, 0.6)' : 'none',
              }}
            >
              {opt.avatar}
            </div>
            <span style={{ fontSize: 'clamp(12px, 3.2vw, 13px)', fontWeight: '800', textAlign: 'center', lineHeight: '1.2' }}>
              {opt.name}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Card Footer Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', transform: 'translateZ(30px)' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShuffle}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a1a1aa',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '8px',
          }}
        >
          <span style={{ fontSize: '14px' }}>🔀</span> Shuffle Options
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCtaClick}
          style={{
            background: 'linear-gradient(135deg, #ff6200, #ff8800)',
            border: 'none',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer',
            padding: '8px 16px',
            borderRadius: '20px',
            boxShadow: '0 4px 12px rgba(255, 98, 0, 0.4)',
          }}
        >
          Play For Real ➔
        </motion.button>
      </div>
    </TiltCard>
  );
}
