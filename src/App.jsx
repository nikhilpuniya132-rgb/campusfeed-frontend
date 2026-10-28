import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import bgVideo from './assets/campus_promo.mp4';
import './App.css';

// UI Components
import HamsterLoader from './components/HamsterLoader';

// Synchronous static imports
import TiltCard from './components/TiltCard';
import HolographicCard from './components/HolographicCard';
import OnboardingWizard from './components/OnboardingWizard';
import FriendSearch from './components/FriendSearch';
import Profile from './components/Profile';
import Inbox from './components/Inbox';
import Feed from './components/Feed';
import Explore from './components/Explore';
import BatchCaptainsLeaderboard from './components/BatchCaptainsLeaderboard';
import GodMode from './components/GodMode';
import Landing from './components/Landing';
import Signup from './components/Signup';
import AddToHomeScreenGuide from './components/AddToHomeScreenGuide';
import InstituteCombobox, { findHubForInstitute } from './components/InstituteCombobox';
import CustomPollSubmit from './components/CustomPollSubmit';
import { handleShare, showAppToast } from './utils/share';
import { isJuniorUser } from './constants/classes';
import { Plus, Heart, Home, Search, Crown, User } from 'lucide-react';

// --- INITIALIZE CONFIGURED SUPABASE CLIENT & NAVIGATION ---
import { supabase } from './supabase';
import { useNavigate } from './useNavigate';

const API = import.meta.env.VITE_BACKEND_URL || (
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:5000/api'
    : 'https://campusfeed-backend-po4g.onrender.com/api'
);

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


// Static class map for route backgrounds to ensure Tailwind compiles and does not purge
const bgMap = {
  '/feed': 'bg-[#00ff41]',
  '/explore': 'bg-[#0090ff]',
  '/pro': 'bg-[#ff007f]',
  '/profile': 'bg-[#f8f9fa]'
};

const ROUTE_THEMES = {
  poll: {
    bgClass: 'bg-[#00ff41]',
    bgColor: '#00ff41', // Neon Green
    accentColor: '#00ff41',
    glowColor: 'rgba(0, 255, 65, 0.9)',
    textColor: '#000000',
    title: 'Feed'
  },
  explore: {
    bgClass: 'bg-[#0090ff]',
    bgColor: '#0090ff', // Electric Blue
    accentColor: '#0090ff',
    glowColor: 'rgba(0, 144, 255, 0.9)',
    textColor: '#ffffff',
    title: 'Explore'
  },
  pro: {
    bgClass: 'bg-[#ff007f]',
    bgColor: '#ff007f', // Neon Pink
    accentColor: '#ff007f',
    glowColor: 'rgba(255, 0, 127, 0.9)',
    textColor: '#ffffff',
    title: 'God Mode'
  },
  profile: {
    bgClass: 'bg-[#f8f9fa]',
    bgColor: '#f8f9fa', // Off-White
    accentColor: '#00ff41',
    glowColor: 'rgba(0, 255, 65, 0.8)',
    textColor: '#000000',
    title: 'Profile'
  },
  publicProfile: {
    bgClass: 'bg-[#0090ff]',
    bgColor: '#0090ff',
    accentColor: '#0090ff',
    glowColor: 'rgba(0, 144, 255, 0.9)',
    textColor: '#ffffff',
    title: 'Classmate'
  },
  captains: {
    bgClass: 'bg-[#ffe600]',
    bgColor: '#ffe600',
    accentColor: '#ffe600',
    glowColor: 'rgba(255, 230, 0, 0.9)',
    textColor: '#000000',
    title: 'Leaderboard'
  },
  inbox: {
    bgClass: 'bg-[#ff007f]',
    bgColor: '#ff007f',
    accentColor: '#ff007f',
    glowColor: 'rgba(255, 0, 127, 0.9)',
    textColor: '#ffffff',
    title: 'Inbox'
  }
};

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: -10 },
  transition: { type: 'spring', damping: 25, stiffness: 260 }
};

