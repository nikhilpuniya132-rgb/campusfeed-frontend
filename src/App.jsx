import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import bgVideo from './assets/campus_promo.mp4';
import './App.css';

// UI Components
import HamsterLoader from './components/HamsterLoader';

// Lazily loaded components
const TiltCard = lazy(() => import('./components/TiltCard'));
const HolographicCard = lazy(() => import('./components/HolographicCard'));
const InteractivePollDemo = lazy(() => import('./components/InteractivePollDemo'));
const OnboardingWizard = lazy(() => import('./components/OnboardingWizard'));
const FriendSearch = lazy(() => import('./components/FriendSearch'));
const Profile = lazy(() => import('./components/Profile'));
const Inbox = lazy(() => import('./components/Inbox'));
const Feed = lazy(() => import('./components/Feed'));
const Explore = lazy(() => import('./components/Explore'));
const BatchCaptainsLeaderboard = lazy(() => import('./components/BatchCaptainsLeaderboard'));
const GodMode = lazy(() => import('./components/GodMode'));
import AddToHomeScreenGuide from './components/AddToHomeScreenGuide';
import InstituteCombobox, { findHubForInstitute } from './components/InstituteCombobox';
import Landing from './components/Landing';
import { handleShare } from './utils/share';

// --- INITIALIZE CONFIGURED SUPABASE CLIENT & NAVIGATION ---
import { supabase } from './supabase';
import { useNavigate } from './useNavigate';

const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : 'https://campusfeed-backend-po4g.onrender.com/api';

const AURA_RINGS = {
  none: { border: 'none', boxShadow: 'none' },
  gold: { border: '3px solid #d97706', boxShadow: '0 0 10px rgba(217, 119, 6, 0.45)' },
  neon: { border: '3px solid #2563eb', boxShadow: '0 0 10px rgba(37, 99, 235, 0.45)' },
  blueEnergy: { border: '3px solid #2563eb', boxShadow: '0 0 10px rgba(37, 99, 235, 0.45)' },
  ruby: { border: '3px solid #dc2626', boxShadow: '0 0 10px rgba(220, 38, 38, 0.45)' },
  crimsonFire: { border: '3px solid #dc2626', boxShadow: '0 0 10px rgba(220, 38, 38, 0.45)' },
  purple: { border: '3px solid #7c3aed', boxShadow: '0 0 10px rgba(124, 58, 237, 0.45)' },
  neonPurple: { border: '3px solid #7c3aed', boxShadow: '0 0 10px rgba(124, 58, 237, 0.45)' },
  emerald: { border: '3px solid #059669', boxShadow: '0 0 10px rgba(5, 150, 105, 0.45)' }
};

