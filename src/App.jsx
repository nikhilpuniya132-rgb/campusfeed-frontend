import React, { useState, useEffect, Suspense, lazy } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import bgVideo from './assets/campus_promo.mp4';
import './App.css';

// UI Components (HamsterLoader eagerly loaded for zero-lag suspense fallback)
import HamsterLoader from './components/HamsterLoader';

// Lazily loaded components for bundle optimization & rapid initial render
const TiltCard = lazy(() => import('./components/TiltCard'));
const HolographicCard = lazy(() => import('./components/HolographicCard'));
const InteractivePollDemo = lazy(() => import('./components/InteractivePollDemo'));
const OnboardingWizard = lazy(() => import('./components/OnboardingWizard'));
const FriendSearch = lazy(() => import('./components/FriendSearch'));
const Profile = lazy(() => import('./components/Profile'));
const Inbox = lazy(() => import('./components/Inbox'));
const Feed = lazy(() => import('./components/Feed'));
const Explore = lazy(() => import('./components/Explore'));

// --- INITIALIZE CONFIGURED SUPABASE CLIENT & NAVIGATION ---
import { supabase } from './supabase';
import { useNavigate } from './useNavigate';

const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : 'https://campusfeed-backend-po4g.onrender.com/api';

const AURA_RINGS = {
  none: { border: 'none', boxShadow: 'none' },
  gold: { border: '4px solid #fbbf24', boxShadow: '0 0 20px rgba(251, 191, 36, 0.6), inset 0 0 10px rgba(251, 191, 36, 0.3)' },
  neonPurple: { border: '4px solid #d946ef', boxShadow: '0 0 20px #d946ef, inset 0 0 10px #d946ef' },
  blueEnergy: { border: '4px dashed #00f0ff', boxShadow: '0 0 20px rgba(0, 240, 255, 0.8), inset 0 0 10px rgba(0, 240, 255, 0.4)' },
  crimsonFire: { border: '4px double #ef4444', boxShadow: '0 0 20px rgba(239, 68, 68, 0.8), inset 0 0 10px rgba(239, 68, 68, 0.4)' }
};

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -10 },
  transition: { type: 'spring', damping: 25, stiffness: 260 }
};

