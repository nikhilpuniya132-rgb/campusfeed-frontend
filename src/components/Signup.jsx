import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '../useNavigate';
import {
  ShieldCheck,
  Sparkles,
  Users,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  LogIn
} from 'lucide-react';
import { supabase } from '../supabase';

export default function Signup({
  loginWithGoogle,
  isAuthenticating: propIsAuthenticating = false,
  legalView: propLegalView,
  setLegalView: propSetLegalView
}) {
  const navigate = useNavigate();
  const [localLegalView, setLocalLegalView] = useState(null);
  const legalView = propLegalView !== undefined ? propLegalView : localLegalView;
  const setLegalView = propSetLegalView || setLocalLegalView;

  const [referralCode, setReferralCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Loading state: null | 'signup' | 'login' | 'google'
  const [actionLoading, setActionLoading] = useState(null);
  const [authFeedback, setAuthFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  const isLoading = Boolean(actionLoading || propIsAuthenticating);

  // Capture ?ref= query parameter from URL and persist in storage
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref');
      if (refParam) {
        const cleanRef = refParam.trim().replace(/^@/, '');
        setReferralCode(cleanRef);
        sessionStorage.setItem('campus_ref_code', cleanRef);
        sessionStorage.setItem('referred_by', cleanRef);
        localStorage.setItem('campus_ref_code', cleanRef);
        localStorage.setItem('referred_by', cleanRef);
      }
    } catch (e) {
      console.error('Error capturing referral parameter on /signup:', e);
    }
  }, []);

  const prepareStorage = () => {
    try {
      localStorage.removeItem('pre_selected_school');
      localStorage.removeItem('campus_institute');
      localStorage.removeItem('campus_stream');
      localStorage.removeItem('campus_grade');
      localStorage.removeItem('campus_hub');
      sessionStorage.removeItem('pre_selected_school');

      if (referralCode) {
        localStorage.setItem('referred_by', referralCode);
        localStorage.setItem('campus_ref_code', referralCode);
        sessionStorage.setItem('referred_by', referralCode);
        sessionStorage.setItem('campus_ref_code', referralCode);
      }
    } catch (_) {}
  };

  const validateInputs = () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setAuthFeedback({
        type: 'error',
        message: 'Please enter your email address.'
      });
      return null;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAuthFeedback({
        type: 'error',
        message: 'Please enter a valid email address (e.g. name@school.edu).'
      });
      return null;
    }

    if (!password) {
      setAuthFeedback({
        type: 'error',
        message: 'Please enter your password.'
      });
      return null;
    }

    if (password.length < 6) {
      setAuthFeedback({
        type: 'error',
        message: 'Password is too short. It must be at least 6 characters long.'
      });
      return null;
    }

    return trimmedEmail;
  };

  // 1. Primary Auth: Sign Up (supabase.auth.signUp)
  const handleSignUp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isLoading) return;

    const validEmail = validateInputs();
    if (!validEmail) return;

    setActionLoading('signup');
    setAuthFeedback(null);
    prepareStorage();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: validEmail,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`
        }
      });

      if (error) {
        const errorMsg = error.message || '';
        if (
          errorMsg.toLowerCase().includes('already registered') ||
          errorMsg.toLowerCase().includes('already exists') ||
          errorMsg.toLowerCase().includes('user already exists')
        ) {
          setAuthFeedback({
            type: 'error',
            message: 'An account with this email already exists. Click "Log In" to access it.'
          });
        } else if (errorMsg.toLowerCase().includes('password')) {
          setAuthFeedback({
            type: 'error',
            message: errorMsg
          });
        } else {
          setAuthFeedback({
            type: 'error',
            message: errorMsg || 'Sign up failed. Please try again.'
          });
        }
        setActionLoading(null);
        return;
      }

      if (data?.session) {
        setAuthFeedback({
          type: 'success',
          message: 'Account created successfully! Routing to setup...'
        });
        setTimeout(() => {
          navigate('/onboarding');
        }, 400);
      } else if (data?.user) {
        setAuthFeedback({
          type: 'success',
          message: 'Account registered! Please check your email to confirm your account, or log in.'
        });
        setActionLoading(null);
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setAuthFeedback({
        type: 'error',
        message: 'An unexpected error occurred during sign up. Please try again.'
      });
      setActionLoading(null);
    }
  };

  // 2. Primary Auth: Log In (supabase.auth.signInWithPassword)
  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isLoading) return;

    const validEmail = validateInputs();
    if (!validEmail) return;

    setActionLoading('login');
    setAuthFeedback(null);
    prepareStorage();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validEmail,
        password: password
      });

      if (error) {
        const errorMsg = error.message || '';
        if (
          errorMsg.toLowerCase().includes('invalid login credentials') ||
          errorMsg.toLowerCase().includes('invalid credentials')
        ) {
          setAuthFeedback({
            type: 'error',
            message: 'Invalid email or password. Please verify your details or click "Sign Up" to create an account.'
          });
        } else {
          setAuthFeedback({
            type: 'error',
            message: errorMsg || 'Login failed. Please check your credentials.'
          });
        }
        setActionLoading(null);
        return;
      }

      setAuthFeedback({
        type: 'success',
        message: 'Welcome back! Logging you in...'
      });

      setTimeout(() => {
        const cached = localStorage.getItem('campus_cached_user');
        if (cached) {
          navigate('/feed');
        } else {
          navigate('/onboarding');
        }
      }, 350);
    } catch (err) {
      console.error('Login error:', err);
      setAuthFeedback({
        type: 'error',
        message: 'An unexpected error occurred during log in. Please try again.'
      });
      setActionLoading(null);
    }
  };

  // 3. Secondary Auth: Google OAuth
  const handleGoogleClick = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isLoading) return;

    setActionLoading('google');
    setAuthFeedback(null);
    prepareStorage();

    if (typeof loginWithGoogle === 'function') {
      try {
        await loginWithGoogle();
      } catch (err) {
        console.error('Google OAuth error:', err);
        setActionLoading(null);
      }
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
          skipBrowserRedirect: false,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          }
        }
      });

      if (error) {
        setAuthFeedback({
          type: 'error',
          message: 'Google Login Failed: ' + error.message
        });
        setActionLoading(null);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setAuthFeedback({
        type: 'error',
        message: 'Google login failed. Please try again.'
      });
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col justify-between items-center px-4 py-5 sm:px-6 sm:py-7 relative overflow-x-hidden selection:bg-purple-600 selection:text-white box-border">
      {/* Ambient background glow */}
      <div
        className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[400px] pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at center, rgba(147, 51, 234, 0.22) 0%, rgba(59, 130, 246, 0.14) 40%, rgba(0, 0, 0, 0) 70%)',
          filter: 'blur(60px)'
        }}
      />

      {/* Top Header / Brand Logo */}
      <header className="w-full max-w-[440px] flex items-center justify-between z-10 pt-1 pb-2">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
          <span className="text-xl">🔥</span>
          <span className="text-lg font-black tracking-tight text-white">CampusFeed</span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="bg-white/5 hover:bg-white/10 active:bg-white/15 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold py-1.5 px-3.5 rounded-full transition-all cursor-pointer"
        >
          Explore App
        </button>
      </header>

      {/* Main Authentication Card */}
      <motion.main
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[420px] z-10 flex flex-col items-center text-center my-auto py-3 sm:py-5"
      >
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-full px-3.5 py-1.5 mb-3.5 text-xs font-extrabold text-zinc-200 shadow-lg shadow-black/50">
          <Sparkles size={13} className="text-amber-400 shrink-0" />
          <span>The 100% Anonymous School Network</span>
        </div>

        {/* Dynamic Referral Banner */}
        {referralCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-950/40 border border-emerald-600/50 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-3"
          >
            <span>🎁</span> Invited by @{referralCode} • Priority Access
          </motion.div>
        )}

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight mb-2 text-white">
          Answer viral polls.
          <br />
          <span className="text-zinc-400">Discover admirers.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-zinc-400 leading-relaxed mb-5 max-w-[340px] font-medium">
          See who voted for you in school polls, vote anonymously for your classmates, and enter the
          inner campus circle.
        </p>

        {/* Auth Card Container */}
        <div className="w-full bg-[#0f0f12]/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-black ring-1 ring-white/5 text-left box-border">
          {/* PRIMARY AUTH: Email & Password Form */}
          <form onSubmit={handleSignUp} className="w-full flex flex-col gap-3.5">
            {/* Email Field */}
            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-0.5">
                Email Address
              </label>
              <div className="relative w-full">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu or personal"
                  autoComplete="email"
                  inputMode="email"
                  disabled={isLoading}
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-500 focus:bg-zinc-900 text-white placeholder-zinc-500 text-sm sm:text-base rounded-2xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-zinc-400/20 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="w-full flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-0.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Password
                </label>
                <span className="text-[11px] text-zinc-500 font-medium">Min 6 characters</span>
              </div>
              <div className="relative w-full">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-500 focus:bg-zinc-900 text-white placeholder-zinc-500 text-sm sm:text-base rounded-2xl pl-10 pr-11 py-3 outline-none focus:ring-2 focus:ring-zinc-400/20 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Action Buttons: Sign Up & Log In */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Sign Up Button */}
              <motion.button
                whileTap={isLoading ? {} : { scale: 0.98 }}
                whileHover={isLoading ? {} : { scale: 1.01 }}
                disabled={isLoading}
                type="submit"
                className="w-full bg-white hover:bg-zinc-100 active:bg-zinc-200 text-black font-black text-sm py-3.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-white/10 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {actionLoading === 'signup' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black shrink-0" />
                    <span>Signing up...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-black shrink-0" />
                    <span>Sign Up</span>
                  </>
                )}
              </motion.button>

              {/* Log In Button */}
              <motion.button
                whileTap={isLoading ? {} : { scale: 0.98 }}
                whileHover={isLoading ? {} : { scale: 1.01 }}
                disabled={isLoading}
                type="button"
                onClick={handleLogin}
                className="w-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-700/90 border border-zinc-700 text-white font-black text-sm py-3.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {actionLoading === 'login' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-zinc-300 shrink-0" />
                    <span>Log In</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Feedback Messages (Success / Error) */}
          <AnimatePresence>
            {authFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-3"
              >
                {authFeedback.type === 'success' ? (
                  <div className="bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-semibold rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="flex-1 leading-snug">{authFeedback.message}</span>
                  </div>
                ) : (
                  <div className="bg-red-950/40 border border-red-500/50 text-red-300 text-xs sm:text-sm font-semibold rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="flex-1 leading-snug">{authFeedback.message}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visual Divider ("or") */}
          <div className="relative my-4 sm:my-5 flex items-center justify-center">
            <div className="w-full border-t border-zinc-800" />
            <span className="absolute bg-[#0f0f12] px-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
              or
            </span>
          </div>

          {/* SECONDARY AUTH: Google OAuth Button */}
          <motion.button
            whileTap={isLoading ? {} : { scale: 0.98 }}
            whileHover={isLoading ? {} : { scale: 1.01 }}
            onClick={handleGoogleClick}
            disabled={isLoading}
            type="button"
            id="ad-signup-google-btn"
            className="w-full bg-zinc-900/90 hover:bg-zinc-800 active:bg-zinc-800/80 border border-zinc-700/80 text-white font-extrabold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {actionLoading === 'google' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                <span className="tracking-tight">Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="tracking-tight">Continue with Google</span>
              </>
            )}
          </motion.button>

          {/* Social Proof Badges under Auth Options */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-zinc-500 font-bold">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500 shrink-0" /> 100% Anonymous
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Sparkles size={13} className="text-amber-400 shrink-0" /> Free Forever
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Users size={13} className="text-sky-400 shrink-0" /> 12.4k+ Votes
            </span>
          </div>
        </div>
      </motion.main>

      {/* Footer Navigation & Legal Links */}
      <footer className="w-full max-w-[420px] text-center text-[11px] text-zinc-500 font-semibold z-10 pb-2">
        <div className="flex justify-center gap-3.5 mb-2">
          <span
            onClick={() => setLegalView('terms')}
            className="cursor-pointer text-zinc-400 hover:text-white underline transition-colors"
          >
            Terms of Service
          </span>
          <span>•</span>
          <span
            onClick={() => setLegalView('privacy')}
            className="cursor-pointer text-zinc-400 hover:text-white underline transition-colors"
          >
            Privacy Policy
          </span>
        </div>
        <div className="text-zinc-600">By continuing, you agree to CampusFeed's Community Standards.</div>
      </footer>

      {/* Terms & Privacy Slide-Over / Modal */}
      <AnimatePresence>
        {legalView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 sm:p-5"
            onClick={() => setLegalView(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 w-full max-w-[500px] max-h-[80vh] overflow-y-auto text-white shadow-2xl shadow-black text-left"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="m-0 text-lg font-black text-white">
                  {legalView === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </h3>
                <button
                  type="button"
                  onClick={() => setLegalView(null)}
                  className="bg-zinc-900 border border-zinc-800 text-white rounded-full w-8 h-8 cursor-pointer text-sm flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs sm:text-sm text-zinc-400 leading-relaxed space-y-3">
                {legalView === 'terms' ? (
                  <>
                    <p>
                      <strong className="text-zinc-200">1. Anonymous Polling Community:</strong>{' '}
                      CampusFeed provides an uplifting, positive polling network for schools and
                      coaching institutes. Bullying, defamation, targeted harassment, or explicit
                      content results in immediate permanent bans.
                    </p>
                    <p>
                      <strong className="text-zinc-200">2. Account & Eligibility:</strong> You are
                      responsible for maintaining the confidentiality of your credentials. Each user
                      may hold only one active account linked to their authentic campus identity.
                    </p>
                    <p>
                      <strong className="text-zinc-200">3. Content & Moderation:</strong> All
                      user-generated polls pass through automated filtering and human review.
                      Inappropriate poll submissions will be discarded.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong className="text-zinc-200">1. Data Encryption:</strong> Your voter identity
                      is cryptographically pseudonymized on poll submissions. Classmates cannot see who
                      cast individual votes unless you are revealed via legitimate in-app features.
                    </p>
                    <p>
                      <strong className="text-zinc-200">2. Information We Collect:</strong> We collect
                      your email and basic Google profile name for identity verification, and your
                      self-reported school and grade to route relevant campus polls.
                    </p>
                    <p>
                      <strong className="text-zinc-200">3. Data Deletion:</strong> You have full rights
                      to request complete account deletion at any time via Settings, which wipes your
                      profile and friendships permanently.
                    </p>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setLegalView(null)}
                className="mt-6 w-full py-3 bg-white text-black rounded-xl font-black text-sm cursor-pointer hover:bg-zinc-100 transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
