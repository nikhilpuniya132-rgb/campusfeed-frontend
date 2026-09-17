import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', damping: 24, stiffness: 280 }
  },
  exit: (direction) => ({
    x: direction < 0 ? 120 : -120,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  })
};

export default function OnboardingWizard({ googleUser, API, onComplete }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const initialName = googleUser?.name || '';
  const initialHandle = initialName ? initialName.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

  const [name, setName] = useState(initialName);
  const [handle, setHandle] = useState(initialHandle);
  const [refCode, setRefCode] = useState('');
  const [gender, setGender] = useState('boy');
  const [city, setCity] = useState('Bathinda');
  const [school, setSchool] = useState('St. Kabir Convent Senior Secondary School');
  const [grade, setGrade] = useState('11');

  // Mock Native App Permissions
  const [locationGranted, setLocationGranted] = useState(true);
  const [contactsGranted, setContactsGranted] = useState(false);
  const [shareToast, setShareToast] = useState('');

  const fallbackCopy = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    }
    alert("Invite link copied to clipboard! Paste it in WhatsApp.");
    setContactsGranted(true);
  };

  const handleInviteShare = async (userHandle) => {
    const clean = (userHandle || handle || name || 'campus').replace(/^@/, '').trim();
    const shareData = {
      title: 'CampusFeed',
      text: `Someone from St. Kabir voted for you! Join to see who. Use code: ${clean}`,
      url: 'https://campusfeed-frontend.vercel.app'
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setContactsGranted(true);
      } catch (err) {
        if (err.name !== 'AbortError') {
          fallbackCopy(shareData.text + " " + shareData.url);
        } else {
          setContactsGranted(true);
        }
      }
    } else {
      fallbackCopy(shareData.text + " " + shareData.url);
    }
  };

  const handleAllowLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationGranted(true);
          setCity('Bathinda');
        },
        () => {
          setLocationGranted(true);
        }
      );
    } else {
      setLocationGranted(true);
    }
  };

  const nextStep = () => {
    setErrorMsg('');
    if (step === 1 && !name.trim()) {
      return setErrorMsg('Please enter your full name');
    }
    if (step === 2 && !handle.trim()) {
      return setErrorMsg('Please choose a handle for classmates to vote for you');
    }
    setDirection(1);
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setErrorMsg('');
    setDirection(-1);
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/user/complete-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: googleUser?.googleId,
          email: googleUser?.email,
          name: name.trim(),
          handle: handle.trim().replace(/^@/, ''),
          gender,
          city,
          school,
          grade: parseInt(grade) || 11,
          avatar: gender === 'girl' ? '🌸' : gender === 'boy' ? '😎' : '✨',
          profilePic: googleUser?.avatar || '',
          refCode: refCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete profile');

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#ff5500', '#ff2e93', '#fbbf24', '#00f0ff']
      });

      if (data.user) {
        onComplete(data.user);
      }
    } catch (err) {
      setErrorMsg(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '420px',
        margin: '0 auto',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '20px 16px',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Top Header & Progress Bar */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          {step > 1 ? (
            <button
              onClick={prevStep}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#cbd5e1',
                padding: '6px 14px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
          ) : <div style={{ width: '60px' }} />}

          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '1px', color: '#ff8800', textTransform: 'uppercase' }}>
            Step {step} of 6
          </span>

          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold' }}>
            🔥 Gas Loop
          </span>
        </div>

        {/* 6-Step Progress Bar Indicator */}
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #ff5500, #ff2e93)', boxShadow: '0 0 10px #ff5500' }}
          />
        </div>
      </div>

      {/* 3D Glassmorphic Card Step Container */}
      <div
        style={{
          background: 'rgba(24, 25, 38, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '28px',
          padding: '28px 20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 85, 0, 0.15)',
          backdropFilter: 'blur(20px)',
          minHeight: '380px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP 1: FULL NAME */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '42px', display: 'inline-block', marginBottom: '8px' }}>👋</span>
                <h2 style={{ fontSize: '26px', fontWeight: '950', color: '#fff', margin: '0 0 6px 0' }}>What's your name?</h2>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>Classmates in St. Kabir will recognize you by this</p>
              </div>

              <div style={{ margin: 'auto 0' }}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1.5px solid rgba(255, 85, 0, 0.4)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: '800',
                    outline: 'none',
                    textAlign: 'center',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
                  }}
                />
              </div>

              {errorMsg && <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: '8px 0 0 0' }}>{errorMsg}</p>}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="magic-btn"
                style={{ width: '100%', marginTop: '24px' }}
              >
                Next ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2: USERNAME / HANDLE & INVITE CODE */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '42px', display: 'inline-block', marginBottom: '8px' }}>🏷️</span>
                <h2 style={{ fontSize: '26px', fontWeight: '950', color: '#fff', margin: '0 0 6px 0' }}>Pick your handle</h2>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>Your unique tag for anonymous compliments</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: 'auto 0' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                    Username
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '16px', color: '#ff8800', fontWeight: '900', fontSize: '18px' }}>@</span>
                    <input
                      type="text"
                      placeholder="username"
                      value={handle}
                      onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      style={{
                        width: '100%',
                        padding: '14px 16px 14px 38px',
                        borderRadius: '16px',
                        border: '1.5px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(0, 0, 0, 0.4)',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: '800',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                    Invite Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Got an invite from a friend?"
                    value={refCode}
                    onChange={e => setRefCode(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.4)',
                      color: '#fbbf24',
                      fontSize: '15px',
                      fontWeight: '800',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {errorMsg && <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: '8px 0 0 0' }}>{errorMsg}</p>}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="magic-btn"
                style={{ width: '100%', marginTop: '24px' }}
              >
                Next ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 3: GENDER */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '42px', display: 'inline-block', marginBottom: '8px' }}>✨</span>
                <h2 style={{ fontSize: '26px', fontWeight: '950', color: '#fff', margin: '0 0 6px 0' }}>Select your gender</h2>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>Helps filter questions like "Best looking boy/girl"</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: 'auto 0' }}>
                {[
                  { id: 'boy', label: 'Boy', emoji: '👦', gradient: 'linear-gradient(135deg, #00f0ff, #3b82f6)' },
                  { id: 'girl', label: 'Girl', emoji: '👧', gradient: 'linear-gradient(135deg, #ff2e93, #f43f5e)' },
                  { id: 'nonbinary', label: 'Non-binary / Other', emoji: '✨', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)' },
                ].map((g) => (
                  <motion.button
                    key={g.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setGender(g.id);
                      setDirection(1);
                      setStep(4);
                    }}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '18px',
                      border: gender === g.id ? '2px solid #ff5500' : '1px solid rgba(255, 255, 255, 0.14)',
                      background: gender === g.id ? 'rgba(255, 85, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '16px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      boxShadow: gender === g.id ? '0 0 20px rgba(255, 85, 0, 0.3)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{g.emoji}</span>
                      <span>{g.label}</span>
                    </div>
                    {gender === g.id && <span style={{ color: '#ff8800' }}>✓</span>}
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="magic-btn"
                style={{ width: '100%', marginTop: '24px' }}
              >
                Next ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 4: SCHOOL & LOCATION (VIRAL NATIVE APP VIBES) */}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <span style={{ fontSize: '42px', display: 'inline-block', marginBottom: '8px' }}>🏫</span>
                <h2 style={{ fontSize: '26px', fontWeight: '950', color: '#fff', margin: '0 0 6px 0' }}>Your School</h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Locking in with your campus community</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: 'auto 0' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                    City / District
                  </label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.4)',
                      color: '#fff',
                      fontSize: '15px',
                      fontWeight: '700',
                      outline: 'none',
                    }}
                  >
                    <option value="Bathinda">Bathinda (Punjab)</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Delhi">Delhi NCR</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                    School
                  </label>
                  <select
                    value={school}
                    onChange={e => setSchool(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid rgba(255, 85, 0, 0.4)',
                      background: 'rgba(0, 0, 0, 0.4)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: '800',
                      outline: 'none',
                    }}
                  >
                    <option value="St. Kabir Convent Senior Secondary School">
                      St. Kabir Convent Senior Secondary School
                    </option>
                    <option value="Delhi Public School">Delhi Public School</option>
                    <option value="Saint Paul High School">Saint Paul High School</option>
                  </select>
                </div>

                {/* Mock Native App Permissions to boost viral social vibe */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleAllowLocation}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: locationGranted ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                      background: locationGranted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                      color: locationGranted ? '#10b981' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    {locationGranted ? '📍 Location Locked' : '📍 Allow Location'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInviteShare(handle || name)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: contactsGranted ? '1.5px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
                      background: contactsGranted ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255,255,255,0.05)',
                      color: contactsGranted ? '#00f0ff' : '#94a3b8',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: contactsGranted ? '0 0 15px rgba(0, 240, 255, 0.3)' : 'none',
                    }}
                  >
                    {contactsGranted ? '👥 Classmates Synced ✓' : '👥 Allow Contacts'}
                  </button>
                </div>

                {shareToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(0, 240, 255, 0.15)',
                      border: '1px solid #00f0ff',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      marginTop: '8px',
                      textAlign: 'center',
                      color: '#00f0ff',
                      fontSize: '12px',
                      fontWeight: '800',
                    }}
                  >
                    {shareToast}
                  </motion.div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="magic-btn"
                style={{ width: '100%', marginTop: '20px' }}
              >
                Next ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 5: GRADE SELECTION */}
          {step === 5 && (
            <motion.div
              key="step5"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '42px', display: 'inline-block', marginBottom: '8px' }}>🎓</span>
                <h2 style={{ fontSize: '26px', fontWeight: '950', color: '#fff', margin: '0 0 6px 0' }}>Select your class</h2>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>You will vote and receive compliments with this batch</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: 'auto 0' }}>
                {[
                  { val: '9', label: 'Class 9', badge: '🌱 FRESHMEN' },
                  { val: '10', label: 'Class 10', badge: '⚡ SOPHOMORES' },
                  { val: '11', label: 'Class 11', badge: '🔥 HOT' },
                  { val: '12', label: 'Class 12', badge: '👑 SENIORS' },
                ].map((c) => (
                  <motion.button
                    key={c.val}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setGrade(c.val)}
                    style={{
                      padding: '18px 8px',
                      borderRadius: '18px',
                      border: grade === c.val ? '2.5px solid #ff5500' : '1px solid rgba(255, 255, 255, 0.14)',
                      background: grade === c.val ? 'rgba(255, 85, 0, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                      color: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: grade === c.val ? '0 0 22px rgba(255, 85, 0, 0.35)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#ff8800', marginBottom: '4px' }}>{c.badge}</span>
                    <span style={{ fontSize: '17px', fontWeight: '950' }}>{c.label}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>St. Kabir</span>
                  </motion.button>
                ))}
              </div>

              {errorMsg && <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: '8px 0 0 0' }}>{errorMsg}</p>}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="magic-btn"
                style={{ width: '100%', marginTop: '24px' }}
              >
                Next: Invite Friends ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 6: DEDICATED HIGH-VISIBILITY "INVITE YOUR FRIENDS" SCREEN */}
          {step === 6 && (
            <motion.div
              key="step6"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '44px', display: 'inline-block', marginBottom: '6px' }}>🚀</span>
                <h2 style={{ fontSize: '26px', fontWeight: '950', color: '#fff', margin: '0 0 6px 0' }}>Invite Your Friends</h2>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                  Someone from <strong style={{ color: '#ff8800' }}>St. Kabir</strong> is already voting on you! Invite 3 friends to see who voted.
                </p>
              </div>

              {/* Unique Invite Pass Box */}
              <div
                style={{
                  margin: 'auto 0',
                  padding: '16px',
                  borderRadius: '20px',
                  background: 'linear-gradient(145deg, rgba(255, 85, 0, 0.12), rgba(0, 240, 255, 0.08))',
                  border: '1.5px solid rgba(255, 85, 0, 0.35)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  🎟️ YOUR UNIQUE INVITE CODE
                </div>
                <div style={{ fontSize: '24px', fontWeight: '950', color: '#fff', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  @{handle || 'campus'}
                </div>

                <div
                  onClick={() => fallbackCopy(`Someone from St. Kabir voted for you on CampusFeed! Join to see who: https://campusfeed-frontend.vercel.app (Code: ${handle})`)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#00f0ff',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                  }}
                >
                  <span>📋</span> Copy Invite Link & Code
                </div>
              </div>

              {/* Glowing 3D Share Button */}
              <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleInviteShare(handle)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '18px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #00f0ff, #0088ff)',
                    color: '#050c1e',
                    fontSize: '15px',
                    fontWeight: '950',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 30px rgba(0, 240, 255, 0.7), 0 8px 24px rgba(0,0,0,0.5)',
                    letterSpacing: '0.3px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>📲</span> Share & Invite on WhatsApp
                </motion.button>

                {contactsGranted && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', color: '#10b981', fontSize: '12px', fontWeight: '800' }}
                  >
                    ✓ Invite link shared / copied! Classmates synced.
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  onClick={handleFinish}
                  className="magic-btn"
                  style={{ width: '100%', margin: '4px 0 0 0' }}
                >
                  {isSubmitting ? 'Entering St. Kabir Loop... ⚡' : 'Enter CampusFeed ➔'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