export default function App() {
  // ==============================================
  // IMMUTABLE STATE VARIABLES
  // ==============================================
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('11');
  const [avatar, setAvatar] = useState('😎');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingGoogleUser, setOnboardingGoogleUser] = useState(null);

  // UI States
  const [activeRevealPopup, setActiveRevealPopup] = useState(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealData, setRevealData] = useState(null);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const [shareToast, setShareToast] = useState('');
  const [legalView, setLegalView] = useState(null);
  const [activePlan, setActivePlan] = useState('weekly'); // 'basic', 'weekly', or 'monthly'
  const [showManualLogin, setShowManualLogin] = useState(false);
  const navigate = useNavigate();

  // Logged-in App States
  const [view, setView] = useState(() => {
    const path = window.location.pathname.replace(/^\//, '');
    if (path === 'feed' || path === 'poll') return 'poll';
    if (path === 'inbox') return 'inbox';
    if (path === 'pro' || path === 'vip') return 'pro';
    if (path === 'explore') return 'explore';
    if (path === 'profile') return 'profile';
    return 'poll';
  });
  const [gradeFilter, setGradeFilter] = useState('11');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPoll, setCurrentPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoadingPoll, setIsLoadingPoll] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);

  const [inbox, setInbox] = useState([]);
  const [inviteStats, setInviteStats] = useState({ effectiveInvites: 0, remaining: 3, canReveal: false });
  const [leaderboard, setLeaderboard] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editRing, setEditRing] = useState('gold');
  const [editGrade, setEditGrade] = useState('11');
  const [editProfilePic, setEditProfilePic] = useState('');

  // ==============================================
  // AUTHENTICATION & PAYMENT LIFECYCLE HOOKS
  // ==============================================
  // Sync Google OAuth User with Backend Supabase DB
  const syncWithBackend = async (sessionUser, targetGrade = grade) => {
    if (!sessionUser) return;
    setIsAuthenticating(true);
    try {
      const selectedGrade = localStorage.getItem('campus_grade') || targetGrade || grade || '11';
      const res = await fetch(`${API}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0],
          avatar: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || '',
          grade: selectedGrade
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication sync failed');
      if (data.isNewUser) {
        setOnboardingGoogleUser(data.googleUser);
        setIsOnboarding(true);
      } else if (data.user) {
        setUser(prev => ({ ...(prev || {}), ...data.user }));
        setIsOnboarding(false);
        setOnboardingGoogleUser(null);
        setView('poll');
        setGradeFilter(data.user.grade ? data.user.grade.toString() : '11');
        loadNextPoll(data.user.grade ? data.user.grade.toString() : '11', data.user.id);
        fetchPendingRequests(data.user.id);
        fetchAcceptedFriends(data.user.id);
        fetchInbox(data.user.id);
      }
    } catch (err) {
      console.error('Google Auth Sync Error:', err);
      // Fallback synthesizer so user is never locked out on cold starts
      setUser(prev => prev || {
        id: sessionUser.id,
        email: sessionUser.email,
        handle: sessionUser.email?.split('@')[0] || 'Member',
        name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || 'Classmate',
        avatar: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || '😎',
        grade: localStorage.getItem('campus_grade') || '11',
        flames: 0,
        is_pro: false
      });
    } finally {
      setIsAuthenticating(false);
      setIsCheckingSession(false);
      setIsAuthLoading(false);
    }
  };

  const fetchPendingRequests = async (userId = user?.id) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API}/friends/pending/${userId}`);
      const data = await res.json();
      if (data.pending) setPendingRequests(data.pending);
    } catch (err) {
      console.error('Pending requests error:', err);
    }
  };

  const fetchAcceptedFriends = async (userId = user?.id) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API}/friends/accepted/${userId}`);
      const data = await res.json();
      if (data.friends) setAcceptedFriends(data.friends);
    } catch (err) {
      console.error('Accepted friends error:', err);
    }
  };

  const fetchInbox = async (userId = user?.id) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API}/inbox/${userId}`);
      const data = await res.json();
      setInbox(data.messages || []);
      setInviteStats({
        effectiveInvites: data.effectiveInvites || 0,
        remaining: data.remaining !== undefined ? data.remaining : 3,
        canReveal: Boolean(data.canReveal)
      });
    } catch (e) {
      console.error('Fetch Inbox error:', e);
    }
  };

  const handleFriendResponse = async (friendshipId, action) => {
    try {
      const res = await fetch(`${API}/friends/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action })
      });
      const data = await res.json();
      if (data.success) {
        setPendingRequests(prev => prev.filter(req => req.friendshipId !== friendshipId));
        if (action === 'accept') {
          fetchAcceptedFriends();
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.4 } });
        }
      }
    } catch (err) {
      console.error('Friend response error:', err);
    }
  };

  // 1. Initialize Razorpay SDK & Capture ?ref= Referral Parameter
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref');
      if (refParam) {
        const cleanRef = refParam.trim().replace(/^@/, '');
        localStorage.setItem('campus_ref_code', cleanRef);
      }
    } catch (e) {
      console.error('Ref parameter capture error:', e);
    }

    if (!document.getElementById('razorpay-sdk')) {
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
    }
  }, []);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Helper to extract session tokens directly from URL hash
  const extractTokensFromHash = (hash = window.location.hash) => {
    if (!hash || !hash.includes('access_token')) return null;
    try {
      const cleanHash = hash.replace(/^#\/?/, '').replace(/^#/, '');
      const params = new URLSearchParams(cleanHash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token) {
        return { access_token, refresh_token: refresh_token || '' };
      }
    } catch (e) {
      console.error('Failed to parse auth hash:', e);
    }
    return null;
  };

  // Custom navigation listener for useNavigate hook
  useEffect(() => {
    const handleNavEvent = (e) => {
      const targetView = e.detail?.view;
      if (targetView === 'feed' || targetView === 'poll' || !targetView) {
        setView('poll');
      } else {
        setView(targetView);
      }
    };
    window.addEventListener('campus-navigate', handleNavEvent);
    return () => window.removeEventListener('campus-navigate', handleNavEvent);
  }, []);

  // ==============================================
  // REAL-TIME AUTH LISTENER & NATIVE PKCE HANDLER
  // ==============================================
  useEffect(() => {
    let isMounted = true;

    // 1. Native Supabase Listener (Handles PKCE ?code= exchange automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          setUser(session.user);
          setIsCheckingSession(false);
          setIsAuthLoading(false);
          setIsAuthenticating(false);

          // Clean the URL completely if Supabase left a code or hash behind
          if (window.location.search.includes('code=') || window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', '/feed');
          } else if (window.location.pathname === '/' || window.location.pathname === '/login') {
            navigate('/feed');
          }

          // Sync in background without blocking UI
          syncWithBackend(session.user).catch(err => console.warn('Background sync warning:', err));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsCheckingSession(false);
        setIsAuthLoading(false);
        setIsAuthenticating(false);
        setIsOnboarding(false);
        setOnboardingGoogleUser(null);
        navigate('/');
      }
    });

    // 2. Initial Mount Check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      
      if (session?.user) {
        setUser(session.user);
        setIsCheckingSession(false);
        setIsAuthLoading(false);
        syncWithBackend(session.user).catch(console.warn);
      } else {
        // Give PKCE flow 1.5 seconds to complete its background API exchange 
        // before dropping the user to the login screen.
        setTimeout(() => {
          if (isMounted) {
            setIsCheckingSession(false);
            setIsAuthLoading(false);
          }
        }, 1500);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setIsAuthenticating(true);
    localStorage.setItem('campus_grade', grade);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      alert("Login Failed: " + error.message);
      setIsAuthenticating(false);
    }
  };

  const login = async () => {
    if (!handle || !password) return alert('Enter credentials');
    setIsAuthenticating(true);
    try {
      const res = await fetch(`${API}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, password, grade, avatar })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      setGradeFilter(data.user.grade.toString());
      loadNextPoll(data.user.grade.toString(), data.user.id);
      fetchPendingRequests(data.user.id);
      fetchAcceptedFriends(data.user.id);
      fetchInbox(data.user.id);
    } catch (err) {
      alert(err.message);
    }
    setIsAuthenticating(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsOnboarding(false);
    setOnboardingGoogleUser(null);
    setPendingRequests([]);
    setAcceptedFriends([]);
    setView('poll');
  };

  const handleOnboardingComplete = (newUser) => {
    setUser(newUser);
    setIsOnboarding(false);
    setOnboardingGoogleUser(null);
    setView('poll');
    setGradeFilter(newUser.grade ? newUser.grade.toString() : '11');
    loadNextPoll(newUser.grade ? newUser.grade.toString() : '11', newUser.id);
    fetchPendingRequests(newUser.id);
    fetchAcceptedFriends(newUser.id);
    fetchInbox(newUser.id);
  };

  // ==============================================
  // GAMEPLAY & POLL ACTIONS
  // ==============================================
  const loadNextPoll = async (targetGrade, explicitId = null) => {
    setHasVoted(false);
    setIsLoadingPoll(true);
    setGradeFilter(targetGrade);
    const targetId = explicitId || user?.id;
    try {
      const res = await fetch(`${API}/play/${targetId}?gradeFilter=${targetGrade}`);
      const data = await res.json();
      setCurrentPoll(data.poll);
      setOptions((data.options || []).slice(0, 4));
      if (data.cooldown_until) {
        setCooldownUntil(data.cooldown_until);
      } else {
        setCooldownUntil(null);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoadingPoll(false);
  };

  const shuffleCurrentOptions = () => {
    setOptions(prev => [...prev].sort(() => 0.5 - Math.random()));
  };

  const castVote = async (receiverId) => {
    setHasVoted(true);
    // Optimistic user flame update
    setUser(prev => prev ? { ...prev, total_votes: (prev.total_votes || 0) + 1 } : prev);

    try {
      const res = await fetch(`${API}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: currentPoll?.id, voterId: user?.id, receiverId })
      });
      const data = await res.json();
      if (data.cooldown_until) {
        setCooldownUntil(data.cooldown_until);
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const handleSkipCooldown = async () => {
    try {
      const res = await fetch(`${API}/cooldown/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        setCooldownUntil(null);
        loadNextPoll(gradeFilter || '11');
      }
    } catch (e) {
      console.error('Failed to skip cooldown', e);
    }
  };

  const loadPublicProfile = async (userId) => {
    setView('publicProfile');
    setPublicProfile(null);
    try {
      const res = await fetch(`${API}/profile/public/${userId}`);
      const data = await res.json();
      setPublicProfile(data.user);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNav = (newView) => {
    setView(newView);
    const targetPath = newView === 'poll' ? '/feed' : `/${newView}`;
    if (window.location.pathname !== targetPath) {
      window.history.replaceState(null, '', targetPath);
    }
    if (newView === 'inbox') fetchInbox(user?.id);
    if (newView === 'explore') fetch(`${API}/explore/leaderboard`).then(r => r.json()).then(d => setLeaderboard(d.leaderboard || []));
    if (newView === 'profile') {
      fetchAcceptedFriends(user?.id);
      fetchPendingRequests(user?.id);
      fetch(`${API}/profile/${user?.id}`).then(r => r.json()).then(d => {
        setProfileData(d);
        setEditBio(d.user?.bio || '');
        setEditAvatar(d.user?.avatar || '');
        setEditRing(d.user?.ring || 'gold');
        setEditGrade(d.user?.grade ? d.user.grade.toString() : '11');
        setEditProfilePic(d.user?.profile_pic || '');
      });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      return alert('File size exceeds 2MB limit. Please choose a smaller photo.');
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setIsEditing(false);
    const updatedUser = {
      ...profileData.user,
      bio: editBio,
      avatar: editAvatar,
      ring: editRing,
      grade: editGrade,
      profile_pic: editProfilePic
    };
    setProfileData({ user: updatedUser });
    setUser({
      ...user,
      bio: editBio,
      avatar: editAvatar,
      ring: editRing,
      grade: editGrade,
      profile_pic: editProfilePic
    });
    await fetch(`${API}/profile/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bio: editBio,
        avatar: editAvatar,
        ring: editRing,
        grade: editGrade,
        profile_pic: editProfilePic
      })
    });
  };

  const deleteAccount = async () => {
    const pass = prompt('Warning: This is permanent. Enter password to delete account:');
    if (!pass) return;
    const res = await fetch(`${API}/profile/${user.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pass })
    });
    if (res.ok) setUser(null); else alert('Incorrect password.');
  };

  // ==============================================
  // IMMUTABLE RAZORPAY PAYMENT LOGIC
  // ==============================================
  const handleUpgrade = async (amount = 99) => {
    try {
      const amountInPaise = amount * 100;
      const orderRes = await fetch(`${API}/pay/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id || 'guest', amount: amountInPaise })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'CampusFeed',
        description: 'Unlock God Mode',
        order_id: orderData.id,
        handler: async (response) => {
          if (!user) return alert('Payment successful, but please log in first to activate!');

          const verifyRes = await fetch(`${API}/pay/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert('👑 God Mode Unlocked!');
            setUser({ ...user, is_pro: true, ring: 'gold' });
            setCooldownUntil(null);
            handleNav('inbox');
          } else {
            alert('Payment verification failed: ' + verifyData.error);
          }
        },
        theme: { color: '#ff6200' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert('Payment Failed: ' + response.error.description);
      });
      rzp.open();
    } catch (e) {
      alert('Checkout error. Ensure backend is running.');
      console.error(e);
    }
  };

  const fallbackCopy = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    }
    alert("Invite link copied to clipboard! Paste it in WhatsApp.");
  };

  const handleInviteShare = async () => {
    const userHandle = (user?.handle || 'campus').replace(/^@/, '').trim();
    const shareData = {
      title: 'CampusFeed',
      text: `Someone from St. Kabir voted for you! Join to see who. Use code: ${userHandle}`,
      url: 'https://campusfeed-frontend.vercel.app'
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          fallbackCopy(shareData.text + " " + shareData.url);
        }
      }
    } else {
      fallbackCopy(shareData.text + " " + shareData.url);
    }
  };

  const handleWhatsAppInvite = () => {
    handleInviteShare();
  };

  const handleOpenReveal = async (vote) => {
    setActiveRevealPopup({ id: vote.voteId, text: vote.question, vote });
    setRevealLoading(true);
    setRevealData(null);

    try {
      const res = await fetch(`${API}/inbox/reveal/${vote.voteId}?userId=${user.id}`);
      const data = await res.json();
      if (res.status === 403 || data.locked) {
        setRevealData({
          locked: true,
          remaining: data.remaining !== undefined ? data.remaining : 3,
          count: data.count || 0
        });
      } else if (res.ok && data.success) {
        setRevealData({
          locked: false,
          voterName: data.voterName,
          voterHandle: data.voterHandle,
          voterAvatar: data.voterAvatar,
          voterPic: data.voterPic,
          isPro: data.isPro,
          ring: data.ring
        });

        // Permanently reveal in local inbox list
        setInbox(prev => prev.map(item => item.voteId === vote.voteId ? {
          ...item,
          voterHandle: data.voterHandle,
          voterName: data.voterName,
          voterAvatar: data.voterAvatar,
          voterPic: data.voterPic,
          isPro: data.isPro,
          ring: data.ring,
          isLocked: false
        } : item));

        confetti({
          particleCount: 130,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#ff5500', '#fbbf24', '#00f0ff', '#10b981']
        });
      } else {
        throw new Error(data.error || 'Failed to reveal');
      }
    } catch (err) {
      console.error('Reveal error:', err);
      const remaining = Math.max(1, 3 - (user?.invites || 0));
      setRevealData({ locked: true, remaining });
    } finally {
      setRevealLoading(false);
    }
  };

  // Avatar + 3D Aura Renderer
  const renderProfilePic = (pic, ava, isPro, ring = 'gold', size = 80) => {
    const activeAura = isPro ? (AURA_RINGS[ring] || AURA_RINGS.gold) : AURA_RINGS.none;
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {pic ? (
          <img src={pic} alt="avatar" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', ...activeAura }} />
        ) : (
          <div
            style={{
              fontSize: `${size * 0.55}px`,
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              ...activeAura
            }}
          >
            {ava || '😎'}
          </div>
        )}
        {isPro && (
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              fontSize: `${size * 0.3}px`,
              filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.8))'
            }}
          >
            👑
          </motion.div>
        )}
      </div>
    );
  };

  // ==============================================
  // VIEW -1: NON-BLOCKING AUTH HAMSTER LOADER
  // ==============================================
  if (isCheckingSession || isAuthLoading || (isAuthenticating && !user && !isOnboarding)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100svh',
        background: '#09090b',
        color: '#ffffff',
        width: '100%'
      }}>
        <HamsterLoader message="Entering St. Kabir Loop..." />
      </div>
    );
  }

  // ==============================================
  // VIEW 0: ONBOARDING WIZARD (FOR NEW GOOGLE USERS)
  // ==============================================
  if (isOnboarding && onboardingGoogleUser) {
    return (
      <div className="gas-landing-wrapper">
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', background: '#09090b' }}><HamsterLoader message="Loading Onboarding..." /></div>}>
          <OnboardingWizard
            googleUser={onboardingGoogleUser}
            API={API}
            onComplete={handleOnboardingComplete}
          />
        </Suspense>
      </div>
    );
  }

  // ==============================================
  // VIEW 1: UNAUTHENTICATED LANDING PAGE
  // ==============================================
  if (!user) {
    return (
      <div className="gas-landing-wrapper">
        {/* --- TOP FIXED NAVBAR --- */}
        <header className="gas-landing-nav">
          <div className="gas-logo">
            <span className="flame-icon">🔥</span>
            <span>CAMPUSFEED</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="gas-school-badge">St. Kabir • Classes 9 to 12</span>

            <div className="tooltip-wrapper">
              <li className="nav-link">
                <div className="tooltip-tab">
                  <span>Support</span>
                  <svg viewBox="0 0 24 24"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" /></svg>
                </div>
                <div className="tooltip">
                  <ul className="tooltip-menu-with-icon">
                    <div style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                      Available 3 PM - 6 PM
                    </div>
                    <li className="tooltip-link">
                      <a href="https://instagram.com/_nikhilpuniyaai" target="_blank" rel="noreferrer">
                        @_nikhilpuniyaai
                      </a>
                    </li>
                    <li className="tooltip-link">
                      <a href="mailto:nikhilpuniya132@gmail.com">
                        nikhilpuniya132@gmail.com
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
            </div>
          </div>
        </header>

        {/* --- 3D HERO SECTION (SPLIT SHOWCASE) --- */}
        <section className="gas-hero-section">
          {/* Left Hero Column */}
          <div className="gas-hero-text">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="gas-pill-badge"
            >
              <span>🔥</span> The Gas App for St. Kabir
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="gas-hero-title"
            >
              STOP GUESSING.<br />
              <span className="glow-orange">START KNOWING.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="gas-hero-subtitle"
            >
              The 100% anonymous school voting network. Answer viral polls about your classmates, see who voted for you, and discover your secret admirers.
            </motion.p>

            {/* Desktop Only: Stats & CTA buttons inside left column */}
            <div className="gas-desktop-only">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="gas-hero-stats"
              >
                <div className="gas-stat-card">
                  <span className="gas-stat-number">12,480+</span>
                  <span className="gas-stat-label">Votes Cast</span>
                </div>
                <div className="gas-stat-card">
                  <span className="gas-stat-number">100%</span>
                  <span className="gas-stat-label">Anonymous</span>
                </div>
                <div className="gas-stat-card">
                  <span className="gas-stat-number">Class 11 & 12</span>
                  <span className="gas-stat-label">St. Kabir Only</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="gas-hero-cta-group"
              >
                <button
                  className="magic-btn"
                  onClick={() => document.getElementById('login-portal').scrollIntoView({ behavior: 'smooth' })}
                >
                  ENTER NETWORK ➔
                  <svg viewBox="0 0 24 24" className="star star-1"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z" /></svg>
                  <svg viewBox="0 0 24 24" className="star star-2"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z" /></svg>
                  <svg viewBox="0 0 24 24" className="star star-3"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z" /></svg>
                </button>

                <button
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    padding: '16px 28px',
                    borderRadius: '30px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)'
                  }}
                  onClick={() => document.getElementById('pricing-portal').scrollIntoView({ behavior: 'smooth' })}
                >
                  👑 God Mode VIP
                </button>
              </motion.div>
            </div>
          </div>

          {/* 3D Interactive Showcase Stage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="gas-hero-3d-stage"
          >
            {/* Floating 3D status chips */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="gas-float-chip gas-float-chip-1"
            >
              <span>🔥</span> Someone voted you "Best Smile"
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="gas-float-chip gas-float-chip-2"
            >
              <span>👑</span> Altaf unlocked God Mode
            </motion.div>

            {/* Live Interactive 3D Poll Sandbox */}
            <Suspense fallback={<div style={{ minHeight: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><HamsterLoader message="Loading Preview..." /></div>}>
              <InteractivePollDemo onCtaClick={() => document.getElementById('login-portal').scrollIntoView({ behavior: 'smooth' })} />
            </Suspense>
          </motion.div>

          {/* Mobile Only: CTA buttons and stats below the 3D card */}
          <div className="gas-mobile-only" style={{ width: '100%', maxWidth: '360px', margin: '0 auto' }}>
            <div className="gas-hero-cta-group" style={{ marginBottom: '16px' }}>
              <button
                className="magic-btn"
                style={{ width: '100%' }}
                onClick={() => document.getElementById('login-portal').scrollIntoView({ behavior: 'smooth' })}
              >
                ENTER NETWORK ➔
                <svg viewBox="0 0 24 24" className="star star-1"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z" /></svg>
                <svg viewBox="0 0 24 24" className="star star-2"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z" /></svg>
              </button>
            </div>

            <div className="gas-hero-stats">
              <div className="gas-stat-card">
                <span className="gas-stat-number">12,480+</span>
                <span className="gas-stat-label">Votes</span>
              </div>
              <div className="gas-stat-card">
                <span className="gas-stat-number">100%</span>
                <span className="gas-stat-label">Anonymous</span>
              </div>
              <div className="gas-stat-card">
                <span className="gas-stat-number">Class 11 & 12</span>
                <span className="gas-stat-label">St. Kabir</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- 3D HOLOGRAPHIC GOD MODE PRICING SECTION --- */}
        <section id="pricing-portal" className="pricing-section">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span className="gas-pill-badge" style={{ borderColor: '#fbbf24', color: '#fbbf24' }}>
              👑 Gas VIP Feature
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 6vw, 38px)', fontWeight: 950, margin: '10px 0', color: '#fff' }}>
              Unlock God Mode.
            </h2>
            <p style={{ color: '#94a3b8', maxWidth: '440px', margin: '0 auto', fontSize: '14px' }}>
              Stop wondering who voted for you. Reveal real names, equip glowing aura rings, and dominate the leaderboard.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '900px' }}>
            {/* 3D Holographic Card Preview (Desktop Only) */}
            <div className="gas-pricing-desktop-only">
              <Suspense fallback={<div style={{ minHeight: '380px' }} />}>
                <HolographicCard
                  title="GOD MODE"
                  subtitle="See Who Voted For You"
                  price={activePlan === 'weekly' ? '₹99' : activePlan === 'monthly' ? '₹149' : '₹0'}
                  period={activePlan === 'weekly' ? '/week' : activePlan === 'monthly' ? '/month' : '/forever'}
                  onAction={() => {
                    if (activePlan === 'basic') {
                      document.getElementById('login-portal').scrollIntoView({ behavior: 'smooth' });
                    } else {
                      handleUpgrade(activePlan === 'weekly' ? 99 : 149);
                    }
                  }}
                  actionText={activePlan === 'basic' ? 'Get Started Free ➔' : `Pay ₹${activePlan === 'weekly' ? '99' : '149'} Instantly ⚡`}
                />
              </Suspense>
            </div>

            {/* Plan Switcher Card (Phone & Desktop) */}
            <div className="pricing-modal">
              <h3 className="pricing-title">Choose Your Access</h3>
              <p className="pricing-description">Instantly activates across all St. Kabir Class 11 & 12 polls.</p>

              <div className="tab-container">
                <div className="indicator" data-active={activePlan}></div>
                <button className="tab" data-active={activePlan === 'basic'} onClick={() => setActivePlan('basic')}>Basic</button>
                <button className="tab" data-active={activePlan === 'weekly'} onClick={() => setActivePlan('weekly')}>Weekly</button>
                <button className="tab" data-active={activePlan === 'monthly'} onClick={() => setActivePlan('monthly')}>Monthly</button>
              </div>

              <div className="benefits">
                <span>What's included</span>
                <ul>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>Receive unlimited anonymous compliment polls</span>
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>{activePlan === 'basic' ? 'Invite 3 friends to reveal 1 name' : 'Unlimited Instant Name Reveals'}</span>
                  </li>
                  {activePlan !== 'basic' && (
                    <li>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Equip 3D Animated God Mode Aura Rings</span>
                    </li>
                  )}
                  {activePlan === 'monthly' && (
                    <li>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Save 62% vs Weekly Pass</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="modal--footer">
                <div className="price">
                  <sup>₹</sup>{activePlan === 'basic' ? '0' : activePlan === 'weekly' ? '99' : '149'}
                  <sub>/{activePlan === 'basic' ? 'mo' : activePlan === 'weekly' ? 'week' : 'mo'}</sub>
                </div>

                {activePlan === 'basic' ? (
                  <button className="upgrade-btn" style={{ background: '#27272a' }} onClick={() => document.getElementById('login-portal').scrollIntoView({ behavior: 'smooth' })}>
                    Start Free
                  </button>
                ) : (
                  <button className="upgrade-btn" onClick={() => handleUpgrade(activePlan === 'weekly' ? 99 : 149)}>
                    Pay ₹{activePlan === 'weekly' ? '99' : '149'} ⚡
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* --- 3D LOGIN PORTAL --- */}
        <section id="login-portal" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative' }}>
          <div style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 10 }}>
            <div className="form">
              <p>
                Join the Loop.
                <span>Select your class at St. Kabir to continue</span>
              </p>

              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="9">Class 9 (Freshmen)</option>
                <option value="10">Class 10 (Sophomores)</option>
                <option value="11">Class 11 (St. Kabir)</option>
                <option value="12">Class 12 (Seniors)</option>
              </select>

              <button className="oauthButton" onClick={loginWithGoogle} disabled={isAuthenticating}>
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {isAuthenticating ? 'Syncing...' : 'Continue with Google'}
              </button>

              {/* Manual Seed Account Login Toggle */}
              <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowManualLogin(!showManualLogin)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {showManualLogin ? '▲ Hide Test Accounts' : '▼ Or Sign in with Username / Seed Account'}
                </button>

                {showManualLogin && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                    <input
                      type="text"
                      placeholder="Handle (e.g., Gursharan Singh)"
                      value={handle}
                      onChange={e => setHandle(e.target.value)}
                      style={{ padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px' }}
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px' }}
                    />
                    <button
                      onClick={login}
                      style={{ padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #ff5500, #ff8800)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
                    >
                      Login with Password
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
              <p>
                By entering, you agree to our <br />
                <span onClick={() => setLegalView('terms')} style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>
                  Terms & Conditions
                </span>{' '}
                and{' '}
                <span onClick={() => setLegalView('privacy')} style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>
                  Privacy Policy
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* --- LEGAL MODAL --- */}
        <AnimatePresence>
          {legalView && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="gas-modal-overlay"
              onClick={() => setLegalView(null)}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                style={{ background: '#141522', color: '#fff', padding: '30px', borderRadius: '24px', maxWidth: '420px', width: '90%', border: '1px solid rgba(255,255,255,0.15)' }}
                onClick={e => e.stopPropagation()}
              >
                <h2 style={{ color: '#ff5500', marginTop: 0 }}>{legalView === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                  CampusFeed is an anonymous positive voting platform built for school communities. Compliments are moderated to promote positivity. Razorpay handles secure transactions.
                </p>
                <button
                  style={{ padding: '10px 20px', background: '#ff5500', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', marginTop: '16px' }}
                  onClick={() => setLegalView(null)}
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==============================================
  // VIEW 2: AUTHENTICATED IN-APP GAS EXPERIENCE
  // ==============================================
  return (
    <div className="gas-app-shell">
      <div className="gas-app-container">
        {/* PWA Install Banner */}
        {installPrompt && (
          <div
            style={{
              background: '#161616',
              borderBottom: '1px solid #262626',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              zIndex: 100,
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: '700' }}>
              <span>📲</span>
              <span>Install App to Home Screen</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  installPrompt.prompt();
                  setInstallPrompt(null);
                }}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '5px 12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  fontSize: '11.5px'
                }}
              >
                Install
              </button>
              <button
                onClick={() => setInstallPrompt(null)}
                style={{
                  background: 'transparent',
                  color: '#888888',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px 4px'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* App Top Header */}
        <header className="gas-app-header">
          <div className="gas-header-title">
            <span style={{ fontSize: '18px' }}>🔥</span>
            <span>ST. KABIR • CL-{user.grade}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="gas-header-votes">
              <span>🔥</span>
              <span>{user.total_votes || 0}</span>
            </div>

            {user.is_pro && (
              <span style={{ fontSize: '16px', filter: 'drop-shadow(0 0 6px #fbbf24)' }}>👑</span>
            )}

            {/* Friend Request Notifications Bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: '12px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '15px'
              }}
              title="Friend Requests"
            >
              🔔
              {pendingRequests.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ff2e93',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px #ff2e93'
                  }}
                >
                  {pendingRequests.length}
                </motion.span>
              )}
            </button>
          </div>
        </header>

        {/* Main View Area with 3D Transitions */}
        <main className="gas-app-body">
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '340px', width: '100%' }}><HamsterLoader message="Loading..." /></div>}>
            <AnimatePresence mode="wait">
              {/* --- TAB 1: VOTING FEED --- */}
              {view === 'poll' && (
                <motion.div key="poll" {...pageVariants} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Feed
                    user={user}
                    currentPoll={currentPoll}
                    options={options}
                    gradeFilter={gradeFilter}
                    isLoadingPoll={isLoadingPoll}
                    hasVoted={hasVoted}
                    cooldownUntil={cooldownUntil}
                    onLoadNextPoll={loadNextPoll}
                    onCastVote={castVote}
                    onShuffle={shuffleCurrentOptions}
                    renderProfilePic={renderProfilePic}
                    onUpgrade={(amount) => handleUpgrade(amount || 99)}
                    onSkipCooldown={handleSkipCooldown}
                  />
                </motion.div>
              )}

              {/* --- TAB 2: FLAME INBOX --- */}
              {view === 'inbox' && (
                <motion.div key="inbox" {...pageVariants}>
                  <Inbox
                    user={user}
                    inbox={inbox}
                    inviteStats={inviteStats}
                    onOpenReveal={handleOpenReveal}
                    onInviteShare={handleInviteShare}
                    showFriendSearch={showFriendSearch}
                    setShowFriendSearch={setShowFriendSearch}
                    API={API}
                    supabase={supabase}
                    onFriendAdded={() => fetchAcceptedFriends(user.id)}
                  />
                </motion.div>
              )}

              {/* --- TAB 3: GOD MODE VIP --- */}
              {view === 'pro' && (
                <motion.div key="pro" {...pageVariants} style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <HolographicCard
                    title={user.is_pro ? 'GOD MODE ACTIVE' : 'GOD MODE VIP'}
                    subtitle={user.is_pro ? 'All Features Unlocked' : 'Reveal Every Name'}
                    price="₹99"
                    period="/week"
                    onAction={() => handleUpgrade(99)}
                    actionText={user.is_pro ? '✓ Active Membership' : 'Upgrade Now - ₹99 ⚡'}
                  />
                </motion.div>
              )}

              {/* --- TAB 4: EXPLORE PAGE (SEARCH, TRENDING, LEGENDS & RANKS) --- */}
              {view === 'explore' && (
                <motion.div key="explore" {...pageVariants}>
                  <Explore
                    currentUser={user}
                    API={API}
                    supabase={supabase}
                    renderProfilePic={renderProfilePic}
                    onViewPublicProfile={loadPublicProfile}
                    onFriendAdded={() => fetchAcceptedFriends(user.id)}
                  />
                </motion.div>
              )}

              {/* --- TAB 5: USER PROFILE --- */}
              {view === 'profile' && (
                <motion.div key="profile" {...pageVariants}>
                  <Profile
                    user={user}
                    profileData={profileData}
                    acceptedFriends={acceptedFriends}
                    API={API}
                    supabase={supabase}
                    onUpdateUser={(updatedUser) => {
                      setUser(updatedUser);
                      setProfileData({ user: updatedUser });
                    }}
                    onLogout={handleLogout}
                    onDeleteAccount={deleteAccount}
                    onViewPublicProfile={loadPublicProfile}
                    renderProfilePic={renderProfilePic}
                    onInviteShare={handleInviteShare}
                    onRefreshFriends={() => fetchAcceptedFriends(user.id)}
                  />
                </motion.div>
              )}

              {/* --- PUBLIC PROFILE MODAL --- */}
              {view === 'publicProfile' && (
                <motion.div key="publicProfile" {...pageVariants} style={{ padding: '24px 16px', textAlign: 'center' }}>
                  {publicProfile ? (
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        {renderProfilePic(publicProfile.profile_pic, publicProfile.avatar, publicProfile.is_pro, publicProfile.ring, 100)}
                      </div>
                      <h2 style={{ margin: '0 0 6px 0', fontWeight: '900', color: publicProfile.is_pro ? '#fbbf24' : '#fff' }}>
                        @{publicProfile.handle}
                      </h2>
                      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                        {publicProfile.bio || 'Classmate at St. Kabir'}
                      </p>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 85, 0, 0.15)', padding: '6px 14px', borderRadius: '20px', color: '#ff8800', fontWeight: '800' }}>
                        <span>🔥</span> {publicProfile.total_votes || 0} Flames Received
                      </div>
                      <button
                        style={{ marginTop: '30px', padding: '12px 24px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
                        onClick={() => setView('explore')}
                      >
                        ← Back to Explore
                      </button>
                    </div>
                  ) : (
                    <p>Loading profile...</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Suspense>
        </main>

        {/* --- 3D FLOATING BOTTOM NAVIGATION DOCK --- */}
        <nav className="gas-bottom-dock">
          {[
            { id: 'poll', label: 'Feed', icon: '🔥' },
            { id: 'inbox', label: 'Inbox', icon: '📬' },
            { id: 'pro', label: 'God Mode', icon: '👑' },
            { id: 'explore', label: 'Explore', icon: '🧭' },
            { id: 'profile', label: 'Profile', icon: '👤' }
          ].map(tab => (
            <motion.div
              key={tab.id}
              whileTap={{ scale: 0.85 }}
              onClick={() => handleNav(tab.id)}
              className={`gas-dock-item ${view === tab.id ? 'active' : ''}`}
            >
              <span className="gas-dock-icon">{tab.icon}</span>
              <span className="gas-dock-label">{tab.label}</span>
              {view === tab.id && (
                <motion.div layoutId="activeDockGlow" className="gas-dock-glow-pill" />
              )}
            </motion.div>
          ))}
        </nav>

        {/* --- 3D REVEAL BOTTOM SHEET MODAL --- */}
        <AnimatePresence>
          {activeRevealPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="gas-modal-overlay"
              onClick={() => {
                setActiveRevealPopup(null);
                setRevealData(null);
              }}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="gas-modal-sheet"
                onClick={e => e.stopPropagation()}
              >
                <div className="gas-sheet-handle"></div>

                {/* Close Button Top Right */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
                  <button
                    onClick={() => {
                      setActiveRevealPopup(null);
                      setRevealData(null);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: '#94a3b8',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Question Text */}
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                  <p style={{ color: '#ff8800', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                    🔥 Secret Flame
                  </p>
                  <h3 style={{ fontSize: '18px', color: '#fff', margin: 0, padding: '0 8px', fontStyle: 'italic' }}>
                    "{activeRevealPopup.text}"
                  </h3>
                </div>

                {/* 3D Envelope Stage */}
                {revealLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                    <HamsterLoader message="Checking invite rewards..." />
                  </div>
                ) : revealData?.locked ? (
                  /* --- LOCKED STATE --- */
                  <div style={{ textAlign: 'center' }}>
                    {/* 3D Wax-sealed Locked Envelope Card */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        position: 'relative',
                        width: '130px',
                        height: '90px',
                        margin: '0 auto 18px auto',
                        background: 'linear-gradient(145deg, #1f202e, #13141f)',
                        border: '2px solid rgba(255, 85, 0, 0.4)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 16px 36px rgba(0,0,0,0.6), 0 0 30px rgba(255, 85, 0, 0.2)',
                      }}
                    >
                      <span style={{ fontSize: '46px' }}>✉️</span>
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        style={{
                          position: 'absolute',
                          bottom: '-10px',
                          right: '-10px',
                          background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          boxShadow: '0 0 16px rgba(239, 68, 68, 0.8)',
                          border: '2px solid #fff',
                        }}
                      >
                        🔒
                      </motion.div>
                    </motion.div>

                    {activeRevealPopup?.vote?.voterGender && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        background: activeRevealPopup.vote.voterGender === 'girl' ? 'rgba(255, 46, 147, 0.18)' : 'rgba(0, 240, 255, 0.18)',
                        border: activeRevealPopup.vote.voterGender === 'girl' ? '1px solid rgba(255, 46, 147, 0.4)' : '1px solid rgba(0, 240, 255, 0.4)',
                        color: activeRevealPopup.vote.voterGender === 'girl' ? '#ff2e93' : '#00f0ff',
                        fontWeight: '900',
                        fontSize: '12px',
                        marginBottom: '8px'
                      }}>
                        <span>{activeRevealPopup.vote.voterGender === 'girl' ? '🌸🔥' : '💙🔥'}</span>
                        <span>{activeRevealPopup.vote.voterGender === 'girl' ? 'Sent by a Girl in St. Kabir' : 'Sent by a Boy in St. Kabir'}</span>
                      </div>
                    )}

                    <h4 style={{ fontSize: '20px', fontWeight: '950', color: '#fff', margin: '0 0 6px 0' }}>
                      Secret Voter Locked
                    </h4>

                    {/* Exact User Prompt Requirement */}
                    <p style={{ color: '#cbd5e1', fontSize: '13.5px', lineHeight: '1.4', margin: '0 0 16px 0', padding: '0 8px' }}>
                      Invite <strong style={{ color: '#00f0ff', fontSize: '15px' }}>{revealData.remaining}</strong> more {revealData.remaining === 1 ? 'friend' : 'friends'} on WhatsApp or upgrade to God Mode to reveal instantly!
                    </p>

                    {/* Option 1: Viral Loop Invite Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleInviteShare}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        color: '#fff',
                        border: 'none',
                        padding: '15px',
                        borderRadius: '16px',
                        fontSize: '14.5px',
                        fontWeight: '950',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 0 25px rgba(37, 211, 102, 0.35), 0 8px 20px rgba(0,0,0,0.4)',
                        marginBottom: '10px',
                        letterSpacing: '0.3px',
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>📲</span> Invite 3 Friends on WhatsApp
                    </motion.button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0', color: '#64748b', fontSize: '11px', fontWeight: 'bold' }}>
                      <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} /> OR UNLOCK WITH GOD MODE <hr style={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                    </div>

                    {/* Option 2: God Mode Subscription (Direct ₹99 Weekly and ₹149 Monthly buttons) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="magic-btn"
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                          color: '#000',
                          margin: 0,
                          padding: '13px',
                          fontSize: '14px',
                          fontWeight: '950',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onClick={() => handleUpgrade(99)}
                      >
                        <span>⚡</span> ₹99 Weekly God Mode
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="magic-btn"
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #00f0ff, #0088ff)',
                          color: '#050c1e',
                          margin: 0,
                          padding: '13px',
                          fontSize: '14px',
                          fontWeight: '950',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onClick={() => handleUpgrade(149)}
                      >
                        <span>👑</span> ₹149 Monthly God Mode (Best Value)
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  /* --- UNLOCKED / REVEALED STATE --- */
                  <div style={{ textAlign: 'center' }}>
                    {/* 3D Open Golden Envelope Card */}
                    <motion.div
                      initial={{ scale: 0.7, rotateX: 60 }}
                      animate={{ scale: 1, rotateX: 0 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                      style={{
                        position: 'relative',
                        width: '130px',
                        height: '90px',
                        margin: '0 auto 16px auto',
                        background: 'linear-gradient(145deg, #fbbf24, #d97706)',
                        border: '2px solid #fef08a',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 16px 36px rgba(0,0,0,0.6), 0 0 35px rgba(251, 191, 36, 0.5)',
                      }}
                    >
                      <span style={{ fontSize: '48px' }}>💌</span>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                          position: 'absolute',
                          bottom: '-8px',
                          right: '-8px',
                          background: '#10b981',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          border: '2px solid #fff',
                          boxShadow: '0 0 12px #10b981',
                        }}
                      >
                        ✓
                      </motion.div>
                    </motion.div>

                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Secret Identity Unveiled
                    </span>

                    <div style={{ margin: '14px 0' }}>
                      {renderProfilePic(revealData?.voterPic, revealData?.voterAvatar, revealData?.isPro, revealData?.ring || 'gold', 72)}
                    </div>

                    <h3 style={{ fontSize: '24px', fontWeight: '950', color: '#fff', margin: '0 0 4px 0' }}>
                      {revealData?.voterName || revealData?.voterHandle}
                    </h3>
                    <p style={{ color: '#ff8800', fontWeight: '800', fontSize: '15px', margin: '0 0 20px 0' }}>
                      @{revealData?.voterHandle}
                    </p>

                    <button
                      className="magic-btn"
                      style={{ width: '100%' }}
                      onClick={() => {
                        setActiveRevealPopup(null);
                        setRevealData(null);
                        setView('poll');
                      }}
                    >
                      Answer Polls to Send Flame Back ➔
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FRIEND REQUEST NOTIFICATIONS MODAL --- */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="gas-modal-overlay"
              onClick={() => setShowNotifications(false)}
            >
              <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 50, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                className="gas-modal-sheet"
                style={{ maxWidth: '420px', margin: 'auto', borderRadius: '28px', padding: '24px 20px', background: 'rgba(20, 21, 34, 0.96)', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🔔</span>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '950', color: '#fff' }}>
                      Friend Requests
                    </h3>
                    <span style={{ fontSize: '12px', background: 'rgba(255, 46, 147, 0.2)', color: '#ff2e93', padding: '2px 8px', borderRadius: '12px', fontWeight: '900' }}>
                      {pendingRequests.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                  >
                    ✕
                  </button>
                </div>

                {pendingRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 10px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '42px', marginBottom: '10px' }}>📬</div>
                    <p style={{ margin: 0, fontWeight: '800', color: '#fff', fontSize: '15px' }}>No Pending Requests</p>
                    <p style={{ fontSize: '12.5px', margin: '6px 0 0 0', color: '#94a3b8' }}>Share your invite link with classmates to connect!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                    {pendingRequests.map(req => (
                      <motion.div
                        key={req.friendshipId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '18px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {renderProfilePic(req.requester?.profile_pic, req.requester?.avatar, req.requester?.is_pro, req.requester?.ring, 42)}
                          <div>
                            <span style={{ fontWeight: '900', color: '#fff', fontSize: '14px', display: 'block' }}>
                              @{req.requester?.handle}
                            </span>
                            <span style={{ color: '#ff8800', fontSize: '11px', fontWeight: '800' }}>
                              Class {req.requester?.grade || '11'} • St. Kabir
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleFriendResponse(req.friendshipId, 'accept')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '12px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              color: '#fff',
                              fontSize: '12.5px',
                              fontWeight: '900',
                              cursor: 'pointer',
                              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
                            }}
                          >
                            Accept
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleFriendResponse(req.friendshipId, 'decline')}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '12px',
                              border: '1px solid rgba(255,255,255,0.15)',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: '#94a3b8',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}