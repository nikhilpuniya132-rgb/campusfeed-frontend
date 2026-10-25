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
      className="min-h-screen w-full bg-[#eaff00] flex flex-col justify-center items-center p-4 selection:bg-black selection:text-[#eaff00]"
      style={{
        minHeight: '100svh',
        width: '100%',
        background: '#eaff00',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Outfit', 'Inter', Roboto, sans-serif"
      }}
    >
      <div className="w-full max-w-[440px] flex flex-col my-auto relative z-10 py-4">
        {/* Account Info & Sign Out Button (Glassmorphic Dark Pill) */}
        <div
          className="flex items-center justify-between bg-black/50 backdrop-blur-md border border-black/20 rounded-2xl px-4 py-2.5 mb-4 shadow-lg text-white"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-sm">👤</span>
            <span className="text-xs font-bold text-white/90 truncate max-w-[190px]">
              {currentUserEmail || googleUser?.email || googleUser?.name || 'Google Account'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-bold text-red-400 hover:text-red-300 bg-black/40 border border-red-500/30 rounded-xl px-3 py-1 cursor-pointer transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Step Indicator & Glowing Neon Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2.5">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="bg-transparent border-none text-black font-extrabold text-xs cursor-pointer p-0 flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <span>←</span> Back
              </button>
            ) : (
              <div className="w-12" />
            )}

            <span className="text-[11px] font-black tracking-widest text-black/80 uppercase">
              Step {step} of 4
            </span>

            <span className="text-[11px] font-black tracking-wider text-black flex items-center gap-1">
              ⚡ INSTANT ONBOARDING
            </span>
          </div>

          {/* Step Progress Line */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-[#00ff41] shadow-[0_0_12px_#00ff41]"
            />
          </div>
        </div>

        {/* Main Container Card (Pitch Black Floating Card with Extreme Border Radius) */}
        <div
          className="bg-black text-white rounded-[2.5rem] shadow-2xl p-7 sm:p-8 min-h-[420px] flex flex-col relative border-2 border-black"
        >
          <AnimatePresence mode="wait" custom={direction}>

            {/* STEP 1: FULL NAME & CLASS */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex-1 flex flex-col justify-between"
              >
                <div className="text-center mb-5">
                  <h2 className="text-2xl font-black text-white tracking-tight mb-1.5">
                    Your Profile Details
                  </h2>
                  <p className="text-sm text-gray-400 font-semibold m-0">
                    Confirm your name and class to enter school polls.
                  </p>
                </div>

                <div className="my-auto flex flex-col gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      autoFocus
                      className="w-full bg-[#111] text-white border border-gray-800 rounded-2xl p-4 font-bold text-base outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] transition-all placeholder:text-gray-600 box-border"
                    />
                  </div>

                  <div>
                    <label htmlFor="onboarding-class-select" className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">
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
                      className="w-full bg-[#111] text-white border border-gray-800 rounded-2xl p-4 font-bold text-base outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] transition-all cursor-pointer box-border"
                    >
                      {CLASS_OPTIONS.map((c) => (
                        <option key={c} value={c} className="bg-[#111] text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-red-400 text-xs font-bold text-center mt-3 bg-red-950/40 border border-red-800/50 rounded-xl p-2.5">
                    {errorMsg}
                  </p>
                )}

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  className="w-full mt-6 bg-[#00ff41] text-black font-black text-base py-4 px-6 rounded-2xl shadow-xl hover:brightness-105 active:scale-95 transition-transform cursor-pointer border-none flex items-center justify-center gap-2"
                >
                  <span>Next: Create Username</span>
                  <span>➔</span>
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
                className="flex-1 flex flex-col justify-between"
              >
                <div className="text-center mb-5">
                  <h2 className="text-2xl font-black text-white tracking-tight mb-1.5">
                    Create your Username
                  </h2>
                  <p className="text-sm text-gray-400 font-semibold m-0">
                    Your @handle is how classmates tag you in polls and add you.
                  </p>
                </div>

                <div className="my-auto flex flex-col gap-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">
                      Username (Handle)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-[#00ff41] font-black text-lg select-none">
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
                        className={`w-full bg-[#111] text-white rounded-2xl py-4 pr-4 pl-10 font-bold text-base outline-none transition-all placeholder:text-gray-600 box-border ${
                          errorMsg ? 'border-2 border-red-500' : 'border border-gray-800 focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41]'
                        }`}
                      />
                    </div>
                    {errorMsg && (
                      <span className="text-red-400 text-xs font-bold mt-2 block">
                        ⚠️ {errorMsg}
                      </span>
                    )}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  className="w-full mt-6 bg-[#00ff41] text-black font-black text-base py-4 px-6 rounded-2xl shadow-xl hover:brightness-105 active:scale-95 transition-transform cursor-pointer border-none flex items-center justify-center gap-2"
                >
                  <span>Next: Choose Gender</span>
                  <span>➔</span>
                </motion.button>
              </motion.div>
            )}

            {/* STEP 3: GENDER SELECTION */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex-1 flex flex-col justify-between"
              >
                <div className="text-center mb-5">
                  <h2 className="text-2xl font-black text-white tracking-tight mb-1.5">
                    Select your Gender
                  </h2>
                  <p className="text-sm text-gray-400 font-semibold m-0">
                    Determines your flame color on anonymous voting feeds.
                  </p>
                </div>

                <div className="my-auto flex flex-col gap-3">
                  {[
                    {
                      id: 'boy',
                      label: 'Boy',
                      emoji: '😎',
                      flameNote: 'Blue Flame on votes',
                      selectedClasses: 'bg-[#0090ff] text-black border-2 border-black font-black shadow-[0_0_20px_rgba(0,144,255,0.4)]'
                    },
                    {
                      id: 'girl',
                      label: 'Girl',
                      emoji: '🌸',
                      flameNote: 'Pink Flame on votes',
                      selectedClasses: 'bg-[#ff007f] text-black border-2 border-black font-black shadow-[0_0_20px_rgba(255,0,127,0.4)]'
                    },
                    {
                      id: 'non-binary',
                      label: 'Non-binary',
                      emoji: '✨',
                      flameNote: 'Gold Flame on votes',
                      selectedClasses: 'bg-[#eaff00] text-black border-2 border-black font-black shadow-[0_0_20px_rgba(234,255,0,0.4)]'
                    }
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
                        className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? item.selectedClasses
                            : 'bg-[#111] border border-gray-800 text-white hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <div className="text-left">
                            <span className="text-base font-black block">
                              {item.label}
                            </span>
                            <span className={`text-xs font-bold ${isSelected ? 'text-black/80' : 'text-gray-400'}`}>
                              {item.flameNote}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-black bg-black'
                              : 'border-gray-700 bg-transparent'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  className="w-full mt-6 bg-[#00ff41] text-black font-black text-base py-4 px-6 rounded-2xl shadow-xl hover:brightness-105 active:scale-95 transition-transform cursor-pointer border-none flex items-center justify-center gap-2"
                >
                  <span>Next: Profile Picture</span>
                  <span>➔</span>
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
                className="flex-1 flex flex-col justify-between"
              >
                <div className="text-center mb-5">
                  <h2 className="text-2xl font-black text-white tracking-tight mb-1.5">
                    Profile Picture
                  </h2>
                  <p className="text-sm text-gray-400 font-semibold m-0">
                    Choose a photo or emoji icon for your anonymous card.
                  </p>
                </div>

                <div className="my-auto flex flex-col items-center">
                  <div className="relative mb-4">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="profile preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.4)]"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-[#111] border-4 border-gray-800 flex items-center justify-center text-5xl shadow-inner">
                        {avatarEmoji}
                      </div>
                    )}

                    {profilePic && (
                      <button
                        type="button"
                        onClick={() => setProfilePic('')}
                        className="absolute bottom-0 right-0 bg-black text-red-400 border border-red-500/40 rounded-full w-6 h-6 flex items-center justify-center text-xs font-black cursor-pointer shadow-md hover:bg-red-500 hover:text-white transition-colors"
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <label className="px-5 py-3 rounded-2xl bg-[#111] hover:bg-[#1a1a1a] border border-gray-800 hover:border-[#00ff41] text-white text-sm font-bold cursor-pointer inline-flex items-center gap-2 mb-5 transition-all shadow-md">
                    <span>📷</span>
                    <span>{profilePic ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <div>
                    <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block text-center mb-2.5">
                      Or pick an avatar icon
                    </span>
                    <div className="flex gap-2.5 justify-center flex-wrap">
                      {['😎', '🌸', '⚡', '👑', '🦄', '🚀'].map(emoji => {
                        const isChosen = !profilePic && avatarEmoji === emoji;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setAvatarEmoji(emoji);
                              setProfilePic('');
                            }}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl cursor-pointer transition-all ${
                              isChosen
                                ? 'bg-[#00ff41] text-black border-2 border-black scale-110 shadow-[0_0_15px_rgba(0,255,65,0.5)] font-black'
                                : 'bg-[#111] border border-gray-800 text-white hover:border-gray-600'
                            }`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-red-400 text-xs font-bold text-center mt-3 bg-red-950/40 border border-red-800/50 rounded-xl p-2.5">
                    {errorMsg}
                  </p>
                )}

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubmitting}
                  onClick={handleFinish}
                  className="w-full mt-6 bg-[#00ff41] text-black font-black text-base py-4 px-6 rounded-2xl shadow-xl hover:brightness-105 active:scale-95 transition-transform cursor-pointer border-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Entering Feed...</span>
                  ) : (
                    <>
                      <span>Finish Setup & Enter Feed</span>
                      <span>➔</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
