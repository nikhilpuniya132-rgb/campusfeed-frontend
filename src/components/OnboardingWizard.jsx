import React, { useState, useEffect } from 'react';
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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState('boy');
  const [profilePic, setProfilePic] = useState(googleUser?.avatar || '');
  const [grade, setGrade] = useState('11');
  const [refCode, setRefCode] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fromUrl = urlParams.get('ref');
      const fromStorage = localStorage.getItem('campus_ref_code');
      return (fromUrl || fromStorage || '').trim().replace(/^@/, '');
    } catch {
      return '';
    }
  });

  // Step 6 Classmates State
  const [suggestedClassmates, setSuggestedClassmates] = useState([]);
  const [addedFriends, setAddedFriends] = useState(new Set());
  const [isLoadingClassmates, setIsLoadingClassmates] = useState(false);
  const [shareToast, setShareToast] = useState('');

  // Fetch classmates when entering step 6
  useEffect(() => {
    if (step === 6) {
      setIsLoadingClassmates(true);
      fetch(`${API}/classmates/suggested?grade=${grade}`)
        .then(r => r.json())
        .then(d => {
          setSuggestedClassmates(d.classmates || []);
        })
        .catch(err => console.error('Failed to load classmates:', err))
        .finally(() => setIsLoadingClassmates(false));
    }
  }, [step, grade, API]);

  const shareUrl = `${window.location.origin}/?ref=${handle || 'campus'}`;
  const shareText = `Someone from St. Kabir voted for you on CampusFeed! Join to see who it is! Use my invite link:`;

  const handleCopyLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    }
    setShareToast('✓ Invite link copied! Share with classmates.');
    setTimeout(() => setShareToast(''), 3000);
  };

  const handleWhatsAppShare = async () => {
    const shareData = {
      title: 'CampusFeed',
      text: shareText,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareToast('✓ Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
      setShareToast('✓ Opening WhatsApp...');
    }
    setTimeout(() => setShareToast(''), 3000);
  };

  const handleInstagramShare = () => {
    handleCopyLink();
    window.open('https://www.instagram.com', '_blank');
    setShareToast('✓ Link copied! Paste in your Instagram story or bio.');
    setTimeout(() => setShareToast(''), 3500);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      return setErrorMsg('File size exceeds 2MB. Please choose a smaller photo.');
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const toggleAddFriend = (classmateId) => {
    setAddedFriends(prev => {
      const next = new Set(prev);
      if (next.has(classmateId)) next.delete(classmateId);
      else next.add(classmateId);
      return next;
    });
  };

  const nextStep = () => {
    setErrorMsg('');
    if (step === 1 && !name.trim()) {
      return setErrorMsg('Please enter your full name');
    }
    if (step === 2) {
      if (!handle.trim()) {
        return setErrorMsg('Please choose a handle for classmates to vote for you');
      }
      if (!password.trim()) {
        return setErrorMsg('Please create a password for your account');
      }
      if (password.length < 4) {
        return setErrorMsg('Password should be at least 4 characters');
      }
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
      const cleanRef = (refCode || localStorage.getItem('campus_ref_code') || '').trim().replace(/^@/, '');

      const res = await fetch(`${API}/user/complete-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: googleUser?.googleId,
          email: googleUser?.email,
          name: name.trim(),
          handle: handle.trim().replace(/^@/, ''),
          password: password.trim(),
          gender,
          school: 'St. Kabir Convent Senior Secondary School',
          city: 'Bathinda',
          grade: parseInt(grade) || 11,
          avatar: gender === 'girl' ? '🌸' : gender === 'boy' ? '😎' : '✨',
          profilePic: profilePic || '',
          refCode: cleanRef
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete profile');

      // Send friend requests for any classmates selected in Step 6
      if (addedFriends.size > 0 && data.user?.id) {
        Array.from(addedFriends).forEach(targetId => {
          fetch(`${API}/friends/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requesterId: data.user.id, receiverId: targetId })
          }).catch(e => console.error('Friend request error:', e));
        });
      }

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#ff5500', '#00f0ff', '#ff2e93', '#fbbf24']
      });

      // Clear referral code once registered
      localStorage.removeItem('campus_ref_code');

      // Lands directly on 3D Voting Game page (bypassing landing page entirely)
      onComplete(data.user);
    } catch (err) {
      console.error('Onboarding finish error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '460px',
        margin: '0 auto',
        padding: '24px 16px',
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      {/* Header & 6-Step Indicator */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              ← Back
            </button>
          ) : <div style={{ width: '60px' }} />}

          <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '1px', color: '#ff8800', textTransform: 'uppercase' }}>
            Step {step} of 6
          </span>

          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>
            🔥 St. Kabir
          </span>
        </div>

        {/* Progress Bar Indicator */}
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #ff5500, #ff2e93)', boxShadow: '0 0 10px #ff5500' }}
          />
        </div>
      </div>

      {/* 3D Glassmorphic Card Container */}
      <div
        style={{
          background: 'rgba(24, 25, 38, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '28px',
          padding: '28px 20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 85, 0, 0.15)',
          backdropFilter: 'blur(20px)',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP 1: NAME & BASIC INFO */}
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
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <span style={{ fontSize: '42px', display: 'inline-block', marginBottom: '8px' }}>👋</span>
                <h2 style={{ fontSize: '26px', fontWeight: '950', color: '#fff', margin: '0 0 6px 0' }}>What's your name?</h2>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>Classmates at St. Kabir will recognize you by this</p>
              </div>

              <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                    Full Name (from Google)
                  </label>
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

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                    Class / Grade
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {['9', '10', '11', '12'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        style={{
                          padding: '12px 6px',
                          borderRadius: '14px',
                          border: grade === g ? '2px solid #ff5500' : '1px solid rgba(255,255,255,0.1)',
                          background: grade === g ? 'rgba(255, 85, 0, 0.2)' : 'rgba(255,255,255,0.05)',
                          color: grade === g ? '#ff8800' : '#fff',
                          fontWeight: '900',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        Cl-{g}
                      </button>
                    ))}
                  </div>
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
                Next: Choose Handle ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2: USERNAME & PASSWORD */}
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
                <span style={{ fontSize: '42px', display: 'inline-block', marginBottom: '8px' }}>🔒</span>
                <h2 style={{ fontSize: '26px', fontWeight: '950', color: '#fff', margin: '0 0 6px 0' }}>Account Details</h2>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>Create your unique handle & password</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: 'auto 0' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                    Username (Handle)
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
                    Account Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 44px 14px 16px',
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
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '14px', cursor: 'pointer', fontSize: '18px' }}
                    >
                      {showPassword ? '👁️' : '🔒'}
                    </span>
                  </div>
                </div>

                {refCode && (
                  <div style={{ padding: '8px 12px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🎟️</span>
                    <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '800' }}>
                      Referred by: @{refCode}
                    </span>
                  </div>
                )}
              </div>

              {errorMsg && <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: '8px 0 0 0' }}>{errorMsg}</p>}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="magic-btn"
                style={{ width: '100%', marginTop: '24px' }}
              >
                Next: Select Gender ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 3: GENDER SELECTION (3D TACTILE BUTTONS) */}
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
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>Customizes compliments & voting questions</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: 'auto 0' }}>
                {[
                  { id: 'boy', label: 'Boy', emoji: '👦', desc: 'Gets blue flame votes' },
                  { id: 'girl', label: 'Girl', emoji: '👧', desc: 'Gets pink flame votes' },
                  { id: 'nonbinary', label: 'Non-binary / Other', emoji: '✨', desc: 'Gets purple flame votes' },
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
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      boxShadow: gender === g.id ? '0 0 20px rgba(255, 85, 0, 0.3)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '28px' }}>{g.emoji}</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '16px', fontWeight: '900' }}>{g.label}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{g.desc}</div>
                      </div>
                    </div>
                    {gender === g.id && <span style={{ color: '#ff8800', fontWeight: '900', fontSize: '18px' }}>✓</span>}
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
                Next: Profile Photo ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 4: PROFILE PICTURE UPLOAD */}
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
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '42px', display: 'inline-block', marginBottom: '8px' }}>📸</span>
                <h2 style={{ fontSize: '26px', fontWeight: '950', color: '#fff', margin: '0 0 6px 0' }}>Profile Picture</h2>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>Add a photo so friends recognise you</p>
              </div>

              <div style={{ margin: 'auto 0', textAlign: 'center' }}>
                {/* Photo Preview */}
                <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto 18px auto' }}>
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt="preview"
                      style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #ff5500',
                        boxShadow: '0 0 25px rgba(255, 85, 0, 0.4)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '2px dashed rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px',
                      }}
                    >
                      {gender === 'girl' ? '🌸' : gender === 'boy' ? '😎' : '✨'}
                    </div>
                  )}

                  <label
                    htmlFor="onboarding-pic-input"
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      background: 'linear-gradient(135deg, #ff5500, #ff2e93)',
                      color: '#fff',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                  >
                    ✏️
                  </label>
                  <input
                    id="onboarding-pic-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                <label
                  htmlFor="onboarding-pic-input"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    marginBottom: '12px',
                  }}
                >
                  📁 Choose from Gallery / Camera
                </label>

                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                  PNG, JPG, or WebP up to 2MB (or keep avatar)
                </p>
              </div>

              {errorMsg && <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: '8px 0 0 0' }}>{errorMsg}</p>}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextStep}
                className="magic-btn"
                style={{ width: '100%', marginTop: '24px' }}
              >
                Next: Viral Share ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 5: VIRAL INVITE STEP (WHATSAPP / INSTAGRAM WITH SKIP) */}
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
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '42px', display: 'inline-block', marginBottom: '6px' }}>🚀</span>
                <h2 style={{ fontSize: '26px', fontWeight: '950', color: '#fff', margin: '0 0 6px 0' }}>Invite Your Friends</h2>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: 0 }}>
                  Someone from <strong style={{ color: '#ff8800' }}>St. Kabir</strong> is already voting on you!
                </p>
              </div>

              {/* Referral Link Box */}
              <div
                style={{
                  margin: 'auto 0',
                  padding: '16px',
                  borderRadius: '20px',
                  background: 'linear-gradient(145deg, rgba(255, 85, 0, 0.12), rgba(0, 240, 255, 0.08))',
                  border: '1.5px solid rgba(255, 85, 0, 0.35)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '900', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  🎟️ YOUR REFERRAL INVITE LINK
                </div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#00f0ff', wordBreak: 'break-all', marginBottom: '10px' }}>
                  {shareUrl}
                </div>

                <div
                  onClick={handleCopyLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <span>📋</span> Copy Link
                </div>
              </div>

              {shareToast && (
                <div style={{ color: '#10b981', fontSize: '12px', fontWeight: '800', textAlign: 'center', margin: '8px 0' }}>
                  {shareToast}
                </div>
              )}

              {/* Prominent WhatsApp & Instagram Share Buttons */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleWhatsAppShare}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    color: '#fff',
                    fontSize: '14.5px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 20px rgba(37, 211, 102, 0.35)',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>📲</span> Share on WhatsApp
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleInstagramShare}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
                    color: '#fff',
                    fontSize: '14.5px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 20px rgba(253, 29, 29, 0.35)',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>📸</span> Share on Instagram
                </motion.button>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  {/* Clear Skip Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setDirection(1);
                      setStep(6);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.06)',
                      color: '#94a3b8',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    Skip for now ➔
                  </button>

                  {/* Next Step Button */}
                  <button
                    type="button"
                    onClick={nextStep}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #ff5500, #ff2e93)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '900',
                      cursor: 'pointer',
                    }}
                  >
                    Next: Add Friends ➔
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 6: ADD FRIENDS STEP (WITH SKIP & DIRECT VOTING DESTINATION) */}
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
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '40px', display: 'inline-block', marginBottom: '4px' }}>👥</span>
                <h2 style={{ fontSize: '24px', fontWeight: '950', color: '#fff', margin: '0 0 4px 0' }}>Add Classmates</h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Connect with students at St. Kabir to see poll results
                </p>
              </div>

              {/* Classmates List Container */}
              <div
                style={{
                  flex: 1,
                  maxHeight: '230px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingRight: '4px',
                  margin: '4px 0 14px 0',
                }}
              >
                {isLoadingClassmates ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                    Finding classmates in Class {grade}... ⚡
                  </div>
                ) : suggestedClassmates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                    You're the pioneer in your class! Invite your friends to start the feed.
                  </div>
                ) : (
                  suggestedClassmates.map(c => {
                    const isAdded = addedFriends.has(c.id);
                    return (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '16px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {c.profile_pic ? (
                              <img src={c.profile_pic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span>{c.avatar || '😎'}</span>
                            )}
                          </div>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#fff' }}>
                              @{c.handle}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              Class {c.grade || grade} • St. Kabir
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleAddFriend(c.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '10px',
                            border: isAdded ? '1px solid #10b981' : '1px solid rgba(255, 85, 0, 0.4)',
                            background: isAdded ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 85, 0, 0.2)',
                            color: isAdded ? '#10b981' : '#ff8800',
                            fontSize: '12px',
                            fontWeight: '900',
                            cursor: 'pointer',
                          }}
                        >
                          {isAdded ? '✓ Added' : '➕ Add'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {errorMsg && <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', margin: '0 0 10px 0' }}>{errorMsg}</p>}

              {/* Action Buttons: Skip & Start Voting */}
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                {/* Clear Skip Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinish}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.07)',
                    color: '#94a3b8',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  Skip ➔
                </button>

                {/* Final Destination: Start Voting Game Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting}
                  onClick={handleFinish}
                  className="magic-btn"
                  style={{ flex: 2, margin: 0, padding: '14px' }}
                >
                  {isSubmitting ? 'Entering St. Kabir Loop... ⚡' : 'Start Voting ➔'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
