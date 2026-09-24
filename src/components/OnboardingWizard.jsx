import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import InstituteCombobox, { findHubForInstitute } from './InstituteCombobox';

// Hardware-accelerated step transitions (opacity + transform only)
const stepVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 26,
      stiffness: 320,
    }
  },
  exit: (direction) => ({
    x: direction < 0 ? 30 : -30,
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

export default function OnboardingWizard({ googleUser, API, onComplete }) {
  // Step navigation (1 through 6 UI steps, completing leads to step 7 / feed)
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const initialName = googleUser?.name || '';
  const initialHandle = initialName ? initialName.toLowerCase().replace(/[^a-z0-9_]/g, '') : '';

  const [name, setName] = useState(initialName);
  const [handle, setHandle] = useState(initialHandle);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState('boy');
  const [profilePic, setProfilePic] = useState(googleUser?.avatar || '');
  const [avatarEmoji, setAvatarEmoji] = useState('😎');
  const [institute, setInstitute] = useState('Kapil Institute');
  const [coachingHub, setCoachingHub] = useState('Ajit Road Hub');
  const [stream, setStream] = useState('11th Medical');
  const [grade, setGrade] = useState('11');
  const [city] = useState('Bathinda'); // Frictionless: Fixed default city
  const [refCode] = useState(() => {
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

  // Dynamic invite link
  const safeHandle = (handle || 'campus').replace(/^@/, '').toLowerCase();
  const shareUrl = `${window.location.origin}/?ref=${safeHandle}`;
  const shareText = `Someone from your coaching hub voted for you on CenterInsider! Join to see who it is. Use my invite link: ${shareUrl}`;

  const handleCopyLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText);
    }
    setShareToast('Link copied to clipboard!');
    setTimeout(() => setShareToast(''), 3000);
  };

  const handleWhatsAppShare = async () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
    setShareToast('Opening WhatsApp...');
    setTimeout(() => setShareToast(''), 3000);
  };

  const handleInstagramShare = () => {
    handleCopyLink();
    window.open('https://www.instagram.com', '_blank');
    setShareToast('Link copied! Paste in your Instagram story or bio.');
    setTimeout(() => setShareToast(''), 3500);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      return setErrorMsg('Photo exceeds 2.5MB. Please choose a smaller image.');
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
    if (step === 1) {
      if (!name.trim()) {
        return setErrorMsg('Please enter your full name');
      }
      if (!institute.trim()) {
        return setErrorMsg('Please select your coaching institute');
      }
    }
    if (step === 2) {
      if (!handle.trim()) {
        return setErrorMsg('Please enter a username');
      }
      if (handle.trim().length < 3) {
        return setErrorMsg('Username must be at least 3 characters');
      }
      if (!password.trim()) {
        return setErrorMsg('Please create an account password');
      }
      if (password.trim().length < 4) {
        return setErrorMsg('Password should be at least 4 characters');
      }
    }
    setDirection(1);
    setStep(prev => Math.min(6, prev + 1));
  };

  const prevStep = () => {
    setErrorMsg('');
    setDirection(-1);
    setStep(prev => Math.max(1, prev - 1));
  };

  // STEP 7: Final Routing & Submission
  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const cleanRef = (refCode || localStorage.getItem('campus_ref_code') || '').trim().replace(/^@/, '');
      const finalAvatar = gender === 'girl' ? (avatarEmoji === '😎' ? '🌸' : avatarEmoji) : avatarEmoji;

      const res = await fetch(`${API}/user/complete-onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: googleUser?.googleId,
          email: googleUser?.email,
          name: name.trim(),
          handle: handle.trim().replace(/^@/, '').toLowerCase(),
          password: password.trim(),
          gender,
          school: institute.trim(),
          institute: institute.trim(),
          coaching_hub: coachingHub || findHubForInstitute(institute),
          stream: stream,
          city: 'Bathinda',
          grade: stream.includes('12') ? 12 : stream.includes('drop') ? 'dropper' : 11,
          avatar: finalAvatar,
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
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#ffffff', '#fbbf24', '#38bdf8', '#34d399']
      });

      // Clear referral code from storage
      localStorage.removeItem('campus_ref_code');

      // Direct zero-jank transition to voting game feed
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
        maxWidth: '440px',
        margin: '0 auto',
        padding: '16px 16px 32px 16px',
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxSizing: 'border-box',
        background: '#000000',
        color: '#ffffff',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Geist', 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* Top Header & Minimalist Step Indicator */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888888',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>←</span> Back
            </button>
          ) : (
            <div style={{ width: '48px' }} />
          )}

          <span
            style={{
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '0.08em',
              color: '#888888',
              textTransform: 'uppercase'
            }}
          >
            Step {step} of 6
          </span>

          <span
            style={{
              fontSize: '10.5px',
              color: '#ff7700',
              fontWeight: '900',
              letterSpacing: '0.04em'
            }}
          >
            🔥 BATHINDA COACHING NETWORK
          </span>
        </div>

        {/* Surface Step Progress Line */}
        <div
          style={{
            width: '100%',
            height: '2px',
            background: '#1c1c1f',
            borderRadius: '1px',
            overflow: 'hidden'
          }}
        >
          <motion.div
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', background: '#ffffff' }}
          />
        </div>
      </div>

      {/* Surface 1: Main Minimalist Container Enclosure */}
      <div
        style={{
          background: '#0f1011',
          border: '1px solid #222222',
          borderRadius: '24px',
          padding: '28px 20px',
          minHeight: '430px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxSizing: 'border-box'
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          {/* ========================================================
              STEP 1: NAME & BASIC INFO
             ======================================================== */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Select your Coaching Hub to enter the loop.
                </h2>
                <p style={{ fontSize: '12.5px', color: '#888888', margin: 0, lineHeight: '1.4' }}>
                  Connect with peers across Ajit Road, 100 Feet Rd & Bathinda centres.
                </p>
              </div>

              <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: '14px',
                      border: '1px solid #262626',
                      background: '#161616',
                      color: '#ffffff',
                      fontSize: '14.5px',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Searchable Institute Combobox */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Coaching Institute
                  </label>
                  <InstituteCombobox
                    value={institute}
                    onChange={(val) => {
                      setInstitute(val);
                      setCoachingHub(findHubForInstitute(val));
                    }}
                    onSelectHub={(hub) => setCoachingHub(hub)}
                  />
                  <div style={{ marginTop: '5px', fontSize: '11.5px', color: '#ff7700', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📍 Hub:</span>
                    <span>{coachingHub || findHubForInstitute(institute)}</span>
                  </div>
                </div>

                {/* Stream Selection Pills (11th Medical, 11th Non-Med, 12th Commerce, Dropper) */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Batch / Stream
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      overflowX: 'auto',
                      whiteSpace: 'nowrap',
                      gap: '8px',
                      padding: '2px 2px 8px 2px',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch'
                    }}
                    className="overflow-x-auto whitespace-nowrap no-scrollbar"
                  >
                    {['11th Medical', '11th Non-Med', '12th Commerce', 'Dropper'].map(s => {
                      const isSelected = stream === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            if (window.navigator?.vibrate) window.navigator.vibrate(8);
                            setStream(s);
                            setGrade(s.includes('12') ? '12' : s.includes('drop') ? 'dropper' : '11');
                          }}
                          style={{
                            flexShrink: 0,
                            padding: '10px 16px',
                            borderRadius: '12px',
                            border: isSelected ? '1px solid #ff5500' : '1px solid #222222',
                            background: isSelected ? 'rgba(255, 85, 0, 0.15)' : '#141416',
                            color: isSelected ? '#ffffff' : '#888888',
                            fontWeight: '800',
                            fontSize: '12.5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 0 12px rgba(255, 85, 0, 0.25)' : 'none'
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {errorMsg && (
                <p style={{ color: '#f87171', fontSize: '12.5px', textAlign: 'center', margin: '8px 0 0 0' }}>
                  {errorMsg}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={nextStep}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#000000',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Continue ➔
              </motion.button>
            </motion.div>
          )}

          {/* ========================================================
              STEP 2: ACCOUNT CREATION (HANDLE & PASSWORD)
             ======================================================== */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Account details
                </h2>
                <p style={{ fontSize: '13px', color: '#888888', margin: 0, lineHeight: '1.4' }}>
                  Set your username and secure account password.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: 'auto 0' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Username (Handle)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '16px', color: '#888888', fontWeight: '800', fontSize: '15px' }}>
                      @
                    </span>
                    <input
                      type="text"
                      placeholder="username"
                      value={handle}
                      onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '14px 16px 14px 34px',
                        borderRadius: '14px',
                        border: '1px solid #262626',
                        background: '#161616',
                        color: '#ffffff',
                        fontSize: '15px',
                        fontWeight: '700',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
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
                        borderRadius: '14px',
                        border: '1px solid #262626',
                        background: '#161616',
                        color: '#ffffff',
                        fontSize: '15px',
                        fontWeight: '700',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: '#888888',
                        cursor: 'pointer',
                        fontSize: '13px',
                        padding: '6px',
                        fontWeight: '700'
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#666666', marginTop: '4px', display: 'block' }}>
                    Use this password to sign back in from any device.
                  </span>
                </div>
              </div>

              {errorMsg && (
                <p style={{ color: '#f87171', fontSize: '12.5px', textAlign: 'center', margin: '8px 0 0 0' }}>
                  {errorMsg}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={nextStep}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#000000',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Next: Choose Gender ➔
              </motion.button>
            </motion.div>
          )}

          {/* ========================================================
              STEP 3: GENDER SELECTION
             ======================================================== */}
          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Select your gender
                </h2>
                <p style={{ fontSize: '13px', color: '#888888', margin: 0, lineHeight: '1.4' }}>
                  Helps friends identify who voted for them via flame colors.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: 'auto 0' }}>
                {[
                  { id: 'boy', label: 'Boy', emoji: '😎', flameNote: 'Blue Flame on votes' },
                  { id: 'girl', label: 'Girl', emoji: '🌸', flameNote: 'Pink Flame on votes' },
                  { id: 'non-binary', label: 'Non-binary', emoji: '✨', flameNote: 'Gold Flame on votes' }
                ].map(item => {
                  const isSelected = gender === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setGender(item.id);
                        setAvatarEmoji(item.emoji);
                      }}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '16px',
                        border: isSelected ? '1px solid #ffffff' : '1px solid #222222',
                        background: isSelected ? '#ffffff' : '#141416',
                        color: isSelected ? '#000000' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease, border-color 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '22px' }}>{item.emoji}</span>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '15px', fontWeight: '800', display: 'block' }}>
                            {item.label}
                          </span>
                          <span style={{ fontSize: '12px', color: isSelected ? '#444444' : '#888888' }}>
                            {item.flameNote}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '5px solid #000000' : '2px solid #444444',
                          background: isSelected ? '#ffffff' : 'transparent',
                          boxSizing: 'border-box'
                        }}
                      />
                    </motion.button>
                  );
                })}
              </div>

              {errorMsg && (
                <p style={{ color: '#f87171', fontSize: '12.5px', textAlign: 'center', margin: '8px 0 0 0' }}>
                  {errorMsg}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={nextStep}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#000000',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Continue ➔
              </motion.button>
            </motion.div>
          )}

          {/* ========================================================
              STEP 4: PROFILE PICTURE
             ======================================================== */}
          {step === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Profile picture
                </h2>
                <p style={{ fontSize: '13px', color: '#888888', margin: 0, lineHeight: '1.4' }}>
                  Upload a photo or choose an avatar icon.
                </p>
              </div>

              {/* Avatar Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 'auto 0' }}>
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt="profile preview"
                      style={{
                        width: '88px',
                        height: '88px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #ffffff'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '88px',
                        height: '88px',
                        borderRadius: '50%',
                        background: '#161616',
                        border: '1px solid #262626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '44px'
                      }}
                    >
                      {avatarEmoji}
                    </div>
                  )}

                  {profilePic && (
                    <button
                      type="button"
                      onClick={() => setProfilePic('')}
                      style={{
                        position: 'absolute',
                        bottom: '0px',
                        right: '-4px',
                        background: '#18181b',
                        border: '1px solid #333333',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        color: '#f87171',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove photo"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Upload Action */}
                <label
                  style={{
                    padding: '8px 18px',
                    borderRadius: '12px',
                    background: '#18181b',
                    border: '1px solid #2a2a2e',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '18px'
                  }}
                >
                  <span>📷</span>
                  <span>{profilePic ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>

                {/* Quick Emoji Avatar Fallbacks */}
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', textAlign: 'center', marginBottom: '8px' }}>
                    Or pick an avatar
                  </span>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {['😎', '🌸', '⚡', '👑', '🦄', '🚀'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setAvatarEmoji(emoji);
                          setProfilePic('');
                        }}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          border: (!profilePic && avatarEmoji === emoji) ? '1px solid #ffffff' : '1px solid #222222',
                          background: (!profilePic && avatarEmoji === emoji) ? '#222222' : '#141416',
                          fontSize: '18px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {errorMsg && (
                <p style={{ color: '#f87171', fontSize: '12.5px', textAlign: 'center', margin: '8px 0 0 0' }}>
                  {errorMsg}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={nextStep}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#ffffff',
                  color: '#000000',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Continue ➔
              </motion.button>
            </motion.div>
          )}

          {/* ========================================================
              STEP 5: THE VIRAL LOOP (INVITE FRIENDS)
             ======================================================== */}
          {step === 5 && (
            <motion.div
              key="step5"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Invite your friends
                </h2>
                <p style={{ fontSize: '13px', color: '#888888', margin: 0, lineHeight: '1.4' }}>
                  CenterInsider is built for you and your coaching batch.
                </p>
              </div>

              {/* Referral Link Card */}
              <div
                style={{
                  background: '#141416',
                  border: '1px solid #222222',
                  borderRadius: '16px',
                  padding: '14px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}
              >
                <div style={{ overflow: 'hidden', textAlign: 'left' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                    Your Personal Invite Link
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {shareUrl.replace(/^https?:\/\//, '')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid #333333',
                    background: '#222222',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  Copy
                </button>
              </div>

              {/* Direct Social Share Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleWhatsAppShare}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '14px',
                    border: 'none',
                    background: '#25D366',
                    color: '#000000',
                    fontSize: '13.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>📲</span>
                  <span>Share on WhatsApp</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleInstagramShare}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '14px',
                    border: '1px solid #2a2a2e',
                    background: '#18181b',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>📸</span>
                  <span>Share on Instagram</span>
                </motion.button>
              </div>

              {shareToast && (
                <p style={{ color: '#34d399', fontSize: '12px', textAlign: 'center', margin: '4px 0 0 0', fontWeight: '700' }}>
                  ✓ {shareToast}
                </p>
              )}

              {/* Primary Next Action + Explicit Skip For Now Button */}
              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={nextStep}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: '#ffffff',
                    color: '#000000',
                    fontSize: '14.5px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  Continue to Classmates ➔
                </motion.button>

                <button
                  type="button"
                  onClick={nextStep}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666666',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              STEP 6: ADD CLASSMATES (BENTO GRID)
             ======================================================== */}
          {step === 6 && (
            <motion.div
              key="step6"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '21px', fontWeight: '800', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                  Add classmates
                </h2>
                <p style={{ fontSize: '12.5px', color: '#888888', margin: 0, lineHeight: '1.4' }}>
                  Send quick friend requests to peers in your coaching hub.
                </p>
              </div>

              {/* Classmates Bento Grid */}
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '250px', paddingRight: '2px', marginBottom: '14px' }}>
                {isLoadingClassmates ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#888888', fontSize: '13px' }}>
                    Finding classmates in Class {grade}...
                  </div>
                ) : suggestedClassmates.length === 0 ? (
                  <div style={{ padding: '30px 10px', textAlign: 'center', color: '#888888', background: '#141416', borderRadius: '16px', border: '1px solid #222222' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#ffffff', fontWeight: '700' }}>You're an early bird!</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#777777' }}>Share your link so friends can join your class feed.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {suggestedClassmates.map(c => {
                      const isAdded = addedFriends.has(c.id);
                      return (
                        <div
                          key={c.id}
                          style={{
                            background: '#141416',
                            border: '1px solid #222222',
                            borderRadius: '16px',
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            boxSizing: 'border-box'
                          }}
                        >
                          {c.profile_pic ? (
                            <img
                              src={c.profile_pic}
                              alt={c.handle}
                              style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', marginBottom: '6px' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: '#1c1c1f',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                marginBottom: '6px'
                              }}
                            >
                              {c.avatar || '😎'}
                            </div>
                          )}

                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            @{c.handle}
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#777777', marginBottom: '8px' }}>
                            Class {c.grade || grade}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleAddFriend(c.id)}
                            style={{
                              width: '100%',
                              padding: '6px 0',
                              borderRadius: '10px',
                              border: isAdded ? '1px solid #2a2a2e' : 'none',
                              background: isAdded ? '#1c1c1f' : '#ffffff',
                              color: isAdded ? '#a1a1aa' : '#000000',
                              fontSize: '11.5px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isAdded ? '✓ Added' : '+ Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {errorMsg && (
                <p style={{ color: '#f87171', fontSize: '12.5px', textAlign: 'center', margin: '0 0 8px 0' }}>
                  {errorMsg}
                </p>
              )}

              {/* STEP 7: Route to Feed on finish or skip */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={isSubmitting}
                  onClick={handleFinish}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: '#ffffff',
                    color: '#000000',
                    fontSize: '14.5px',
                    fontWeight: '800',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                >
                  {isSubmitting
                    ? 'Entering Network...'
                    : addedFriends.size > 0
                    ? `Add ${addedFriends.size} Friend${addedFriends.size > 1 ? 's' : ''} & Start ➔`
                    : 'Finish & Start Voting ➔'}
                </motion.button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinish}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666666',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: '6px'
                  }}
                >
                  Skip
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
