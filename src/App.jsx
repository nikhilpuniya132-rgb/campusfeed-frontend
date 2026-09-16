import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import bgVideo from './assets/campus_promo.mp4'; // Add this line!

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
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('11');
  const [avatar, setAvatar] = useState('😎');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [activeRevealPopup, setActiveRevealPopup] = useState(null); // Stores the notification the user clicked

  const [view, setView] = useState('poll');
  const [gradeFilter, setGradeFilter] = useState('11');
  const [searchQuery, setSearchQuery] = useState('');
  const [legalView, setLegalView] = useState(null); 

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

  useEffect(() => {
    if (!document.getElementById('razorpay-sdk')) {
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
    }
  }, []);

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

  const handleUpgrade = async () => {
    try {
      // 1. Backend creates order
      const orderRes = await fetch(`${API}/pay/order`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ userId: user.id, amount: 9900 }) 
      });
      const orderData = await orderRes.json();
      
      if (!orderRes.ok) throw new Error(orderData.error);

      // 2. Open standard web checkout securely
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Strict environment variable
        amount: orderData.amount, 
        currency: orderData.currency, 
        name: 'CampusFeed', 
        description: 'Unlock God Mode', 
        order_id: orderData.id,
        // ... rest of the handler remains the same
        handler: async (response) => {
          // 3. Verify on backend
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
        theme: { color: '#fbbf24' }
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

 if (!user) {
    return (
      <div className="gas-app-container" style={{ background: '#09090b', overflowY: 'auto', position: 'relative' }}>
        
        {/* BACKGROUND VIDEO ENGINE */}
        <div className="gas-video-wrapper">
          <video className="gas-video-bg" autoPlay loop muted playsInline>
            <source src={bgVideo} type="video/mp4" />
          </video>
          <div className="gas-video-overlay"></div>
        </div>

        {/* LANDING PAGE CONTENT (Scrolls over the video) */}
        <div className="gas-landing-content">
          <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
            
            <div style={{ position: 'absolute', top: '20px', left: '20px', fontWeight: 'bold', letterSpacing: '2px', color: '#fff' }}>
              CAMPUSFEED®
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

          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', padding: '20px 0', background: '#ff6200' }}>
            <motion.div animate={{ x: [0, -1000] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} style={{ display: 'inline-block', fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              [100% ANONYMOUS] • [GOD MODE ENABLED] • [ST KABIR ONLY] • [100% ANONYMOUS] • [GOD MODE ENABLED] • [ST KABIR ONLY] • 
            </motion.div>
          </div>

          {/* LOGIN PORTAL WITH GALAXY STARS & NEO-BRUTALIST GOOGLE AUTH */}
          <div id="login-portal" className="stars-container" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
            
            {/* Animated Stars Background Layers */}
            <div className="stars-layer-1" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }} />
            <div className="stars-layer-2" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }} />
            <div className="stars-layer-3" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }} />

            <div style={{ width: '100%', maxWidth: '350px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              <div className="form">
                <p>
                  Join the Loop.
                  <span>Select your class to continue</span>
                </p>
                
                <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="11">Class 11 (St. Kabir)</option>
                  <option value="12">Class 12 (St. Kabir)</option>
                </select>

                <button 
                  className="oauthButton"
                  onClick={() => alert("Google Auth Triggered")}
                >
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
        </div>

        {/* Legal View Modal */}
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
                <motion.button whileTap={{ scale: 0.95 }} style={{ width: '100%', padding: '15px', background: '#fbbf24', color: '#000', border: 'none', borderRadius: '24px', fontWeight: 'bold' }} onClick={handleUpgrade}>
                  Upgrade Now - ₹99
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {view === 'inbox' && (
          <motion.div key="inbox" {...pageVariants} style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
            <div style={{ padding: '20px', textAlign: 'center', background: '#f4f4f5', fontWeight: 'bold' }}>
              <h3 style={{ margin: 0, color: user.is_pro ? '#fbbf24' : '#000' }}>{user.is_pro ? '👑 Names Revealed' : '🔒 Names Hidden'}</h3>
            </div>
            
            <div style={{ padding: '20px' }}>
              {inbox.map((vote, index) => (
                <motion.div key={index} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: '16px', marginBottom: '15px', padding: '20px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold' }}>"{vote.question}"</p>
                  <p style={{ margin: 0, color: '#a1a1aa' }}>
                    Voted by: {vote.voterHandle ? <strong style={{ color: '#fbbf24' }}>{vote.voterAvatar} @{vote.voterHandle}</strong> : <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔒 Hidden</span>}
                  </p>
                </motion.div>
              ))}
              {inbox.length === 0 && <p style={{ textAlign: 'center', color: '#a1a1aa' }}>Your inbox is empty.</p>}
            </div>
          </motion.div>
        )}
        
      </AnimatePresence>
    </div>
  );
}
{/* --- INBOX TAB CONTENT --- */}
        <div style={{ padding: '20px', color: '#fff', paddingBottom: '100px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>Inbox</h2>
          
          {/* Example Notification Item */}
          <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveRevealPopup({ id: 1, text: "Someone thinks you have the best smile in Class 11." })}
            style={{ background: '#27272a', padding: '20px', borderRadius: '16px', marginBottom: '15px', borderLeft: '4px solid #ff6200', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '5px' }}>Just now</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>Someone thinks you have the best smile in Class 11.</div>
            </div>
            <div style={{ background: 'rgba(255, 98, 0, 0.2)', color: '#ff6200', padding: '8px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
              REVEAL ➔
            </div>
          </motion.div>
        </div>

        {/* --- REVEAL POPUP MODAL --- */}
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
                onClick={e => e.stopPropagation()} // Prevents closing when clicking inside the box
              >
                <div style={{ width: '40px', height: '4px', background: '#3f3f46', borderRadius: '2px', margin: '0 auto 20px auto' }}></div>
                
                <h3 style={{ fontSize: '22px', color: '#fff', textAlign: 'center', margin: '0 0 10px 0' }}>Unlock this name</h3>
                <p style={{ color: '#a1a1aa', textAlign: 'center', fontSize: '15px', marginBottom: '30px', padding: '0 20px' }}>
                  "{activeRevealPopup.text}"
                </p>

                {/* OPTION 1: The Viral Loop (Free) */}
                <button 
                  style={{ width: '100%', background: '#ff6200', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
                  onClick={handleWhatsAppInvite}
                >
                  <span>🔥</span> Invite 3 Friends (Free)
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px', color: '#52525b', fontSize: '12px', fontWeight: 'bold' }}>
                  <hr style={{ flex: 1, borderColor: '#3f3f46' }} /> OR <hr style={{ flex: 1, borderColor: '#3f3f46' }} />
                </div>

                {/* OPTION 2: The Monetization Loop (Paid) */}
                <button 
                  className="magic-btn"
                  style={{ width: '100%', background: 'transparent', color: '#fec195', border: '2px solid #fec195', padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}
                  onClick={handleUpgrade}
                >
                  <span>⚡</span> Pay ₹99 / Week
                  {/* Kept your magic star SVGs in here for the premium hover effect */}
                  <svg viewBox="0 0 24 24" className="star star-1" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
                  <svg viewBox="0 0 24 24" className="star star-2" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
                  <svg viewBox="0 0 24 24" className="star star-3" xmlns="http://www.w3.org/2000/svg"><path d="M12 0l2.8 9.2L24 12l-9.2 2.8L12 24l-2.8-9.2L0 12l9.2-2.8z"/></svg>
                </button>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>