// Dynamic taxonomy badge for city-wide coaching network
function getCoachingBadge(u) {
  if (!u) return '🔥 BATHINDA';
  const hub = (u.coaching_hub || u.hub || '').toLowerCase();
  const stream = (u.stream || '').toLowerCase();
  const grade = (u.grade || '').toString().toLowerCase();

  let hubText = 'BATHINDA';
  if (hub.includes('ajit')) hubText = 'AJIT ROAD';
  else if (hub.includes('100')) hubText = '100 FEET RD';

  let streamText = '11TH MED';
  if (stream.includes('non')) streamText = '11TH NON-MED';
  else if (stream.includes('med')) streamText = '11TH MED';
  else if (stream.includes('comm') || stream.includes('12')) streamText = '12TH COMM';
  else if (stream.includes('drop') || grade.includes('drop')) streamText = 'DROPPER';
  else if (grade === '12') streamText = '12TH BOARD';
  else if (grade === '11') streamText = '11TH MED';

  return `🔥 ${hubText} • ${streamText}`;
}

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -10 },
  transition: { type: 'spring', damping: 25, stiffness: 260 }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('11');
  const [stream, setStream] = useState('11th Medical');
  const [institute, setInstitute] = useState('Kapil Institute');
  const [coachingHub, setCoachingHub] = useState('Ajit Road Hub');
  const [avatar, setAvatar] = useState('😎');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingGoogleUser, setOnboardingGoogleUser] = useState(null);

  const [activeRevealPopup, setActiveRevealPopup] = useState(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealData, setRevealData] = useState(null);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const [legalView, setLegalView] = useState(null);
  const [activePlan, setActivePlan] = useState('weekly'); 
  const [showManualLogin, setShowManualLogin] = useState(false);
  const navigate = useNavigate();

  const [view, setView] = useState(() => {
    const path = window.location.pathname.replace(/^\//, '');
    if (path === 'feed' || path === 'poll') return 'poll';
    if (path === 'inbox') return 'inbox';
    if (path === 'pro' || path === 'vip') return 'pro';
    if (path === 'explore') return 'explore';
    if (path === 'profile') return 'profile';
    if (path === 'captains' || path === 'referrals' || path === 'leaderboard') return 'captains';
    return 'poll';
  });
  
  const [gradeFilter, setGradeFilter] = useState('11');
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

  const syncWithBackend = async (sessionUser, targetGrade = grade) => {
    if (!sessionUser) return;
    setIsAuthenticating(true);
    try {
      const selectedGrade = localStorage.getItem('campus_grade') || targetGrade || grade || '11';
      const cleanRef = (sessionStorage.getItem('campus_ref_code') || localStorage.getItem('campus_ref_code') || '').trim().replace(/^@/, '');
      const res = await fetch(`${API}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0],
          avatar: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || '',
          grade: selectedGrade,
          refCode: cleanRef || undefined,
          referred_by: cleanRef || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication sync failed');
      if (data.isNewUser) {
        setOnboardingGoogleUser({ ...(data.googleUser || {}), refCode: cleanRef, referred_by: cleanRef });
        setIsOnboarding(true);
        const userRing = data.user?.selected_ring || data.user?.ring || localStorage.getItem('campus_user_ring') || 'gold';
        localStorage.setItem('campus_user_ring', userRing);
        setUser(prev => ({ ...(prev || {}), ...data.user, ring: userRing, selected_ring: userRing }));
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
        }
      }
    } catch (err) {
      console.error('Friend response error:', err);
    }
  };

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref');
      if (refParam) {
        const cleanRef = refParam.trim().replace(/^@/, '');
        sessionStorage.setItem('campus_ref_code', cleanRef);
        sessionStorage.setItem('referred_by', cleanRef);
        localStorage.setItem('campus_ref_code', cleanRef);
        localStorage.setItem('referred_by', cleanRef);
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

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    const handleNavEvent = (e) => {
      const targetView = e.detail?.view;
      if (targetView === 'feed' || targetView === 'poll' || !targetView) {
        setView('poll');
      } else if (targetView === 'captains' || targetView === 'referrals' || targetView === 'leaderboard') {
        setView('captains');
      } else {
        setView(targetView);
      }
    };
    window.addEventListener('campus-navigate', handleNavEvent);
    return () => window.removeEventListener('campus-navigate', handleNavEvent);
  }, []);

  // =========================================================
  // BULLETPROOF PKCE AUTH LISTENER & GHOST-LOGOUT IMMUNITY
  // =========================================================
  useEffect(() => {
    let isMounted = true;
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    let isProcessingCode = Boolean(code);

    const initAuth = async () => {
      // 1. Manual Interception & Explicit Exchange
      if (code) {
        setIsCheckingSession(true);
        setIsAuthLoading(true);
        setIsAuthenticating(true);

        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          let activeSession = data?.session;

          // If exchange failed (e.g. already consumed by detectSessionInUrl or React StrictMode), check existing session
          if (error) {
            console.warn('PKCE exchange error, checking existing session:', error.message);
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
              activeSession = sessionData.session;
            }
          }

          if (activeSession?.user) {
            // 3. Clean Up: Wipe ?code= from the URL so it doesn't trigger twice
            window.history.replaceState(null, '', '/feed');

            if (isMounted) {
              setUser(activeSession.user);
              setView('poll');
              await syncWithBackend(activeSession.user);
            }
          } else {
            console.error('Failed to establish session after PKCE exchange');
            window.history.replaceState(null, '', '/feed');
          }
        } catch (err) {
          console.error('PKCE exchange exception:', err);
          window.history.replaceState(null, '', '/feed');
        } finally {
          isProcessingCode = false;
          if (isMounted) {
            setIsCheckingSession(false);
            setIsAuthLoading(false);
            setIsAuthenticating(false);
          }
        }
      } else {
        // 4. Standard Fallback: No code in URL, gracefully fall back to getSession()
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!isMounted) return;
          if (session?.user) {
            setUser(session.user);
            syncWithBackend(session.user).catch(console.warn);
          }
        } catch (err) {
          console.error('Session retrieval error:', err);
        } finally {
          if (isMounted) {
            setIsCheckingSession(false);
            setIsAuthLoading(false);
          }
        }
      }
    };

    // 5. Setup onAuthStateChange with Ghost-Logout Immunity
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      // Ghost-Logout Immunity: Strictly ignore SIGNED_OUT while PKCE code is processing
      // Also ignore SIGNED_OUT generally because logout is explicitly handled by handleLogout
      if (event === 'SIGNED_OUT') {
        if (isProcessingCode) {
          console.warn('Ghost-logout suppressed during PKCE code exchange');
        }
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          setUser(session.user);
          setIsCheckingSession(false);
          setIsAuthLoading(false);
          setIsAuthenticating(false);
          
          if (window.location.search.includes('code=')) {
            window.history.replaceState(null, '', '/feed');
          } else if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', '/feed');
          } else if (window.location.pathname === '/' || window.location.pathname === '/login') {
            navigate('/feed');
          }
        }
      }
    });

    initAuth();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    setIsAuthenticating(true);
    localStorage.setItem('campus_grade', grade);
    localStorage.setItem('campus_stream', stream);
    localStorage.setItem('campus_institute', institute);
    localStorage.setItem('campus_hub', coachingHub || findHubForInstitute(institute));
    
    const redirectUrl = (typeof window !== 'undefined' && window.location.origin)
      ? `${window.location.origin}/feed`
      : 'https://campusfeed-frontend.vercel.app/feed';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
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
    localStorage.clear();
    window.location.href = '/'; // Hard redirect to completely clear cache
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

  const handleCooldownUnlocked = () => {
    setCooldownUntil(null);
    loadNextPoll(gradeFilter || '11');
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
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
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
        name: 'CenterInsider',
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

  const handleInviteShare = async () => {
    const userHandle = (user?.invite_code || user?.handle || 'campus').replace(/^@/, '').trim();
    const shareUrl = `${window.location.origin}/?ref=${encodeURIComponent(userHandle)}`;
    const shareText = `Someone from your coaching hub voted for you on CenterInsider! Join to see who: ${shareUrl}`;

    await handleShare({
      title: 'CenterInsider',
      text: shareText,
      url: shareUrl
    });
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
        <HamsterLoader message="Entering Bathinda Coaching Loop..." />
      </div>
    );
  }

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

  if (!user) {
    return (
      <Landing
        grade={grade}
        setGrade={setGrade}
        stream={stream}
        setStream={setStream}
        institute={institute}
        setInstitute={setInstitute}
        coachingHub={coachingHub}
        setCoachingHub={setCoachingHub}
        loginWithGoogle={loginWithGoogle}
        isAuthenticating={isAuthenticating}
        showManualLogin={showManualLogin}
        setShowManualLogin={setShowManualLogin}
        handle={handle}
        setHandle={setHandle}
        password={password}
        setPassword={setPassword}
        login={login}
        legalView={legalView}
        setLegalView={setLegalView}
        activePlan={activePlan}
        setActivePlan={setActivePlan}
        handleUpgrade={handleUpgrade}
        installPrompt={installPrompt}
      />
    );
  }

  return (
    <div className="gas-app-shell">
      <div className="gas-app-container">
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

        <header className="gas-app-header">
          <div className="gas-header-title">
            <span>{getCoachingBadge(user)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="gas-header-votes">
              <span>🔥</span>
              <span>{user.total_votes || 0}</span>
            </div>

            {user.is_pro && (
              <span style={{ fontSize: '15px' }}>👑</span>
            )}

            <button
              onClick={() => {
                setView('captains');
                navigate('/captains');
              }}
              style={{
                background: view === 'captains' ? '#000000' : '#f3f4f6',
                border: view === 'captains' ? '1px solid #000000' : '1px solid #e5e7eb',
                color: view === 'captains' ? '#ffffff' : '#374151',
                borderRadius: '12px',
                padding: '0 10px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: '800'
              }}
              title="Batch Captains Leaderboard"
            >
              <span>👑</span>
              <span>Captains</span>
            </button>

            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: 'relative',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                color: '#000000',
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
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#000000',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'none'
                  }}
                >
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="gas-app-body">
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '340px', width: '100%' }}><HamsterLoader message="Loading..." /></div>}>
            <AnimatePresence mode="wait">
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
                    onSkipCooldown={handleCooldownUnlocked}
                    onCooldownUnlocked={handleCooldownUnlocked}
                  />
                </motion.div>
              )}

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

              {view === 'pro' && (
                <motion.div key="pro" {...pageVariants} style={{ width: '100%', overflowY: 'auto' }}>
                  <GodMode
                    user={user}
                    onUpgrade={handleUpgrade}
                    onNavigate={handleNav}
                    supabase={supabase}
                    API={API}
                    onUpdateUser={(updatedUser) => {
                      setUser(prev => ({ ...prev, ...updatedUser }));
                      setProfileData(prev => prev ? ({ ...prev, user: { ...prev.user, ...updatedUser } }) : null);
                    }}
                    renderProfilePic={renderProfilePic}
                  />
                </motion.div>
              )}

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
                        {publicProfile.bio || (publicProfile.institute ? `${publicProfile.institute} • ${publicProfile.stream || 'Bathinda'}` : 'Bathinda Coaching Network')}
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

              {view === 'captains' && (
                <motion.div key="captains" {...pageVariants}>
                  <BatchCaptainsLeaderboard
                    user={user}
                    API={API}
                    onBack={() => {
                      setView('poll');
                      navigate('/feed');
                    }}
                    renderProfilePic={renderProfilePic}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Suspense>
        </main>

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

                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                  <p style={{ color: '#111827', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                    🔥 Secret Flame
                  </p>
                  <h3 style={{ fontSize: '18px', color: '#000000', margin: 0, padding: '0 8px', fontStyle: 'italic' }}>
                    "{activeRevealPopup.text}"
                  </h3>
                </div>

                {revealLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                    <HamsterLoader message="Checking invite rewards..." />
                  </div>
                ) : revealData?.locked ? (
                  <div style={{ textAlign: 'center' }}>
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        position: 'relative',
                        width: '130px',
                        height: '90px',
                        margin: '0 auto 18px auto',
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'none',
                      }}
                    >
                      <span style={{ fontSize: '46px' }}>✉️</span>
                      <motion.div
                        style={{
                          position: 'absolute',
                          bottom: '-10px',
                          right: '-10px',
                          background: '#000000',
                          color: '#ffffff',
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          boxShadow: 'none',
                          border: '2px solid #ffffff',
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
                        background: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        color: '#374151',
                        fontWeight: '800',
                        fontSize: '12px',
                        marginBottom: '8px'
                      }}>
                        <span>{activeRevealPopup.vote.voterGender === 'girl' ? '🌸' : '💙'}</span>
                        <span>{activeRevealPopup.vote.voterGender === 'girl' ? 'Sent by a Girl in your coaching hub' : 'Sent by a Boy in your coaching hub'}</span>
                      </div>
                    )}

                    <h4 style={{ fontSize: '20px', fontWeight: '900', color: '#000000', margin: '0 0 6px 0' }}>
                      Secret Voter Locked
                    </h4>

                    <p style={{ color: '#6b7280', fontSize: '13.5px', lineHeight: '1.4', margin: '0 0 16px 0', padding: '0 8px' }}>
                      Invite <strong style={{ color: '#000000', fontSize: '15px' }}>{revealData.remaining}</strong> more {revealData.remaining === 1 ? 'friend' : 'friends'} to unlock voter identities, or upgrade to God Mode.
                    </p>

                    {/* Minimalist Share Icon Button */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleInviteShare}
                        aria-label="Share Link"
                        title="Share Invite Link"
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          border: '1px solid #e5e7eb',
                          background: '#f3f4f6',
                          color: '#000000',
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0', color: '#6b7280', fontSize: '11px', fontWeight: 'bold' }}>
                      <hr style={{ flex: 1, borderColor: '#e5e7eb' }} /> OR UNLOCK WITH GOD MODE <hr style={{ flex: 1, borderColor: '#e5e7eb' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="magic-btn"
                        style={{
                          width: '100%',
                          background: '#f3f4f6',
                          color: '#000000',
                          border: '1px solid #e5e7eb',
                          borderRadius: '14px',
                          margin: 0,
                          padding: '12px 6px',
                          fontSize: '12.5px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          boxShadow: 'none'
                        }}
                        onClick={() => handleUpgrade(99)}
                      >
                        <span>⚡</span> ₹99 / Wk
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="magic-btn"
                        style={{
                          width: '100%',
                          background: '#000000',
                          color: '#ffffff',
                          border: '1px solid #000000',
                          borderRadius: '14px',
                          margin: 0,
                          padding: '12px 6px',
                          fontSize: '12.5px',
                          fontWeight: '900',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          boxShadow: 'none'
                        }}
                        onClick={() => handleUpgrade(149)}
                      >
                        <span>👑</span> ₹149 / Mo
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
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
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#000000' }}>
                      Friend Requests
                    </h3>
                    <span style={{ fontSize: '12px', background: '#f3f4f6', color: '#000000', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                      {pendingRequests.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    style={{ background: '#f3f4f6', border: 'none', color: '#6b7280', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                  >
                    ✕
                  </button>
                </div>

                {pendingRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 10px', color: '#6b7280' }}>
                    <div style={{ fontSize: '42px', marginBottom: '10px' }}>📬</div>
                    <p style={{ margin: 0, fontWeight: '800', color: '#000000', fontSize: '15px' }}>No Pending Requests</p>
                    <p style={{ fontSize: '12.5px', margin: '6px 0 0 0', color: '#6b7280' }}>Share your invite link with classmates to connect!</p>
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
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {renderProfilePic(req.requester?.profile_pic, req.requester?.avatar, req.requester?.is_pro, req.requester?.ring, 42)}
                          <div>
                            <span style={{ fontWeight: '800', color: '#000000', fontSize: '14px', display: 'block' }}>
                              @{req.requester?.handle}
                            </span>
                            <span style={{ color: '#6b7280', fontSize: '11px', fontWeight: '600' }}>
                              {req.requester?.stream || '11th Med'} • {req.requester?.institute || 'Bathinda'}
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
                              border: '1px solid #000000',
                              background: '#000000',
                              color: '#ffffff',
                              fontSize: '12.5px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              boxShadow: 'none'
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
                              border: '1px solid #e5e7eb',
                              background: '#f3f4f6',
                              color: '#6b7280',
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