import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import bgVideo from './assets/campus_promo.mp4'; 
import './App.css';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://campusfeed-backend-po4g.onrender.com/api';

const AURA_RINGS = {
  none: { border: 'none', boxShadow: 'none' },
  gold: { border: '4px solid var(--accent-pro)', boxShadow: '0 0 15px rgba(251, 191, 36, 0.5)' },
  neonPurple: { border: '4px solid #d946ef', boxShadow: '0 0 20px #d946ef, inset 0 0 10px #d946ef' },
  blueEnergy: { border: '4px dashed #3b82f6', boxShadow: '0 0 15px rgba(59, 130, 246, 0.8)' },
  crimsonFire: { border: '4px double #ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.8)' }
};

const pageVariants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { type: "tween", duration: 0.25 } };

export default function App() {
  // --- STATE VARIABLES ---
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('11');
  const [avatar, setAvatar] = useState('😎');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // UI States
  const [activeRevealPopup, setActiveRevealPopup] = useState(null);
  const [legalView, setLegalView] = useState(null);
  const [activePlan, setActivePlan] = useState('weekly'); // 'basic', 'weekly', or 'monthly'

  // Logged-in App States
  const [view, setView] = useState('poll');
  const [gradeFilter, setGradeFilter] = useState('11');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPoll, setCurrentPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoadingPoll, setIsLoadingPoll] = useState(false); 
  
  const [inbox, setInbox] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null); 

  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editRing, setEditRing] = useState('gold');

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!document.getElementById('razorpay-sdk')) {
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
    }
  }, []);

  // --- HELPERS ---
  const renderProfilePic = (pic, ava, isPro, ring = 'gold', size = 100) => {
    const activeAura = isPro ? (AURA_RINGS[ring] || AURA_RINGS.gold) : AURA_RINGS.none;
    
    return (
      <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto 15px' }}>
        {pic ? (
          <img src={pic} alt="profile" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', ...activeAura }} />
        ) : (
          <div style={{ fontSize: `${size * 0.6}px`, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f4f4f5', ...activeAura }}>
            {ava}
          </div>
        )}
        {isPro && <div style={{ position: 'absolute', bottom: -5, right: '50%', transform: 'translateX(50%)', fontSize: `${size * 0.25}px` }}>👑</div>}
      </div>
    );
  };

  // --- ACTIONS ---
  const loginWithGoogle = () => {
    alert("Google Auth Triggered - We will wire this to Supabase next!");
  };

  const login = async () => {
    if (!handle || !password) return alert('Enter credentials');
    setIsAuthenticating(true);
    try {
      const res = await fetch(`${API}/auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle, password, grade, avatar }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      setGradeFilter(data.user.grade.toString());
      loadNextPoll(data.user.grade.toString(), data.user.id);
    } catch (err) { alert(err.message); }
    setIsAuthenticating(false);
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
      setOptions(data.options || []);
    } catch (e) { console.error(e); }
    setIsLoadingPoll(false);
  };

  const castVote = (receiverId) => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setHasVoted(true); 
    fetch(`${API}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pollId: currentPoll.id, voterId: user.id, receiverId }) });
  };

  const loadPublicProfile = async (userId) => {
    setView('publicProfile');
    setPublicProfile(null);
    try {
      const res = await fetch(`${API}/profile/public/${userId}`);
      const data = await res.json();
      setPublicProfile(data.user);
    } catch (e) { console.error(e); }
  };

  const handleNav = (newView) => {
    setView(newView);
    if (newView === 'inbox') fetch(`${API}/inbox/${user.id}`).then(r => r.json()).then(d => setInbox(d.messages || []));
    if (newView === 'explore') fetch(`${API}/explore/leaderboard`).then(r => r.json()).then(d => setLeaderboard(d.leaderboard || []));
    if (newView === 'profile') fetch(`${API}/profile/${user.id}`).then(r => r.json()).then(d => { 
      setProfileData(d); 
      setEditBio(d.user.bio || ''); 
      setEditAvatar(d.user.avatar || ''); 
      setEditRing(d.user.ring || 'gold');
    });
  };

  const saveProfile = async () => {
    setIsEditing(false);
    const updatedUser = { ...profileData.user, bio: editBio, avatar: editAvatar, ring: editRing };
    setProfileData({ user: updatedUser }); 
    setUser({ ...user, avatar: editAvatar, ring: editRing });
    await fetch(`${API}/profile/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bio: editBio, avatar: editAvatar, ring: editRing }) });
  };

  const deleteAccount = async () => {
    const pass = prompt('Warning: This is permanent. Enter password to delete account:');
    if (!pass) return;
    const res = await fetch(`${API}/profile/${user.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pass }) });
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
        name: 'CampusFeed', 
        description: 'Unlock God Mode', 
        order_id: orderData.id,
        handler: async (response) => {
          if (!user) return alert("Payment successful, but please log in first to activate!");
          
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
            handleNav('inbox'); 
          } else {
            alert('Payment verification failed: ' + verifyData.error);
          }
        }, 
        theme: { color: '#ff6200' }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();
    } catch (e) { 
      alert('Checkout error. Ensure backend is running.'); 
      console.error(e);
    }
  };

  const handleWhatsAppInvite = () => {
    const inviteText = "Someone in St. Kabir Class 11 thinks you're the best! 👀 See who voted for you on CampusFeed: https://campusfeed-frontend-3ok7rlgyt-campusfeed.vercel.app";
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
    window.open(whatsappUrl, '_blank');
  };

  // ==============================================
  // LANDING PAGE (UNAUTHENTICATED)
  // ==============================================
  if (!user) {
    return (
<div className="gas-app-container" style={{ background: '#09090b', overflowX: 'hidden', overflowY: 'auto', position: 'relative', width: '100%' }}>
        
        {/* --- HERO SECTION WITH VIDEO & SUPPORT DROPDOWN --- */}
        <div style={{ position: 'relative', minHeight: '100svh' }}>
          <div className="gas-video-wrapper">
            <video className="gas-video-bg" autoPlay loop muted playsInline>
              <source src={bgVideo} type="video/mp4" />
            </video>
            <div className="gas-video-overlay"></div>
          </div>

          <div className="gas-landing-content" style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
            
            <div style={{ position: 'absolute', top: '20px', left: '20px', fontWeight: 'bold', letterSpacing: '2px', color: '#fff' }}>
              CAMPUSFEED®
            </div>

            <div className="tooltip-wrapper">
              <li className="nav-link">
                <div className="tooltip-tab">
                  <span style={{ fontWeight: 'bold' }}>Support</span>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z"></path></svg>
                </div>
                <div className="tooltip">
                  <ul className="tooltip-menu-with-icon">
                    <div style={{ padding: '10px 15px', fontSize: '12px', color: '#a1a1aa', borderBottom: '1px solid #3f3f46', textAlign: 'center' }}>
                      Available: 3 PM - 6 PM
                    </div>
                    <li className="tooltip-link">
                      <a href="https://instagram.com/_nikhilpuniyaai" target="_blank" rel="noreferrer">
                        <svg viewBox="0 0 24 24"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.555.556.9 1.11 1.152 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772c-.556.555-1.11.9-1.772 1.152-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.836-7.864a1.08 1.08 0 1 1-2.16 0 1.08 1.08 0 0 1 2.16 0z"/></svg>
                        @_nikhilpuniyaai
                      </a>
                    </li>
                    <li className="tooltip-link">
                      <a href="https://snapchat.com/add/nikhilpuniya132" target="_blank" rel="noreferrer">
                        <svg viewBox="0 0 24 24"><path d="M12.126 23.955c-1.536 0-3.023-.153-4.237-.714-1.002-.463-1.616-1.22-1.802-2.228-.052-.279.083-.55.333-.703.966-.593 1.354-1.144 1.354-1.91 0-.16-.017-.323-.053-.489-.107-.492-.35-.91-.707-1.218-.635-.55-1.637-.674-2.884-.36a.855.855 0 0 1-.951-.45c-.283-.556-.232-1.127.147-1.64.444-.602 1.258-1.05 2.225-1.223.782-.14 1.543-.016 2.158.35.408.243.834.337 1.246.275.602-.09 1.107-.464 1.455-1.077a2.535 2.535 0 0 0 .341-1.226c.007-.156.01-.314.01-.475 0-3.155 1.03-5.59 2.97-7.018C15.006 1.871 16.71 1.764 18 2.06c1.17.27 2.12 1.074 2.738 2.316.634 1.272.784 2.875.434 4.621a2.64 2.64 0 0 0 .285 1.775c.324.58.825.962 1.457 1.107.412.095.845.02 1.256-.217.585-.34 1.312-.486 2.067-.417.892.083 1.63.468 2.046 1.066.368.528.384 1.08.046 1.64-.176.29-.48.45-.795.424-1.116-.09-2.008.083-2.585.502-.32.234-.52.553-.58.927-.05.313-.023.633.083.928.324.896 1.002 1.47 1.957 1.654.262.05.424.31.393.578-.088.75-.417 1.344-.946 1.711-.79.548-1.92.812-3.253.76-.714-.027-1.463-.116-2.203-.263a2.915 2.915 0 0 0-.585-.058c-1.378 0-2.482.937-2.673 2.27-.04.28-.2.53-.45.702-1.242.85-2.822 1.034-4.57 1.034z"/></svg>
                        nikhilpuniya132
                      </a>
                    </li>
                    <li className="tooltip-link">
                      <a href="mailto:nikhilpuniya132@gmail.com">
                        <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                        nikhilpuniya132@gmail.com
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
            </div>
            
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} style={{ textAlign: 'center', width: '100%' }}>
              <h1 style={{ fontSize: '72px', margin: 0, color: '#ff6200', letterSpacing: '-2px' }}>CAMPUS</h1>
              <div style={{ fontSize: '24px', color: '#fff', fontStyle: 'italic', marginTop: '-10px' }}>stop guessing.</div>
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ marginTop: '40px', fontSize: '18px', color: '#e4e4e7', maxWidth: '400px', textAlign: 'center', fontWeight: '500' }}>
              The anonymous network designed exclusively for Class 11. Find out who really likes you.
            </motion.p>

            <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
              className="magic-btn"
              onClick={() => document.getElementById('login-portal').scrollIntoView({ behavior: 'smooth' })}>
              ENTER NETWORK ➔
              <svg viewBox="0 0 24 24" className="star star-1" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
              <svg viewBox="0 0 24 24" className="star star-2" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
              <svg viewBox="0 0 24 24" className="star star-3" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
              <svg viewBox="0 0 24 24" className="star star-4" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
              <svg viewBox="0 0 24 24" className="star star-5" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
              <svg viewBox="0 0 24 24" className="star star-6" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
            </motion.button>
          </div>
        </div>

        {/* --- NEW PRICING MODAL SLIDE --- */}
        <div className="pricing-section">
          <div className="pricing-modal">
            <h2 className="pricing-title">Unlock God Mode.</h2>
            <p className="pricing-description">Find out exactly who is voting for you in St. Kabir without guessing.</p>
            
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0bdd12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Receive unlimited anonymous polls</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0bdd12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>{activePlan === 'basic' ? 'Invite 3 friends to reveal 1 name' : 'Unlimited Instant Reveals'}</span>
                </li>
                {activePlan !== 'basic' && (
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0bdd12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span>God Mode: See exactly who voted</span>
                  </li>
                )}
                {activePlan === 'monthly' && (
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0bdd12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span style={{ color: '#ff6200' }}>Save 62% vs Weekly Plan</span>
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
                <button className="upgrade-btn" style={{ background: '#18181b' }} onClick={() => document.getElementById('login-portal').scrollIntoView({ behavior: 'smooth' })}>
                  Get Started Free
                </button>
              ) : (
                <button className="upgrade-btn" onClick={() => handleUpgrade(activePlan === 'weekly' ? 99 : 149)}>
                  Pay ₹{activePlan === 'weekly' ? '99' : '149'} Instantly
                </button>
              )}
            </div>
          </div>
        </div>

       

        {/* --- GALAXY LOGIN PORTAL & GOOGLE AUTH --- */}
        <div id="login-portal" className="stars-container" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
          
          <div className="stars-layer-1" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }} />
          <div className="stars-layer-2" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }} />
          <div className="stars-layer-3" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }} />

          <div style={{ width: '100%', maxWidth: '350px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <div className="form">
              <p>Join the Loop.<span>Select your class to continue</span></p>
              
              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="11">Class 11 (St. Kabir)</option>
                <option value="12">Class 12 (St. Kabir)</option>
              </select>

              <button className="oauthButton" onClick={loginWithGoogle}>
                <svg className="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '13px', color: '#a1a1aa' }}>
              <p>By entering, you agree to our <br />
                <span onClick={() => setLegalView('terms')} style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>Terms & Conditions</span>
              </p>
            </div>
          </div>
        </div>

        {/* --- LEGAL VIEW MODAL --- */}
        <AnimatePresence>
          {legalView && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLegalView(null)}>
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} style={{ background: '#fff', color: '#000', padding: '30px', borderRadius: '16px', width: '80%' }} onClick={e => e.stopPropagation()}>
                <h2 style={{ color: '#ff6200', marginTop: 0 }}>{legalView === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}</h2>
                <p>Standard Razorpay compliance text goes here.</p>
                <button style={{ padding: '10px 20px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px' }} onClick={() => setLegalView(null)}>Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ==============================================
  // AUTHENTICATED STATE (WHEN USER IS LOGGED IN)
  // ==============================================
  return (
    <div className="gas-app-container">
      <div className="gas-top-nav">
        <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${view === 'poll' ? 'active' : ''}`} onClick={() => handleNav('poll')}>Feed</motion.span>
        <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${view === 'inbox' ? 'active' : ''}`} onClick={() => handleNav('inbox')}>Inbox</motion.span>
        <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${view === 'pro' ? 'active' : ''}`} onClick={() => handleNav('pro')}>👑 Pro</motion.span>
        <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${view === 'explore' ? 'active' : ''}`} onClick={() => handleNav('explore')}>Rank</motion.span>
        <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${view === 'profile' ? 'active' : ''}`} onClick={() => handleNav('profile')}>Profile</motion.span>
      </div>

      <AnimatePresence mode="wait">
        {view === 'poll' && (
          <motion.div key="poll" {...pageVariants} className="gas-poll-bg" style={{ background: '#7a8f9f', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <button style={{ flex: 1, padding: '10px', fontSize: '14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', background: gradeFilter !== 'all' ? '#ff6200' : '#fff', color: gradeFilter !== 'all' ? '#fff' : '#000' }} onClick={() => loadNextPoll(user.grade.toString())}>My Class</button>
              <button style={{ flex: 1, padding: '10px', fontSize: '14px', borderRadius: '8px', border: 'none', fontWeight: 'bold', background: gradeFilter === 'all' ? '#ff6200' : '#fff', color: gradeFilter === 'all' ? '#fff' : '#000' }} onClick={() => loadNextPoll('all')}>Whole School</button>
            </div>
            
            <motion.div key={currentPoll?.id || 'loading'} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {isLoadingPoll ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#fff' }}><h3>Loading next scenario... ⚡</h3></div>
              ) : hasVoted ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <h2 style={{ color: '#fff' }}>Vote Sent! 🚀</h2>
                  <button style={{ padding: '15px 30px', background: '#fff', border: 'none', borderRadius: '24px', fontWeight: 'bold', marginTop: '20px' }} onClick={() => loadNextPoll(gradeFilter)}>Next Question ➔</button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '32px', color: '#fff', fontWeight: 900, marginBottom: 'auto', textAlign: 'center' }}>"{currentPoll?.question || 'No more questions!'}"</div>
                  {options.length === 0 ? (
                    <p style={{ textAlign: 'center', margin: '20px 0', color: '#fff' }}>Not enough classmates in this filter!</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                      {options.map((opt) => (
                        <motion.button key={opt.id} whileTap={{ scale: 0.95 }} style={{ background: '#fff', color: '#000', fontWeight: '800', padding: '24px 10px', borderRadius: '16px', border: 'none', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} onClick={() => castVote(opt.id)}>
                          {renderProfilePic(opt.profile_pic, opt.avatar, opt.is_pro, opt.ring, 40)}
                          <div style={{ marginTop: '8px' }}>{opt.handle}</div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => loadNextPoll(gradeFilter)} style={{ background: 'transparent', color: '#fff', border: 'none', marginTop: '20px', width: '100%', cursor: 'pointer', padding: '15px', fontWeight: 'bold' }}>Skip Question</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {view === 'explore' && (
          <motion.div key="explore" {...pageVariants} style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fff' }}>
            <h2 style={{ marginTop: 0 }}>🏆 Leaderboard</h2>
            <input type="text" placeholder="Search handles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#f4f4f5', fontSize: '16px', boxSizing: 'border-box', marginBottom: '20px' }} />
            
            <div>
              {leaderboard.filter(u => u.handle.toLowerCase().includes(searchQuery.toLowerCase())).map((leader, index) => (
                <motion.div key={leader.id} onClick={() => loadPublicProfile(leader.id)} style={{ display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #e4e4e7', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 'bold', marginRight: '15px', width: '25px' }}>#{index + 1}</div>
                  {renderProfilePic(leader.profile_pic, leader.avatar, leader.is_pro, leader.ring, 40)}
                  <div style={{ flex: 1, marginLeft: '15px' }}>
                    <div style={{ fontWeight: 800, color: leader.is_pro ? '#fbbf24' : '#000' }}>@{leader.handle}</div>
                  </div>
                  <div style={{ color: '#ff6200', fontWeight: 'bold' }}>{leader.total_votes} 🔥</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'profile' && (
          <motion.div key="profile" {...pageVariants} style={{ flex: 1, overflowY: 'auto', padding: '20px', textAlign: 'center', background: '#fff' }}>
            <div style={{ margin: '20px 0' }}>
              {renderProfilePic(user.profile_pic, editAvatar || user.avatar, user.is_pro, editRing, 120)}
            </div>
            <h2 style={{ color: user.is_pro ? '#fbbf24' : '#000', margin: '10px 0' }}>@{user.handle}</h2>
            
            {isEditing ? (
              <div style={{ textAlign: 'left' }}>
                <input style={{ width: '60px', padding: '10px', fontSize: '20px', textAlign: 'center', marginBottom: '15px', borderRadius: '8px', border: '1px solid #e4e4e7' }} value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="Emoji" maxLength={2} />
                <textarea style={{ width: '100%', padding: '15px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #e4e4e7', marginBottom: '20px', fontFamily: 'inherit' }} value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Write a bio..." rows={3} />
                
                {user.is_pro && (
                  <div style={{ margin: '0 0 20px 0', padding: '15px', background: '#f4f4f5', borderRadius: '12px' }}>
                    <h4 style={{ margin: '0 0 15px 0' }}>Equip God Mode Aura</h4>
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {Object.keys(AURA_RINGS).filter(k => k !== 'none').map((ringKey) => (
                        <motion.div key={ringKey} whileTap={{ scale: 0.9 }} onClick={() => setEditRing(ringKey)}
                          style={{ width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', background: '#fff', border: editRing === ringKey ? '2px solid #000' : '2px solid transparent', ...AURA_RINGS[ringKey] }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <button style={{ width: '100%', padding: '15px', background: '#ff6200', color: '#fff', border: 'none', borderRadius: '24px', fontWeight: 'bold' }} onClick={saveProfile}>Save Profile</button>
              </div>
            ) : (
              <div>
                <p style={{ color: '#a1a1aa', margin: '0 0 15px 0' }}>{user.bio || 'Class 11 - St. Kabir'}</p>
                <p style={{ color: '#a1a1aa', marginBottom: '30px' }}>Total Votes Received: {user.total_votes || 0}</p>
                <button style={{ width: '100%', padding: '15px', background: '#f4f4f5', color: '#000', border: 'none', borderRadius: '24px', fontWeight: 'bold', marginBottom: '10px' }} onClick={() => setIsEditing(true)}>Edit Profile</button>
                <button style={{ width: '100%', padding: '15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '24px', fontWeight: 'bold' }} onClick={deleteAccount}>Delete Account</button>
              </div>
            )}
          </motion.div>
        )}

        {view === 'pro' && (
          <motion.div key="pro" {...pageVariants} style={{ flex: 1, overflowY: 'auto', padding: '20px', textAlign: 'center', background: '#fff' }}>
            <div style={{ background: '#111', color: '#fff', borderRadius: '24px', padding: '40px 20px', border: '2px solid #fbbf24', marginTop: '20px' }}>
              <h1 style={{ fontSize: '60px', margin: '0 0 20px' }}>👑</h1>
              <h2 style={{ color: '#fbbf24', margin: '0 0 20px' }}>{user.is_pro ? 'God Mode Active' : 'Unlock God Mode'}</h2>
              <p style={{ fontSize: '18px', marginBottom: '30px' }}>{user.is_pro ? 'You have access to all premium features.' : 'Reveal 2 Names Per Week & unlock exclusive Aura Rings.'}</p>
              
              {!user.is_pro && (
                <motion.button whileTap={{ scale: 0.95 }} style={{ width: '100%', padding: '15px', background: '#fbbf24', color: '#000', border: 'none', borderRadius: '24px', fontWeight: 'bold' }} onClick={() => handleUpgrade(99)}>
                  Upgrade Now - ₹99
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {view === 'inbox' && (
          <motion.div key="inbox" {...pageVariants} style={{ flex: 1, overflowY: 'auto', background: '#09090b', color: '#fff' }}>
            <div style={{ padding: '20px', textAlign: 'center', background: '#18181b', fontWeight: 'bold' }}>
              <h3 style={{ margin: 0, color: user.is_pro ? '#fbbf24' : '#fff' }}>{user.is_pro ? '👑 Names Revealed' : '🔒 Inbox'}</h3>
            </div>
            
            <div style={{ padding: '20px' }}>
              {inbox.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#a1a1aa' }}>Your inbox is empty.</p>
              ) : (
                inbox.map((vote, index) => (
                  <motion.div 
                    key={index} 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (!user.is_pro) {
                        setActiveRevealPopup({ id: vote.id, text: vote.question });
                      }
                    }}
                    style={{ background: '#27272a', borderLeft: '4px solid #ff6200', borderRadius: '16px', marginBottom: '15px', padding: '20px', cursor: user.is_pro ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <p style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>"{vote.question}"</p>
                      <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                        Voted by: {user.is_pro && vote.voterHandle ? <strong style={{ color: '#fbbf24' }}>{vote.voterAvatar} @{vote.voterHandle}</strong> : <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔒 Hidden</span>}
                      </p>
                    </div>
                    
                    {!user.is_pro && (
                      <div style={{ background: 'rgba(255, 98, 0, 0.2)', color: '#ff6200', padding: '8px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                        REVEAL ➔
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* --- REVEAL POPUP MODAL (Inside Authenticated Inbox) --- */}
            <AnimatePresence>
              {activeRevealPopup && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} 
                  onClick={() => setActiveRevealPopup(null)}
                >
                  <motion.div 
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    style={{ background: '#18181b', width: '100%', maxWidth: '400px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '30px 20px', borderTop: '1px solid #3f3f46' }} 
                    onClick={e => e.stopPropagation()} 
                  >
                    <div style={{ width: '40px', height: '4px', background: '#3f3f46', borderRadius: '2px', margin: '0 auto 20px auto' }}></div>
                    
                    <h3 style={{ fontSize: '22px', color: '#fff', textAlign: 'center', margin: '0 0 10px 0' }}>Unlock this name</h3>
                    <p style={{ color: '#a1a1aa', textAlign: 'center', fontSize: '15px', marginBottom: '30px', padding: '0 20px' }}>
                      "{activeRevealPopup.text}"
                    </p>

                    <button 
                      style={{ width: '100%', background: '#ff6200', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
                      onClick={handleWhatsAppInvite}
                    >
                      <span>🔥</span> Invite 3 Friends (Free)
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px', color: '#52525b', fontSize: '12px', fontWeight: 'bold' }}>
                      <hr style={{ flex: 1, borderColor: '#3f3f46' }} /> OR <hr style={{ flex: 1, borderColor: '#3f3f46' }} />
                    </div>

                    <button 
                      className="magic-btn"
                      style={{ width: '100%', background: 'transparent', color: '#fec195', border: '2px solid #fec195', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}
                      onClick={() => handleUpgrade(99)}
                    >
                      <span>⚡</span> Pay ₹99 / Week
                      <svg viewBox="0 0 24 24" className="star star-1" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
                      <svg viewBox="0 0 24 24" className="star star-2" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
                      <svg viewBox="0 0 24 24" className="star star-3" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
        
      </AnimatePresence>
    </div>
  );
}