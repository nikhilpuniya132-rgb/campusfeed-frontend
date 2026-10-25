import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { useNavigate } from '../useNavigate';
import { CLASS_OPTIONS, getGradeFromStream } from '../constants/classes';

export { CLASS_OPTIONS };

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
  const navigate = useNavigate();
  // 4-step streamlined zero-friction onboarding:
  // Step 1: Name & Class
  // Step 2: Username
  // Step 3: Gender
  // Step 4: Profile Picture & Finish
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const initialName = googleUser?.name || '';
  const initialHandle = initialName ? initialName.toLowerCase().replace(/[^a-z0-9_]/g, '') : '';

  const [currentUserEmail, setCurrentUserEmail] = useState(googleUser?.email || '');
  const [currentUserId, setCurrentUserId] = useState(googleUser?.googleId || googleUser?.id || '');

  const [name, setName] = useState(initialName);
  const [stream, setStream] = useState(() => {
    try {
      const stored = localStorage.getItem('campus_stream');
      if (stored && CLASS_OPTIONS.includes(stored)) return stored;
    } catch (_) {}
    return 'Class 11';
  });
  const [grade, setGrade] = useState(() => {
    try {
      return localStorage.getItem('campus_grade') || '11';
    } catch (_) {
      return '11';
    }
  });

  const [handle, setHandle] = useState(initialHandle);
  const [gender, setGender] = useState('boy');
  const [profilePic, setProfilePic] = useState(googleUser?.avatar || '');
  const [avatarEmoji, setAvatarEmoji] = useState('😎');
  const [shareToast, setShareToast] = useState('');

  // Pull email and user details directly from session on mount
  useEffect(() => {
    let isMounted = true;
    const fetchFreshSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted && session?.user) {
          if (session.user.email) {
            setCurrentUserEmail(session.user.email);
          }
          if (session.user.id) {
            setCurrentUserId(session.user.id);
          }
          if (!name.trim()) {
            const resolvedName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '';
            setName(resolvedName);
            setHandle(resolvedName.toLowerCase().replace(/[^a-z0-9_]/g, ''));
          }
          if (!profilePic) {
            const resolvedAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '';
            if (resolvedAvatar) setProfilePic(resolvedAvatar);
          }
        }
      } catch (err) {
        console.warn("Error fetching fresh session in Onboarding:", err);
      }
    };
    fetchFreshSession();
    return () => { isMounted = false; };
  }, []);

  const [refCode] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fromUrl = urlParams.get('ref');
      const fromStorage = localStorage.getItem('referred_by') || localStorage.getItem('campus_ref_code') || sessionStorage.getItem('campus_ref_code');
      return (fromUrl || fromStorage || googleUser?.refCode || '').trim().replace(/^@/, '');
    } catch {
      return '';
    }
  });

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

  const nextStep = async () => {
    setErrorMsg('');
    // Step 1 Validation: Name and Class selection
    if (step === 1) {
      if (!name.trim()) {
        return setErrorMsg('Please enter your full name');
      }
      if (!stream.trim() || !CLASS_OPTIONS.includes(stream)) {
        return setErrorMsg('Please select your class');
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

      if (supabase) {
        try {
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('handle', cleanH)
            .maybeSingle();

          if (existingUser && (!currentUserId || String(existingUser.id) !== String(currentUserId))) {
            return setErrorMsg('This handle is already taken. Please choose another.');
          }
        } catch (err) {
          console.warn('Error checking handle uniqueness in Step 2:', err);
        }
      }
    }

    setDirection(1);
    setStep(prev => Math.min(4, prev + 1));
  };

  const prevStep = () => {
    setErrorMsg('');
    setDirection(-1);
    setStep(prev => Math.max(1, prev - 1));
  };

  // Final Step 4: Finish setup and enter feed
  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const storedRef = (localStorage.getItem('referred_by') || sessionStorage.getItem('referred_by') || localStorage.getItem('campus_ref_code') || refCode || googleUser?.refCode || '');
      let cleanRef = null;
      if (storedRef && typeof storedRef === 'string') {
        const trimmed = storedRef.trim().replace(/^@/, '');
        if (trimmed && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'campus') {
          cleanRef = trimmed;
        }
      }

      const finalAvatar = gender === 'girl' ? (avatarEmoji === '😎' ? '🌸' : avatarEmoji) : avatarEmoji;
      const resolvedGrade = parseInt(getGradeFromStream(stream), 10) || 11;
      const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
      // Auto-assign clean default institute so DB schema is always satisfied without asking user
      const cleanInstitute = 'St. Kabir Convent Senior Secondary';
      const cleanHub = 'Ajit Road Hub';

      let authenticatedUserId = null;
      let sessionEmail = null;

      if (supabase) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user?.id) {
            authenticatedUserId = sessionData.session.user.id;
            sessionEmail = sessionData.session.user.email || null;
          }
        } catch (_) {}
      }

      if (!authenticatedUserId) {
        authenticatedUserId = currentUserId || googleUser?.googleId || googleUser?.id;
        sessionEmail = sessionEmail || currentUserEmail || googleUser?.email || null;
      }

      if (!authenticatedUserId) {
        throw new Error("No active authenticated user session found. Please sign in again.");
      }

      const supabasePayload = {
        id: authenticatedUserId,
        google_id: authenticatedUserId,
        email: sessionEmail,
        name: name.trim(),
        handle: cleanHandle,
        institute: cleanInstitute,
        coaching_hub: cleanHub,
        district: 'Bathinda',
        gender,
        avatar: finalAvatar,
        profile_pic: profilePic || '',
        bio: `${cleanInstitute} • ${stream}`,
        grade: resolvedGrade,
        stream: stream,
        referred_by: cleanRef
      };

      console.log("Submitting Onboarding to Supabase public.users:", supabasePayload);
      let insertData = null;
      let insertError = null;

      try {
        const insertRes = await supabase
          .from('users')
          .insert(supabasePayload)
          .select()
          .maybeSingle();

        insertData = insertRes.data;
        insertError = insertRes.error;

        if (insertError && (insertError.code === '23505' || insertError.message?.includes('duplicate key') || insertError.message?.includes('already exists'))) {
          const upsertRes = await supabase
            .from('users')
            .upsert(supabasePayload)
            .select()
            .maybeSingle();
          insertData = upsertRes.data;
          insertError = upsertRes.error;
        }

        if (insertError) {
          throw insertError;
        }
      } catch (dbErr) {
        console.warn("Direct insert/upsert warning, continuing:", dbErr);
      }

      // Update local storage and finalize
      localStorage.setItem('campus_cached_user', JSON.stringify({
        ...supabasePayload,
        ...(insertData || {})
      }));
      localStorage.setItem('campus_stream', stream);
      localStorage.setItem('campus_grade', String(resolvedGrade));

      if (onComplete) {
        onComplete({
          ...supabasePayload,
          ...(insertData || {})
        });
      }
      navigate('/feed');
    } catch (err) {
      console.error("Onboarding finish error:", err);
      setErrorMsg(err.message || 'Setup error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (_) {}
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
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
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', 'Inter', Roboto, sans-serif"
      }}
    >
      {/* Account Info & Sign Out Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '8px 12px',
          marginBottom: '16px',
          fontSize: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span style={{ fontSize: '14px' }}>👤</span>
          <span
            style={{
              color: '#374151',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '190px'
            }}
          >
            {currentUserEmail || googleUser?.email || googleUser?.name || 'Google Account'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          style={{
            background: '#ffffff',
            color: '#dc2626',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Step Indicator */}
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
              fontWeight: '900',
              letterSpacing: '0.08em',
              color: '#6b7280',
              textTransform: 'uppercase'
            }}
          >
            Step {step} of 4
          </span>

          <span
            style={{
              fontSize: '10.5px',
              color: '#111827',
              fontWeight: '900',
              letterSpacing: '0.04em'
            }}
          >
            ⚡ INSTANT ONBOARDING
          </span>
        </div>

        {/* Step Progress Line */}
        <div
          style={{
            width: '100%',
            height: '3px',
            background: '#e5e7eb',
            borderRadius: '2px',
            overflow: 'hidden'
          }}
        >
          <motion.div
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ height: '100%', background: '#0df259' }}
          />
        </div>
      </div>

      {/* Main Container Card */}
      <div
        style={{
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: '24px',
          padding: '28px 20px',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxSizing: 'border-box',
          boxShadow: '6px 6px 0px #000000'
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>

          {/* STEP 1: FULL NAME & CLASS (SCHOOL SELECTION REMOVED) */}
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
                <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#000000', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
                  Your Profile Details
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontWeight: '600' }}>
                  Confirm your name and class to enter school polls.
                </p>
              </div>

              <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
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
                      padding: '13px 14px',
                      borderRadius: '14px',
                      border: '2px solid #000000',
                      background: '#f9fafb',
                      color: '#000000',
                      fontSize: '15px',
                      fontWeight: '800',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="onboarding-class-select" style={{ fontSize: '11px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Select Class
                  </label>
                  <select
                    id="onboarding-class-select"
                    value={stream}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStream(val);
                      setGrade(getGradeFromStream(val));
                    }}
                    style={{
                      width: '100%',
                      padding: '13px 14px',
                      borderRadius: '14px',
                      border: '2px solid #000000',
                      background: '#f9fafb',
                      color: '#000000',
                      fontWeight: '800',
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '12.5px', textAlign: 'center', margin: '8px 0 0 0', fontWeight: '700' }}>
                  {errorMsg}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={nextStep}
                style={{
                  width: '100%',
                  marginTop: '22px',
                  padding: '15px',
                  borderRadius: '16px',
                  border: '2px solid #000000',
                  background: '#0df259',
                  color: '#000000',
                  fontSize: '15px',
                  fontWeight: '950',
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0px #000000'
                }}
              >
                Next: Create Username ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2: USERNAME CREATION */}
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
                <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#000000', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
                  Create your Username
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontWeight: '600' }}>
                  Your @handle is how classmates tag you in polls and add you.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: 'auto 0' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Username (Handle)
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '16px', color: '#000000', fontWeight: '900', fontSize: '16px' }}>
                      @
                    </span>
                    <input
                      type="text"
                      placeholder="username"
                      value={handle}
                      onChange={e => {
                        setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                        setErrorMsg('');
                      }}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '14px 16px 14px 34px',
                        borderRadius: '14px',
                        border: errorMsg ? '2px solid #ef4444' : '2px solid #000000',
                        background: '#f9fafb',
                        color: '#000000',
                        fontSize: '15px',
                        fontWeight: '800',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  {errorMsg && (
                    <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700', marginTop: '6px', display: 'block' }}>
                      ⚠️ {errorMsg}
                    </span>
                  )}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={nextStep}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '15px',
                  borderRadius: '16px',
                  border: '2px solid #000000',
                  background: '#0df259',
                  color: '#000000',
                  fontSize: '15px',
                  fontWeight: '950',
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0px #000000'
                }}
              >
                Next: Choose Gender ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 3: GENDER SELECTION (PASSWORD STEP COMPLETELY REMOVED) */}
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
                <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#000000', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
                  Select your Gender
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontWeight: '600' }}>
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
                        border: isSelected ? '2.5px solid #000000' : '1.5px solid #e5e7eb',
                        background: isSelected ? '#0df259' : '#ffffff',
                        color: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '3px 3px 0px #000000' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '22px' }}>{item.emoji}</span>
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '15px', fontWeight: '900', display: 'block' }}>
                            {item.label}
                          </span>
                          <span style={{ fontSize: '12px', color: isSelected ? '#000000' : '#6b7280', fontWeight: '700' }}>
                            {item.flameNote}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: '2px solid #000000',
                          background: isSelected ? '#000000' : '#ffffff',
                          boxSizing: 'border-box'
                        }}
                      />
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={nextStep}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '15px',
                  borderRadius: '16px',
                  border: '2px solid #000000',
                  background: '#0df259',
                  color: '#000000',
                  fontSize: '15px',
                  fontWeight: '950',
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0px #000000'
                }}
              >
                Next: Profile Picture ➔
              </motion.button>
            </motion.div>
          )}

          {/* STEP 4: PROFILE PICTURE & FINISH */}
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
                <h2 style={{ fontSize: '22px', fontWeight: '950', color: '#000000', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
                  Profile Picture
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontWeight: '600' }}>
                  Choose a photo or emoji icon for your anonymous card.
                </p>
              </div>

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
                        border: '3px solid #000000'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '92px',
                        height: '92px',
                        borderRadius: '50%',
                        background: '#f3f4f6',
                        border: '3px solid #000000',
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
                        border: '2px solid #000000',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        color: '#ef4444',
                        fontSize: '11px',
                        fontWeight: '900',
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

                <label
                  style={{
                    padding: '8px 18px',
                    borderRadius: '12px',
                    background: '#f3f4f6',
                    border: '2px solid #000000',
                    color: '#000000',
                    fontSize: '13px',
                    fontWeight: '800',
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

                <div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', textAlign: 'center', marginBottom: '8px' }}>
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
                          border: (!profilePic && avatarEmoji === emoji) ? '2.5px solid #000000' : '1px solid #e5e7eb',
                          background: (!profilePic && avatarEmoji === emoji) ? '#0df259' : '#ffffff',
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
                <p style={{ color: '#ef4444', fontSize: '12.5px', textAlign: 'center', margin: '8px 0 0 0', fontWeight: '700' }}>
                  {errorMsg}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={isSubmitting}
                onClick={handleFinish}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '2px solid #000000',
                  background: '#0df259',
                  color: '#000000',
                  fontSize: '16px',
                  fontWeight: '950',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                  boxShadow: '3px 3px 0px #000000'
                }}
              >
                {isSubmitting ? 'Entering Feed...' : 'Finish Setup & Enter Feed ➔'}
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