export default function App() {
  const [profileStatus, setProfileStatus] = useState('CHECKING'); // 'CHECKING' | 'UNAUTHENTICATED' | 'INCOMPLETE' | 'COMPLETE'
  const [session, setSession] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const setProfile = setProfileData;
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('11');
  const [stream, setStream] = useState('Class 11');
  const [institute, setInstitute] = useState('');
  const [coachingHub, setCoachingHub] = useState('');
  const [avatar, setAvatar] = useState('😎');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingGoogleUser, setOnboardingGoogleUser] = useState(null);
  const inFlightAuthSessionIdRef = useRef(null);
  const lastFetchedSessionIdRef = useRef(null);

  const [activeRevealPopup, setActiveRevealPopup] = useState(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealData, setRevealData] = useState(null);
  const [showFriendSearch, setShowFriendSearch] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddPollModal, setShowAddPollModal] = useState(false);
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const [legalView, setLegalView] = useState(null);
  const [activePlan, setActivePlan] = useState('weekly'); 
  const [showManualLogin, setShowManualLogin] = useState(false);
  const navigate = useNavigate();
  const [currentRoute, setCurrentRoute] = useState(() => (typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '') : ''));

  const [view, setView] = useState(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '') : '';
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
  const [publicProfile, setPublicProfile] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editRing, setEditRing] = useState('gold');
  const [editGrade, setEditGrade] = useState('11');
  const [editProfilePic, setEditProfilePic] = useState('');

  const syncWithBackend = async (sessionUser, targetGrade = grade) => {
    if (!sessionUser) return;
    try {
      const selectedGrade = localStorage.getItem('campus_grade') || targetGrade || grade || '11';
      const cleanRef = (localStorage.getItem('referred_by') || sessionStorage.getItem('referred_by') || sessionStorage.getItem('campus_ref_code') || localStorage.getItem('campus_ref_code') || '').trim().replace(/^@/, '');
      await fetch(`${API}/auth/google`, {
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
    } catch (err) {
      console.warn('Backend sync non-critical warning:', err);
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
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const handleNavEvent = (e) => {
      const cleanPath = (e.detail?.path || window.location.pathname).replace(/^\//, '');
      setCurrentRoute(cleanPath);
      const currentUser = userRef.current;
      const currentHandle = (currentUser?.handle || currentUser?.username || '').trim();
      const currentGrade = (currentUser?.grade !== null && currentUser?.grade !== undefined) ? String(currentUser.grade).trim() : '';
      const currentInstitute = (currentUser?.institute || currentUser?.school || '').trim();
      if ((currentUser || session?.user) && (!currentHandle || !currentGrade || !currentInstitute)) {
        setIsOnboarding(true);
        window.history.replaceState(null, '', '/onboarding');
        return;
      }
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
  // AUTH STATE & ATOMIC profileStatus LIFECYCLE
  // =========================================================
  useEffect(() => {
    let isMounted = true;

    // Helper to process session and wait for Supabase profile resolution
    const processSession = async (activeSession) => {
      if (!isMounted) return;

      // 1. If no session exists: instantly set UNAUTHENTICATED
      if (!activeSession?.user) {
        setSession(null);
        setUser(null);
        setProfileData(null);
        userRef.current = null;
        setIsOnboarding(false);
        setProfileStatus('UNAUTHENTICATED');
        setIsAppReady(true);
        setIsProfileLoading(false);
        setIsAuthLoading(false);
        setIsCheckingSession(false);
        setIsAuthenticating(false);
        return;
      }

      // 2. If a session exists: transition profileStatus to 'CHECKING' and wait for DB
      setProfileStatus('CHECKING');
      setIsAppReady(false);
      setIsProfileLoading(true);
      setSession(activeSession);

      const sessionUser = activeSession.user;
      const currentSessionId = sessionUser.id;
      const currentSessionEmail = sessionUser.email || '';

      // Immediately clean URL fragment so browser and Supabase do not re-process the hash
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      try {
        // Query Supabase public `users` table for `handle` and `grade` using user ID
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentSessionId)
          .maybeSingle();

        if (error) {
          console.warn('Supabase profile fetch error:', error);
        }

        const hasHandle = Boolean(data?.handle && String(data.handle).trim() !== '');
        const hasGrade = Boolean(data?.grade !== null && data?.grade !== undefined && String(data.grade).trim() !== '');
        const hasInstitute = Boolean((data?.institute || data?.school) && String(data?.institute || data?.school).trim() !== '');

        if (!data || !hasHandle || !hasGrade || !hasInstitute) {
          // Profile incomplete: mark as 'INCOMPLETE' and prepare Google user context
          const cleanRef = (
            localStorage.getItem('referred_by') ||
            sessionStorage.getItem('referred_by') ||
            localStorage.getItem('campus_ref_code') ||
            sessionStorage.getItem('campus_ref_code') ||
            ''
          ).trim().replace(/^@/, '');
          const preSchool = (
            localStorage.getItem('pre_selected_school') ||
            localStorage.getItem('campus_institute') ||
            ''
          ).trim();

          localStorage.removeItem('campus_cached_user');

          const newGoogleUser = {
            googleId: currentSessionId,
            id: currentSessionId,
            email: currentSessionEmail,
            name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || currentSessionEmail?.split('@')[0] || '',
            avatar: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || '',
            refCode: cleanRef,
            referred_by: cleanRef,
            preSelectedSchool: preSchool,
            handle: data?.handle || '',
            grade: data?.grade || null,
            institute: data?.institute || preSchool || ''
          };

          setOnboardingGoogleUser(newGoogleUser);
          setUser(null);
          setProfileData(null);
          userRef.current = null;
          setIsOnboarding(true);
          setProfileStatus('INCOMPLETE');
          setCurrentRoute('onboarding');
          window.history.replaceState(null, '', '/onboarding');
        } else {
          // Profile complete: set full user and route to feed
          const userRing = data.selected_ring || data.ring || 'gold';
          const fullUser = { ...data, ring: userRing, selected_ring: userRing, id: currentSessionId };
          localStorage.setItem('campus_cached_user', JSON.stringify(fullUser));
          setProfileData(fullUser);
          setUser(fullUser);
          userRef.current = fullUser;
          setIsOnboarding(false);
          setOnboardingGoogleUser(null);
          setProfileStatus('COMPLETE');
          setView('poll');
          window.history.replaceState(null, '', '/feed');

          loadNextPoll(fullUser.grade ? fullUser.grade.toString() : '11', fullUser.id);
          fetchPendingRequests(fullUser.id);
          fetchAcceptedFriends(fullUser.id);
          fetchInbox(fullUser.id);
        }

        syncWithBackend(sessionUser).catch(console.warn);
      } catch (err) {
        console.error('Session processing error:', err);
        setProfileStatus('INCOMPLETE');
      } finally {
        // ONLY after database responds (complete or incomplete), release loading
        if (isMounted) {
          setIsProfileLoading(false);
          setIsAppReady(true);
          setIsAuthLoading(false);
          setIsCheckingSession(false);
          setIsAuthenticating(false);
        }
      }
    };

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        processSession(session);
      } else {
        processSession(null);
      }
    }).catch(() => {
      if (isMounted) {
        setProfileStatus('UNAUTHENTICATED');
        setIsAppReady(true);
        setIsProfileLoading(false);
        setIsAuthLoading(false);
        setIsCheckingSession(false);
        setIsAuthenticating(false);
      }
    });

    // 2. Auth state change listener (OAuth callback / sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfileData(null);
        setSession(null);
        setOnboardingGoogleUser(null);
        userRef.current = null;
        setIsOnboarding(false);
        localStorage.removeItem('campus_cached_user');
        setProfileStatus('UNAUTHENTICATED');
        setIsAppReady(true);
        setIsProfileLoading(false);
        setIsAuthLoading(false);
        setIsCheckingSession(false);
        setIsAuthenticating(false);

        const currentPath = window.location.pathname.replace(/^\//, '');
        if (currentPath === 'feed' || currentPath === 'poll' || currentPath === 'inbox' || currentPath === 'profile') {
          navigate('/');
        }
      } else if (session?.user) {
        setProfileStatus('CHECKING');
        setIsAppReady(false);
        setIsProfileLoading(true);
        await processSession(session);
      } else {
        processSession(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Persistent Auth Routing & Guard: If a logged-in user has completed handle, grade, and institute,
  // allow normal navigation to /feed. If half-onboarded, force them to stay in /onboarding.
  useEffect(() => {
    const currentUser = userRef.current;
    const userHandle = (currentUser?.handle || currentUser?.username || '').trim();
    const userGrade = (currentUser?.grade !== null && currentUser?.grade !== undefined) ? String(currentUser.grade).trim() : '';
    const userInstitute = (currentUser?.institute || currentUser?.school || '').trim();
    if (currentUser && userHandle && userGrade && userInstitute) {
      const currentPath = window.location.pathname.replace(/^\//, '');
      if (!currentPath || currentPath === 'landing' || currentPath === 'onboarding' || currentPath === 'signup') {
        window.history.replaceState(null, '', '/feed');
        setView('poll');
      }
    } else if (session?.user && (!userHandle || !userGrade || !userInstitute)) {
      if (window.location.pathname !== '/onboarding') {
        window.history.replaceState(null, '', '/onboarding');
      }
      setIsOnboarding(true);
    }
  }, [user, session]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, '');
      setCurrentRoute(path);
      const currentUser = userRef.current;
      const userHandle = (currentUser?.handle || currentUser?.username || '').trim();
      const userGrade = (currentUser?.grade !== null && currentUser?.grade !== undefined) ? String(currentUser.grade).trim() : '';
      const userInstitute = (currentUser?.institute || currentUser?.school || '').trim();
      if (session?.user && (!userHandle || !userGrade || !userInstitute)) {
        setIsOnboarding(true);
        window.history.replaceState(null, '', '/onboarding');
        return;
      }
      if (currentUser && userHandle && userGrade && userInstitute) {
        if (!path || path === 'landing') {
          window.history.replaceState(null, '', '/feed');
          setView('poll');
          return;
        }
        if (path === 'feed' || path === 'poll') setView('poll');
        else if (path === 'inbox') setView('inbox');
        else if (path === 'pro' || path === 'vip') setView('pro');
        else if (path === 'explore') setView('explore');
        else if (path === 'profile') setView('profile');
        else if (path === 'captains' || path === 'referrals' || path === 'leaderboard') setView('captains');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [session]);

  const loginWithGoogle = async (explicitSchool = null) => {
    setIsAuthenticating(true);

    const isSignupRoute = window.location.pathname.replace(/^\//, '') === 'signup';

    // Preserve non-auth user context (referral and school selection)
    const selectedSchool = isSignupRoute
      ? ''
      : (
        (typeof explicitSchool === 'string' && explicitSchool.trim()) ||
        (typeof institute === 'string' && institute.trim()) ||
        localStorage.getItem('pre_selected_school') ||
        localStorage.getItem('campus_institute') ||
        ''
      ).trim();

    const refCode = (
      localStorage.getItem('referred_by') ||
      sessionStorage.getItem('referred_by') ||
      localStorage.getItem('campus_ref_code') ||
      sessionStorage.getItem('campus_ref_code') ||
      ''
    ).trim();

    // Synchronous state & storage clean-up (no async network pre-flight delay)

    // Selectively wipe stale user tokens and cached data to prevent ghost logins,
    // while keeping storage clean for the new OAuth PKCE challenge
    localStorage.removeItem('campus_cached_user');
    localStorage.removeItem('campus_user_ring');
    localStorage.removeItem('selected_ring');
    localStorage.removeItem('applied_batch_captain');

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('-auth-token'))) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();

    // Restore essential non-auth preferences for onboarding
    if (selectedSchool) {
      localStorage.setItem('pre_selected_school', selectedSchool);
      localStorage.setItem('campus_institute', selectedSchool);
    } else {
      localStorage.removeItem('pre_selected_school');
      localStorage.removeItem('campus_institute');
    }

    if (refCode) {
      localStorage.setItem('referred_by', refCode);
      localStorage.setItem('campus_ref_code', refCode);
    }

    if (!isSignupRoute) {
      if (grade) localStorage.setItem('campus_grade', grade);
      if (stream) localStorage.setItem('campus_stream', stream);
      if (coachingHub) localStorage.setItem('campus_hub', coachingHub);
    } else {
      localStorage.removeItem('campus_stream');
      localStorage.removeItem('campus_grade');
      localStorage.removeItem('campus_hub');
    }

    // 2. Clear all React state
    setUser(null);
    setProfileData(null);
    setSession(null);
    setOnboardingGoogleUser(null);
    setIsOnboarding(false);
    userRef.current = null;
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: (typeof window !== 'undefined' && window.location.origin.includes('localhost'))
            ? `${window.location.origin}/onboarding`
            : 'https://centerinsider.vercel.app/onboarding',
          skipBrowserRedirect: false,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline'
          },
        },
      });
      
      if (error) {
        showAppToast("Login Failed: " + error.message, 'error');
        setIsAuthenticating(false);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (authErr) {
      console.error('Supabase Google OAuth failure:', authErr);
      showAppToast("Unable to connect to Google Auth. Please try again.", 'error');
      setIsAuthenticating(false);
    }
  };

  const login = async () => {
    if (!handle || !password) return alert('Enter credentials');
    setIsAuthenticating(true);
    try {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (_) {}
      try {
        await supabase.auth.signOut();
      } catch (_) {}
      localStorage.clear();
      sessionStorage.clear();

      const res = await fetch(`${API}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, password, grade, avatar })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const userRing = data.user?.selected_ring || data.user?.ring || localStorage.getItem('campus_user_ring') || 'gold';
      localStorage.setItem('campus_user_ring', userRing);
      const fullUser = { ...data.user, ring: userRing, selected_ring: userRing };
      localStorage.setItem('campus_cached_user', JSON.stringify(fullUser));
      setUser(fullUser);
      setProfileStatus('COMPLETE');
      setIsAppReady(true);
      setIsProfileLoading(false);

      if (data.user.institute && data.user.institute.trim()) {
        const currentPath = window.location.pathname.replace(/^\//, '');
        if (!currentPath || currentPath === 'landing') {
          window.history.replaceState(null, '', '/feed');
          setView('poll');
        }
      }

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
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (_) {}
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setUser(null);
    setProfileData(null);
    setSession(null);
    setOnboardingGoogleUser(null);
    setIsOnboarding(false);
    setProfileStatus('UNAUTHENTICATED');
    userRef.current = null;
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/'; // Hard redirect to completely clear cache
  };

  const handleOnboardingComplete = (newUser) => {
    const userRing = newUser?.selected_ring || newUser?.ring || localStorage.getItem('campus_user_ring') || 'gold';
    const fullUser = { ...newUser, ring: userRing, selected_ring: userRing };
    localStorage.setItem('campus_cached_user', JSON.stringify(fullUser));
    setUser(fullUser);
    setIsOnboarding(false);
    setOnboardingGoogleUser(null);
    setProfileStatus('COMPLETE');
    window.history.replaceState(null, '', '/feed');
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
      let pollItem = null;
      let pollOptions = [];
      let cooldownTime = null;

      // 1. Direct Supabase query strictly isolated to current user's institute
      if (supabase && user?.institute) {
        try {
          const targetPollTable = String(targetGrade || user?.grade || '11').trim() === '9' ? 'polls2' : 'polls';
          const [{ data: dbPolls }, { data: dbOptions }] = await Promise.all([
            supabase.from(targetPollTable).select('*'),
            supabase
              .from('users')
              .select('id, handle, name, avatar, profile_pic, grade, stream, institute, coaching_hub, is_pro, ring, selected_ring')
              .eq('institute', user.institute)
              .neq('id', targetId)
          ]);
          if (dbPolls && dbPolls.length > 0) {
            pollItem = dbPolls[Math.floor(Math.random() * dbPolls.length)];
          }
          if (dbOptions) {
            pollOptions = dbOptions;
          }
        } catch (dbErr) {
          console.warn('Direct Supabase poll load error:', dbErr);
        }
      }

      // 2. Fetch from backend API with institute filter
      const instParam = encodeURIComponent(user?.institute || '');
      const res = await fetch(`${API}/play/${targetId}?gradeFilter=${targetGrade}&institute=${instParam}`);
      if (res.ok) {
        const data = await res.json();
        if (!pollItem && data.poll) pollItem = data.poll;
        if (data.options) {
          const filteredOptions = data.options.filter(o => !user?.institute || o.institute === user.institute);
          if (pollOptions.length === 0) {
            pollOptions = filteredOptions;
          }
        }
        if (data.cooldown_until) cooldownTime = data.cooldown_until;
      }

      setCurrentPoll(pollItem);
      // Strictly isolated options for current user's institute and cohort (Junior vs Senior)
      const isJunior = isJuniorUser(user);
      const finalFiltered = pollOptions.filter(o => {
        if (user?.institute && o.institute !== user.institute) return false;
        return isJunior ? isJuniorUser(o) : !isJuniorUser(o);
      });
      const shuffled = [...finalFiltered].sort(() => 0.5 - Math.random());
      setOptions(shuffled);
      setCooldownUntil(cooldownTime);
    } catch (e) {
      console.error('Error loading next poll:', e);
      showAppToast('Could not refresh questions. Retrying...', 'error');
    } finally {
      setIsLoadingPoll(false);
    }
  };

  const shuffleCurrentOptions = () => {
    setOptions(prev => [...prev].sort(() => 0.5 - Math.random()));
  };

  const castVote = async (receiverId, explicitPollId = null) => {
    setHasVoted(true);
    setUser(prev => prev ? { ...prev, total_votes: (prev.total_votes || 0) + 1 } : prev);

    try {
      const res = await fetch(`${API}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId: explicitPollId || currentPoll?.id, voterId: user?.id, receiverId })
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
      if (!res.ok) {
        console.warn(`Public profile fetch returned status: ${res.status}`);
        return;
      }
      const data = await res.json().catch(() => null);
      if (data?.user) {
        setPublicProfile(data.user);
      }
    } catch (e) {
      console.error('Failed to load public profile:', e);
    }
  };

  const handleNav = (newView) => {
    if (user && (!user.institute || !user.institute.trim())) {
      setIsOnboarding(true);
      window.history.replaceState(null, '', '/onboarding');
      return;
    }
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
    setView(newView);
    const targetPath = newView === 'poll' ? '/feed' : `/${newView}`;
    if (window.location.pathname !== targetPath) {
      window.history.replaceState(null, '', targetPath);
    }
    if (newView === 'inbox') fetchInbox(user?.id);
    if (newView === 'explore') fetch(`${API}/explore/leaderboard`).then(r => r.json()).then(d => setLeaderboard(d.leaderboard || [])).catch(console.warn);
    if (newView === 'profile') {
      fetchAcceptedFriends(user?.id);
      fetchPendingRequests(user?.id);
      if (user?.id) {
        (async () => {
          try {
            const res = await fetch(`${API}/profile/${user.id}`);
            if (!res.ok) {
              console.warn(`Profile fetch returned status: ${res.status}`);
              if (!user.institute || !user.handle) {
                setIsOnboarding(true);
                navigate('/onboarding');
              }
              return;
            }
            const d = await res.json().catch(() => null);
            if (d && d.exists !== false && d.user) {
              setProfileData(d);
              setEditBio(d.user?.bio || '');
              setEditAvatar(d.user?.avatar || '');
              setEditRing(d.user?.ring || 'gold');
              setEditGrade(d.user?.grade ? d.user.grade.toString() : '11');
              setEditProfilePic(d.user?.profile_pic || '');
            } else if (d && d.exists === false) {
              if (!user.institute || !user.handle) {
                setIsOnboarding(true);
                navigate('/onboarding');
              }
            }
          } catch (err) {
            console.warn('Profile fetch safe handling warning:', err);
          }
        })();
      }
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
    const confirmed = window.confirm(
      "Warning: Are you sure you want to delete your account? This action is permanent, wipes all your profile data and votes, and cannot be undone."
    );
    if (!confirmed) return;

    try {
      // 1. Call the database function: delete user from auth and public records via RPC
      if (supabase) {
        const { error: rpcError } = await supabase.rpc('delete_user');
        if (rpcError) {
          console.error('Supabase delete_user RPC error:', rpcError);
          throw rpcError;
        }
      }

      // 2. Clear the local session
      if (supabase) {
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch (_) {}
        try {
          await supabase.auth.signOut();
        } catch (_) {}
      }

      // 3. Redirect the user back to the landing page or login screen
      setUser(null);
      setProfileData(null);
      setSession(null);
      setOnboardingGoogleUser(null);
      setIsOnboarding(false);
      userRef.current = null;
      localStorage.clear();
      sessionStorage.clear();
      alert('Your account has been deleted successfully.');
      window.location.href = '/';
    } catch (err) {
      console.error('Account deletion error:', err);
      alert('Failed to delete account: ' + err.message);
    }
  };

  const handleUpgrade = () => {
    // Pure invite loop: No paid subscriptions. Guide user to invite friends.
    handleNav('pro');
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

  const renderProfilePic = (pic, ava, isPro, ring = 'gold', size = 80, isLegend = false) => {
    // STRICT RULE: Status perks (Aura Rings and Crown badge) unlock ONLY for Lifetime Legends (>= 25 invites or is_god_mode / is_legend).
    // Basic God Mode (3 invites) users do NOT receive Aura Rings or Crown badges.
    const showStatusPerks = Boolean(
      isLegend === true ||
      (typeof isPro === 'object' && (isPro?.invites >= 25 || isPro?.recruits >= 25 || isPro?.is_god_mode || isPro?.is_legend)) ||
      (typeof ring === 'object' && (ring?.invites >= 25 || ring?.recruits >= 25 || ring?.is_god_mode || ring?.is_legend))
    );
    const ringName = typeof ring === 'string' ? ring : 'gold';
    const activeAura = (showStatusPerks && ringName && ringName !== 'none')
      ? (AURA_RINGS[ringName] || AURA_RINGS.gold)
      : AURA_RINGS.none;

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
        {showStatusPerks && (
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

  const hasOAuthFragment = typeof window !== 'undefined' && Boolean(
    window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('error='))
  );

  // =========================================================
  // =========================================================
  // SUPABASE ROUTE GUARD: ABSOLUTE TOP-LEVEL GATEKEEPER
  // =========================================================
  const userHandle = (user?.handle || user?.username || '').trim();
  const userGrade = (user?.grade !== null && user?.grade !== undefined) ? String(user.grade).trim() : '';
  const userInstitute = (user?.institute || user?.school || '').trim();
  const hasCompletedProfile = Boolean(user && userHandle !== '' && userGrade !== '' && userInstitute !== '');
  const isProfileIncomplete = Boolean(isOnboarding || !hasCompletedProfile);

  // 1. Loading State
  if (profileStatus === 'CHECKING' || !isAppReady || isProfileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <HamsterLoader message="Loading CampusFeed..." color="#00ff41" />
      </div>
    );
  }

  // 2. Auth State
  if (profileStatus === 'UNAUTHENTICATED' || !session) {
    if (currentRoute === 'signup' || (typeof window !== 'undefined' && window.location.pathname.replace(/^\//, '') === 'signup')) {
      return (
        <Signup
          loginWithGoogle={loginWithGoogle}
          isAuthenticating={isAuthenticating}
          legalView={legalView}
          setLegalView={setLegalView}
        />
      );
    }

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

  // 3. THE TOP-LEVEL LOCK (Must happen BEFORE tabs or feed are rendered)
  if (profileStatus === 'INCOMPLETE' || isProfileIncomplete || !hasCompletedProfile) {
    // Ensure URL matches the trap visually
    if (typeof window !== 'undefined' && window.location.pathname !== '/onboarding') {
      window.history.replaceState(null, '', '/onboarding');
    }
    const activeAuthUser = session?.user;
    const preSchool = (localStorage.getItem('pre_selected_school') || localStorage.getItem('campus_institute') || '').trim();
    const wizardUser = onboardingGoogleUser || (activeAuthUser ? {
      googleId: activeAuthUser.id,
      id: activeAuthUser.id,
      email: activeAuthUser.email,
      name: activeAuthUser.user_metadata?.full_name || activeAuthUser.user_metadata?.name || activeAuthUser.email?.split('@')[0] || '',
      avatar: activeAuthUser.user_metadata?.avatar_url || activeAuthUser.user_metadata?.picture || '',
      preSelectedSchool: preSchool
    } : null);
    // Notice there is no <Header>, no <BottomNav>, nothing else.
    return (
      <div className="gas-landing-wrapper bg-[#eaff00] min-h-screen w-full flex items-center justify-center" style={{ background: '#eaff00' }}>
        <OnboardingWizard
          googleUser={wizardUser}
          API={API}
          onComplete={handleOnboardingComplete}
        />
      </div>
    );
  }

  // 4. The Main App (Only reachable if profile is 100% complete)
  // ONLY if the profile is 100% complete do we render the Feed and Header

  const activeRoute = (view === 'poll' || view === 'feed')
    ? '/feed'
    : (view === 'pro' || view === 'vip')
    ? '/pro'
    : (view === 'explore')
    ? '/explore'
    : (view === 'profile')
    ? '/profile'
    : '/feed';

  const currentBgClass = bgMap[activeRoute] || bgMap['/feed'];
  const activeTheme = ROUTE_THEMES[view] || ROUTE_THEMES.poll;

  return (
    <div
      className={`gas-app-shell ${currentBgClass} h-[100dvh] w-full overflow-hidden flex flex-col relative transition-colors duration-500`}
      style={{
        transition: 'background-color 500ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="gas-app-container w-full max-w-md h-full flex flex-col relative overflow-hidden">
        {installPrompt && (
          <div
            className="w-full max-w-md mx-auto mt-2 px-4 py-2 bg-black/90 backdrop-blur-md rounded-2xl border border-gray-800 shadow-xl flex items-center justify-between text-xs z-50 box-border shrink-0"
          >
            <div className="flex items-center gap-2 text-white font-bold">
              <span>📲</span>
              <span>Install App to Home Screen</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  installPrompt.prompt();
                  setInstallPrompt(null);
                }}
                className="bg-white text-black rounded-xl px-3 py-1 font-black text-xs hover:bg-gray-200 transition-colors border-none cursor-pointer"
              >
                Install
              </button>
              <button
                onClick={() => setInstallPrompt(null)}
                className="text-gray-400 hover:text-white text-sm px-1 bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Floating Glassmorphic Pill Header */}
        <header className="gas-app-header-wrapper shrink-0">
          <div className="gas-app-header-pill">
            {/* Top-Left Element: + icon */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowAddPollModal(true)}
              aria-label="Add Poll"
              title="Add Poll"
              className="p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
            >
              <Plus size={20} strokeWidth={2.4} />
            </motion.button>

            {/* Center Brand */}
            <div
              onClick={() => handleNav('poll')}
              className="flex items-center gap-1.5 cursor-pointer select-none group"
            >
              <span className="text-base md:text-lg font-black tracking-tight text-white group-hover:scale-105 transition-transform">
                CenterInsider
              </span>
              <span
                className="w-2 h-2 rounded-full transition-colors duration-500"
                style={{
                  backgroundColor: activeTheme.accentColor,
                  boxShadow: `0 0 10px ${activeTheme.accentColor}`
                }}
              />
            </div>

            {/* Top-Right Element: Heart icon with red badge */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowNotifications(prev => !prev)}
              aria-label="Notifications"
              title="Notifications"
              className="relative p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
            >
              <Heart size={20} strokeWidth={2.2} />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#ef4444] text-white rounded-full min-w-[16px] h-[16px] px-1 text-[9px] font-black flex items-center justify-center border-2 border-black animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </motion.button>
          </div>
        </header>

        <main className="gas-app-body flex-1 flex flex-col justify-center overflow-hidden">
          <AnimatePresence mode="wait">
              {view === 'poll' && (
                <motion.div key="poll" {...pageVariants} className="flex-1 flex flex-col justify-center w-full overflow-hidden">
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
                    onOpenCaptains={() => {
                      setView('captains');
                      navigate('/captains');
                    }}
                    onToggleNotifications={() => setShowNotifications(prev => !prev)}
                    pendingRequestsCount={pendingRequests.length}
                    onUpdateUser={setUser}
                    supabase={supabase}
                    API={API}
                  />
                </motion.div>
              )}

              {view === 'inbox' && (
                <motion.div key="inbox" {...pageVariants} className="flex-1 flex flex-col justify-center w-full overflow-hidden">
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
                <motion.div key="pro" {...pageVariants} className="flex-1 flex flex-col justify-center w-full overflow-y-auto">
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
                <motion.div key="explore" {...pageVariants} className="flex-1 flex flex-col justify-center w-full overflow-y-auto">
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
                <motion.div key="profile" {...pageVariants} className="flex-1 flex flex-col justify-center w-full overflow-y-auto">
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
                <motion.div key="publicProfile" {...pageVariants} className="flex-1 flex flex-col justify-center w-full overflow-hidden px-4 text-center">
                  {publicProfile ? (
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        {renderProfilePic(publicProfile.profile_pic, publicProfile.avatar, publicProfile.is_pro, publicProfile.ring, 80, Boolean(publicProfile.invites >= 25 || publicProfile.recruits >= 25 || publicProfile.is_god_mode || publicProfile.is_legend))}
                      </div>
                      <h2 style={{ margin: '0 0 4px 0', fontWeight: '900', color: publicProfile.is_pro ? '#fbbf24' : '#fff' }}>
                        @{publicProfile.handle}
                      </h2>
                      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
                        {publicProfile.bio || (publicProfile.institute ? `${publicProfile.institute} • ${publicProfile.stream || 'Bathinda'}` : 'Bathinda Coaching Network')}
                      </p>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 85, 0, 0.15)', padding: '6px 14px', borderRadius: '20px', color: '#ff8800', fontWeight: '800' }}>
                        <span>🔥</span> {publicProfile.total_votes || 0} Flames Received
                      </div>
                      <div style={{ marginTop: '20px' }}>
                        <button
                          style={{ padding: '10px 20px', borderRadius: '14px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: '800', cursor: 'pointer' }}
                          onClick={() => setView('explore')}
                        >
                          ← Back to Explore
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                      <HamsterLoader message="Loading profile..." color="#ffffff" />
                    </div>
                  )}
                </motion.div>
              )}

              {view === 'captains' && (
                <motion.div key="captains" {...pageVariants} className="flex-1 flex flex-col justify-center w-full overflow-hidden">
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
        </main>

        <nav
          className="fixed left-4 right-4 md:left-6 md:right-6 bottom-3 md:bottom-6 max-w-md mx-auto bg-black/90 backdrop-blur-md rounded-full shadow-2xl flex justify-around py-2.5 md:py-3 border border-gray-800 z-50"
          style={{
            bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.75), 0 0 25px rgba(0, 0, 0, 0.5)'
          }}
          aria-label="Main Navigation"
        >
          {/* a) Home (Outline Icon) -> Feed (Neon Green Glow) */}
          <motion.div
            whileTap={{ scale: 0.86 }}
            onClick={() => handleNav('poll')}
            className={`gas-dock-item ${view === 'poll' ? 'active' : ''}`}
            aria-label="Feed"
            role="button"
          >
            <Home
              size={24}
              strokeWidth={view === 'poll' ? 2.5 : 1.8}
              color={view === 'poll' ? '#00ff41' : '#71717a'}
              style={view === 'poll' ? { filter: 'drop-shadow(0 0 8px #00ff41)' } : {}}
            />
            {view === 'poll' && (
              <motion.div
                layoutId="activeDockGlow"
                className="gas-dock-glow-pill"
                style={{ backgroundColor: '#00ff41', boxShadow: '0 0 10px #00ff41' }}
              />
            )}
          </motion.div>

          {/* b) Magnifying Glass (Outline Icon) -> Explore (Electric Blue Glow) */}
          <motion.div
            whileTap={{ scale: 0.86 }}
            onClick={() => handleNav('explore')}
            className={`gas-dock-item ${view === 'explore' ? 'active' : ''}`}
            aria-label="Explore"
            role="button"
          >
            <Search
              size={24}
              strokeWidth={view === 'explore' ? 2.5 : 1.8}
              color={view === 'explore' ? '#0090ff' : '#71717a'}
              style={view === 'explore' ? { filter: 'drop-shadow(0 0 8px #0090ff)' } : {}}
            />
            {view === 'explore' && (
              <motion.div
                layoutId="activeDockGlow"
                className="gas-dock-glow-pill"
                style={{ backgroundColor: '#0090ff', boxShadow: '0 0 10px #0090ff' }}
              />
            )}
          </motion.div>

          {/* c) Crown (Outline Icon) -> God Mode (Neon Pink Glow) */}
          <motion.div
            whileTap={{ scale: 0.86 }}
            onClick={() => handleNav('pro')}
            className={`gas-dock-item ${view === 'pro' ? 'active' : ''}`}
            aria-label="God Mode"
            role="button"
          >
            <Crown
              size={24}
              strokeWidth={view === 'pro' ? 2.5 : 1.8}
              color={view === 'pro' ? '#ff007f' : '#71717a'}
              style={view === 'pro' ? { filter: 'drop-shadow(0 0 8px #ff007f)' } : {}}
            />
            {view === 'pro' && (
              <motion.div
                layoutId="activeDockGlow"
                className="gas-dock-glow-pill"
                style={{ backgroundColor: '#ff007f', boxShadow: '0 0 10px #ff007f' }}
              />
            )}
          </motion.div>

          {/* d) Profile Avatar -> Profile (Neon Glow) */}
          <motion.div
            whileTap={{ scale: 0.86 }}
            onClick={() => handleNav('profile')}
            className={`gas-dock-item ${view === 'profile' ? 'active' : ''}`}
            aria-label="Profile"
            role="button"
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                padding: '1.5px',
                border: view === 'profile' ? '2px solid #00ff41' : '2px solid transparent',
                boxShadow: view === 'profile' ? '0 0 10px rgba(0, 255, 65, 0.8)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease'
              }}
            >
              {user?.profile_pic ? (
                <img
                  src={user.profile_pic}
                  alt="Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: '#18181b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px'
                  }}
                >
                  {user?.avatar || <User size={15} strokeWidth={1.8} color={view === 'profile' ? '#00ff41' : '#71717a'} />}
                </div>
              )}
            </div>
            {view === 'profile' && (
              <motion.div
                layoutId="activeDockGlow"
                className="gas-dock-glow-pill"
                style={{ backgroundColor: '#00ff41', boxShadow: '0 0 10px #00ff41' }}
              />
            )}
          </motion.div>
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
                  <p style={{ color: '#ffffff', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 6px 0' }}>
                    🔥 Secret Flame
                  </p>
                  <h3 style={{ fontSize: '18px', color: '#ffffff', margin: 0, padding: '0 8px', fontStyle: 'italic' }}>
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
                        background: '#111827',
                        border: '1px solid #1f2937',
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
                        background: '#18181b',
                        border: '1px solid #27272a',
                        color: '#d4d4d8',
                        fontWeight: '800',
                        fontSize: '12px',
                        marginBottom: '8px'
                      }}>
                        <span>{activeRevealPopup.vote.voterGender === 'girl' ? '🌸' : '💙'}</span>
                        <span>{activeRevealPopup.vote.voterGender === 'girl' ? 'Sent by a Girl in your coaching hub' : 'Sent by a Boy in your coaching hub'}</span>
                      </div>
                    )}

                    <h4 style={{ fontSize: '20px', fontWeight: '900', color: '#ffffff', margin: '0 0 6px 0' }}>
                      Secret Voter Locked
                    </h4>

                    <p style={{ color: '#a1a1aa', fontSize: '13.5px', lineHeight: '1.4', margin: '0 0 16px 0', padding: '0 8px' }}>
                      Invite <strong style={{ color: '#ffffff', fontSize: '15px' }}>{revealData.remaining}</strong> more {revealData.remaining === 1 ? 'friend' : 'friends'} to unlock voter identities for 1 month.
                    </p>

                    {/* Invite Share Action Button */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleInviteShare}
                        style={{
                          width: '100%',
                          background: '#ffffff',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '14px',
                          padding: '12px 16px',
                          fontSize: '13px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                        <span>Share Invite Link</span>
                      </motion.button>
                      <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Unlocks automatically when friends join</span>
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
                      {renderProfilePic(revealData?.voterPic, revealData?.voterAvatar, revealData?.isPro, revealData?.ring || 'gold', 72, Boolean(revealData?.isLegend))}
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
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                      Friend Requests
                    </h3>
                    <span style={{ fontSize: '12px', background: '#27272a', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                      {pendingRequests.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    style={{ background: '#27272a', border: 'none', color: '#a1a1aa', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                  >
                    ✕
                  </button>
                </div>

                {pendingRequests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 10px', color: '#a1a1aa' }}>
                    <div style={{ fontSize: '42px', marginBottom: '10px' }}>📬</div>
                    <p style={{ margin: 0, fontWeight: '800', color: '#ffffff', fontSize: '15px' }}>No Pending Requests</p>
                    <p style={{ fontSize: '12.5px', margin: '6px 0 0 0', color: '#a1a1aa' }}>Share your invite link with classmates to connect!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                    {pendingRequests.map((req, reqIdx) => (
                      <motion.div
                        key={req.friendshipId || req.id || `pending-req-${req.requester?.handle || reqIdx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '18px',
                          background: '#111827',
                          border: '1px solid #1f2937'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {renderProfilePic(req.requester?.profile_pic, req.requester?.avatar, req.requester?.is_pro, req.requester?.ring, 42, Boolean(req.requester?.invites >= 25 || req.requester?.recruits >= 25 || req.requester?.is_god_mode || req.requester?.is_legend))}
                          <div>
                            <span style={{ fontWeight: '800', color: '#ffffff', fontSize: '14px', display: 'block' }}>
                              @{req.requester?.handle}
                            </span>
                            <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '600' }}>
                              {req.requester?.stream || '11th Med'} • {req.requester?.institute || 'Bathinda'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleFriendResponse(req.friendshipId, 'accept')}
                            style={{
                              minHeight: '44px',
                              minWidth: '44px',
                              padding: '8px 14px',
                              borderRadius: '12px',
                              border: 'none',
                              background: '#ffffff',
                              color: '#000000',
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
                              minHeight: '44px',
                              minWidth: '44px',
                              padding: '8px 12px',
                              borderRadius: '12px',
                              border: '1px solid #27272a',
                              background: '#18181b',
                              color: '#a1a1aa',
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

        <AnimatePresence>
          {showAddPollModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="gas-modal-overlay"
              onClick={() => setShowAddPollModal(false)}
              style={{ zIndex: 1000 }}
            >
              <motion.div
                initial={{ y: 50, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 50, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                className="gas-modal-sheet"
                style={{
                  maxWidth: '420px',
                  margin: 'auto',
                  borderRadius: '28px',
                  padding: '20px 18px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                  maxHeight: '88vh',
                  overflowY: 'auto'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>✍️</span>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#ffffff' }}>
                      Add New Poll
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddPollModal(false)}
                    aria-label="Close modal"
                    style={{
                      background: '#18181b',
                      border: 'none',
                      color: '#a1a1aa',
                      borderRadius: '50%',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <CustomPollSubmit
                  user={user}
                  API={API}
                  supabase={supabase}
                  onPollCreated={() => {
                    setShowAddPollModal(false);
                    if (view === 'poll') {
                      loadNextPoll();
                    }
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}