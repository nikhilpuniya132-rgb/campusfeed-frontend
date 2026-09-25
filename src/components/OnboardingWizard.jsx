import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InstituteCombobox, { findHubForInstitute } from './InstituteCombobox';
import { supabase } from '../supabase';

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
  // Step navigation (Strict order: 1. Institute/Class -> 2. Username -> 3. Password -> 4. Gender -> 5. Invite Friends -> 6. Profile Picture)
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const initialName = googleUser?.name || '';
  const initialHandle = initialName ? initialName.toLowerCase().replace(/[^a-z0-9_]/g, '') : '';

  const [name, setName] = useState(initialName);
  const [institute, setInstitute] = useState('Kapil Institute');
  const [coachingHub, setCoachingHub] = useState('Ajit Road Hub');
  const [stream, setStream] = useState('11th Medical');
  const [grade, setGrade] = useState('11');

  const [handle, setHandle] = useState(initialHandle);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState('boy');
  const [profilePic, setProfilePic] = useState(googleUser?.avatar || '');
  const [avatarEmoji, setAvatarEmoji] = useState('😎');
  const [shareToast, setShareToast] = useState('');

  const [refCode] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fromUrl = urlParams.get('ref');
      const fromStorage = localStorage.getItem('campus_ref_code') || sessionStorage.getItem('campus_ref_code');
      return (fromUrl || fromStorage || googleUser?.refCode || '').trim().replace(/^@/, '');
    } catch {
      return '';
    }
  });

  // Dynamic invite link
  const safeHandle = (handle || 'campus').replace(/^@/, '').toLowerCase();
  const shareUrl = `${window.location.origin}/?ref=${safeHandle}`;
  const shareText = `Someone from your coaching hub voted for you on CenterInsider! Join to see who it is. Use my invite link: ${shareUrl}`;

  const handleCopyLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText);
    }
    setShareToast('Invite link copied to clipboard!');
    setTimeout(() => setShareToast(''), 3000);
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
    setShareToast('Opening WhatsApp...');
    setTimeout(() => setShareToast(''), 3000);
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

  const nextStep = () => {
    setErrorMsg('');
    // Step 1 Validation: Institute and Class selection
    if (step === 1) {
      if (!name.trim()) {
        return setErrorMsg('Please enter your full name');
      }
      if (!institute.trim()) {
        return setErrorMsg('Please select your coaching institute');
      }
      if (!stream.trim()) {
        return setErrorMsg('Please select your batch / stream');
      }
    }
    // Step 2 Validation: Username creation
    if (step === 2) {
      const cleanH = handle.trim().replace(/^@/, '');
      if (!cleanH) {
        return setErrorMsg('Please enter a username');
      }
      if (cleanH.length < 3) {
        return setErrorMsg('Username must be at least 3 characters');
      }
    }
    // Step 3 Validation: Password setup
    if (step === 3) {
      if (!password.trim()) {
        return setErrorMsg('Please create an account password');
      }
      if (password.trim().length < 4) {
        return setErrorMsg('Password should be at least 4 characters');
      }
    }
    // Step 4: Gender selection (already has default 'boy')
    // Step 5: Invite Friends step (can continue or skip)

    setDirection(1);
    setStep(prev => Math.min(6, prev + 1));
  };

  const prevStep = () => {
    setErrorMsg('');
    setDirection(-1);
    setStep(prev => Math.max(1, prev - 1));
  };

  // Final Step 6: Submit Profile Picture and finalize onboarding
  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const cleanRef = (refCode || googleUser?.refCode || sessionStorage.getItem('campus_ref_code') || localStorage.getItem('campus_ref_code') || '').trim().replace(/^@/, '');
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
          district: 'Bathinda',
          grade: stream.includes('12') ? 12 : stream.includes('drop') ? 'dropper' : 11,
          avatar: finalAvatar,
          profilePic: profilePic || '',
          refCode: cleanRef,
          referred_by: cleanRef
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete profile');

      // Sync directly to Supabase profiles & users table using district key (absolutely do not send city)
      if (supabase) {
        const uid = data.user?.id || googleUser?.googleId;
        if (uid) {
          const supabasePayload = {
            district: 'Bathinda',
            institute: institute.trim(),
            school: institute.trim(),
            stream: stream,
            coaching_hub: coachingHub || findHubForInstitute(institute),
            name: name.trim(),
            handle: handle.trim().replace(/^@/, '').toLowerCase(),
            gender,
            avatar: finalAvatar,
            profile_pic: profilePic || '',
            grade: stream.includes('12') ? 12 : stream.includes('drop') ? 'dropper' : 11
          };
          try {
            await supabase.from('profiles').update(supabasePayload).eq('id', uid);
          } catch (_) {}
          try {
            await supabase.from('users').update(supabasePayload).eq('id', uid);
          } catch (_) {}
        }
      }

      // Clear referral code from storage
      sessionStorage.removeItem('campus_ref_code');
      sessionStorage.removeItem('referred_by');
      localStorage.removeItem('campus_ref_code');
      localStorage.removeItem('referred_by');

      // Transition to main app feed
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
        background: '#ffffff',
        color: '#000000',
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
                color: '#6b7280',
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
              color: '#6b7280',
              textTransform: 'uppercase'
            }}
          >
            Step {step} of 6
          </span>

          <span
            style={{
              fontSize: '10.5px',
              color: '#111827',
              fontWeight: '900',
              letterSpacing: '0.04em'
            }}
          >
            🔥 BATHINDA HUBS
          </span>
        </div>

        {/* Step Progress Line */}
        <div
          style={{
            width: '100%',
            height: '2px',
            background: '#e5e7eb',
            borderRadius: '1px',
            overflow: 'hidden'
          }}
        >
          <motion.div
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', background: '#000000' }}
          />
        </div>
      </div>

      {/* Main Container Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
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

          {/* ======================================================== */}
          {/* STEP 1: INSTITUTE AND CLASS SELECTION                     */}
          {/* ======================================================== */}
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
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#000000', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Institute & Class Selection
                </h2>
                <p style={{ fontSize: '12.5px', color: '#6b7280', margin: 0, lineHeight: '1.4' }}>
                  Connect with your exact coaching peers across Ajit Road & 100 Feet Rd centres.
                </p>
              </div>

              <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Full Name */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
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
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: '1px solid #e5e7eb',
                      background: '#f9fafb',
                      color: '#000000',
                      fontSize: '14px',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Coaching Institute Combobox */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
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
                  <div style={{ marginTop: '5px', fontSize: '11.5px', color: '#6b7280', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📍 Hub:</span>
                    <span style={{ color: '#000000' }}>{coachingHub || findHubForInstitute(institute)}</span>
                  </div>
                </div>

                {/* Class / Batch Stream Pills */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Batch / Class
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'nowrap',
                      overflowX: 'auto',
                      gap: '8px',
                      padding: '2px 2px 6px 2px',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
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
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: isSelected ? '1px solid #000000' : '1px solid #e5e7eb',
                            background: isSelected ? '#000000' : '#f3f4f6',
                            color: isSelected ? '#ffffff' : '#4b5563',
                            fontWeight: '800',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
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
                <p style={{ color: '#ef4444', fontSize: '12.5px', textAlign: 'center', margin: '8px 0 0 0' }}>
                  {errorMsg}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={nextStep}
                style={{
                  width: '100%',
                  marginTop: '22px',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Next: Create Username ➔
              </motion.button>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: USERNAME CREATION                                */}
          {/* ======================================================== */}
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
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#000000', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Create your Username
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.4' }}>
                  Your @handle is how classmates tag you in polls and add you as a friend.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: 'auto 0' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Username (Handle)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '16px', color: '#6b7280', fontWeight: '800', fontSize: '16px' }}>
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
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                        color: '#000000',
                        fontSize: '15px',
                        fontWeight: '700',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#6b7280', marginTop: '6px', display: 'block' }}>
                    Only lowercase letters, numbers, and underscores allowed.
                  </span>
                </div>
              </div>

              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '12.5px', textAlign: 'center', margin: '8px 0 0 0' }}>
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
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Next: Set Password ➔
              </motion.button>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: PASSWORD SETUP                                   */}
          {/* ======================================================== */}
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
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#000000', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Password Setup
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.4' }}>
                  Set an account password to log in and confirm critical actions like account deletion.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: 'auto 0' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Account Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '14px 50px 14px 16px',
                        borderRadius: '14px',
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                        color: '#000000',
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
                        color: '#6b7280',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        padding: '6px',
                        fontWeight: '700'
                      }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#6b7280', marginTop: '6px', display: 'block' }}>
                    Required for security and verifying future account changes.
                  </span>
                </div>
              </div>

              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '12.5px', textAlign: 'center', margin: '8px 0 0 0' }}>
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
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Next: Choose Gender ➔
              </motion.button>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: GENDER SELECTION                                 */}
          {/* ======================================================== */}
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
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#000000', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Select your Gender
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.4' }}>
                  Determines your flame color on anonymous voting feeds.
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
                        border: isSelected ? '2px solid #000000' : '1px solid #e5e7eb',
                        background: isSelected ? '#f9fafb' : '#ffffff',
                        color: '#000000',
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
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            {item.flameNote}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '5px solid #000000' : '2px solid #d1d5db',
                          background: isSelected ? '#ffffff' : 'transparent',
                          boxSizing: 'border-box'
                        }}
                      />
                    </motion.button>
                  );
                })}
              </div>

              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '12.5px', textAlign: 'center', margin: '8px 0 0 0' }}>
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
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Next: Invite Friends ➔
              </motion.button>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* STEP 5: "INVITE FRIENDS" STEP                            */}
          {/* ======================================================== */}
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
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#000000', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Invite your Friends
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.4' }}>
                  CenterInsider unlocks when classmates join. Invite 25 friends to claim Batch Captain status!
                </p>
              </div>

              {/* Referral Link Card */}
              <div
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
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
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                    Your Personal Invite Link
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#000000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {shareUrl.replace(/^https?:\/\//, '')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  Copy
                </button>
              </div>

              {/* Minimalist Share Icon Button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleWhatsAppShare}
                  aria-label="Share Link"
                  title="Share Invite Link"
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    border: '1px solid #e5e7eb',
                    background: '#000000',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'none'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </motion.button>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Tap icon to share invite link</span>
              </div>

              {shareToast && (
                <p style={{ color: '#059669', fontSize: '12px', textAlign: 'center', margin: '4px 0 0 0', fontWeight: '700' }}>
                  ✓ {shareToast}
                </p>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={nextStep}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: '#000000',
                    color: '#ffffff',
                    fontSize: '14.5px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  Next: Profile Picture ➔
                </motion.button>

                <button
                  type="button"
                  onClick={nextStep}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#6b7280',
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

          {/* ======================================================== */}
          {/* STEP 6: PROFILE PICTURE UPLOAD (FINAL STEP)              */}
          {/* ======================================================== */}
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
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#000000', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Profile Picture
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.4' }}>
                  Upload a photo or choose an avatar icon for your profile.
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
                        width: '92px',
                        height: '92px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #000000'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '92px',
                        height: '92px',
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '46px'
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
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        color: '#ef4444',
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

                {/* Upload Action Button */}
                <label
                  style={{
                    padding: '8px 18px',
                    borderRadius: '12px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    color: '#000000',
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
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', textAlign: 'center', marginBottom: '8px' }}>
                    Or pick an avatar icon
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
                          border: (!profilePic && avatarEmoji === emoji) ? '2px solid #000000' : '1px solid #e5e7eb',
                          background: (!profilePic && avatarEmoji === emoji) ? '#f3f4f6' : '#ffffff',
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
                <p style={{ color: '#ef4444', fontSize: '12.5px', textAlign: 'center', margin: '8px 0 0 0' }}>
                  {errorMsg}
                </p>
              )}

              {/* Submit Final Onboarding */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={isSubmitting}
                onClick={handleFinish}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '14.5px',
                  fontWeight: '800',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1
                }}
              >
                {isSubmitting ? 'Saving Profile & Entering Feed...' : 'Finish Setup & Enter Feed ➔'}
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
