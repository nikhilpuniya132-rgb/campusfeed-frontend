import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://campusfeed-backend-po4g.onrender.com/api';
const RAZORPAY_KEY_ID = 'rzp_test_YOUR_ACTUAL_TEST_KEY_ID'; 

const AURA_RINGS = {
  none: { border: 'none', boxShadow: 'none' },
  gold: { border: '4px solid var(--accent-pro)', boxShadow: '0 0 15px rgba(251, 191, 36, 0.5)' },
  neonPurple: { border: '4px solid #d946ef', boxShadow: '0 0 20px #d946ef, inset 0 0 10px #d946ef' },
  blueEnergy: { border: '4px dashed #3b82f6', boxShadow: '0 0 15px rgba(59, 130, 246, 0.8)' },
  crimsonFire: { border: '4px double #ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.8)' }
};

export default function App() {
  const [inviteCode, setInviteCode] = useState('');
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('11');
  const [avatar, setAvatar] = useState('😎');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [view, setView] = useState('poll');
  const [gradeFilter, setGradeFilter] = useState('11');
  const [searchQuery, setSearchQuery] = useState('');
  const [legalView, setLegalView] = useState(null); 

  const [currentPoll, setCurrentPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [isLoadingPoll, setIsLoadingPoll] = useState(false); 
  const [voteCount, setVoteCount] = useState(0);
  
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
          <div style={{ fontSize: `${size * 0.6}px`, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--bg-surface-hover)', ...activeAura }}>
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
      const res = await fetch(`${API}/auth`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ handle, password, grade, avatar, inviteCode }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (!data.user) throw new Error('Database returned an empty user profile.');
      
      setUser(data.user);
      const userGrade = data.user?.grade?.toString() || grade; 
      setGradeFilter(userGrade);
      loadNextPoll(userGrade, data.user.id);
    } catch (err) { alert(err.message); }
    setIsAuthenticating(false);
  };

  const loadNextPoll = async (targetGrade, explicitId = null) => {
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
      setProfileData(d); setEditBio(d.user.bio || ''); setEditAvatar(d.user.avatar || ''); setEditRing(d.user.ring || 'gold');
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
      const orderRes = await fetch(`${API}/pay/order`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) });
      const orderData = await orderRes.json();
      const options = {
        key: RAZORPAY_KEY_ID, amount: orderData.amount, currency: 'INR', name: 'CampusFeed', description: 'Unlock The 1% Club', order_id: orderData.id,
        handler: async (response) => {
          const verifyRes = await fetch(`${API}/pay/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...response, userId: user.id }) });
          if ((await verifyRes.json()).success) { alert('👑 1% Club Unlocked!'); setUser({ ...user, is_pro: true, ring: 'gold' }); handleNav('inbox'); }
        }, theme: { color: '#fbbf24' }
      };
      new window.Razorpay(options).open();
    } catch (e) { alert('Checkout error.'); }
  };

  if (!user) {
    return (
      <div className="landing-wrapper">
        <div className="hero-fullscreen">
          <div style={{ position: 'absolute', opacity: 0.03, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120vw', height: '120vw', maxWidth: '800px', maxHeight: '800px', backgroundImage: 'url(/favicon.svg)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', zIndex: 0, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '20px', left: '20px', fontWeight: 'bold', letterSpacing: '2px', zIndex: 5 }}>CAMPUSFEED®</div>
          
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'relative', width: '100%', zIndex: 5 }}>
            <h1 className="massive-text">CAMPUS</h1>
            <div className="script-overlap">stop guessing.</div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ marginTop: '40px', fontSize: '18px', color: '#a1a1aa', maxWidth: '400px', zIndex: 5 }}>
            The anonymous network designed exclusively for Class 11. Find out who really likes you.
          </motion.p>

          <motion.button 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            className="btn-primary" 
            style={{ width: 'auto', padding: '16px 40px', borderRadius: '4px', marginTop: '40px', background: '#fff', color: '#000', zIndex: 5 }}
            onClick={() => document.getElementById('login-portal').scrollIntoView({ behavior: 'smooth' })}
          >
            START A PROJECT ➔
          </motion.button>
        </div>

        <div className="marquee-container">
          <motion.div animate={{ x: [0, -1500] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} style={{ display: 'inline-block', fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
            [100% ANONYMOUS] • [THE 1% CLUB ENABLED] • [ST. KABIR EXCLUSIVE] • [FIND OUT WHO LIKES YOU] • [NO DIGITAL FOOTPRINT] • [INVITE ONLY] • [100% ANONYMOUS] • [THE 1% CLUB ENABLED] • [ST. KABIR EXCLUSIVE] • [FIND OUT WHO LIKES YOU] •
          </motion.div>
        </div>

        <div className="feature-section">
          <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-1px', margin: '0 0 20px 0' }}>What We Build</h2>
            <p style={{ fontSize: '20px', color: '#52525b', maxWidth: '600px' }}>Core disciplines. One clear goal: helping the student body communicate, grow, and stay memorable.</p>
          </div>

          <div className="feature-grid">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="feature-card">
              <h3 style={{ fontSize: '24px', margin: '0 0 15px 0' }}>[01 / The Vault]</h3>
              <p style={{ color: '#52525b', lineHeight: '1.6' }}>End-to-end encrypted polling. Vote on your classmates without leaving a digital footprint. Pure honesty, safely secured behind our velvet rope.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="feature-card">
              <h3 style={{ fontSize: '24px', margin: '0 0 15px 0' }}>[02 / The 1% Club]</h3>
              <p style={{ color: '#52525b', lineHeight: '1.6' }}>Stop wondering. Upgrade your account to see exactly who voted for you. Unlock premium aura rings, priority leaderboard status, and bypass the velvet rope entirely.</p>
            </motion.div>
          </div>
        </div>

        <div className="pricing-section">
          <h2 style={{ fontSize: '42px', textAlign: 'center', fontWeight: '900', margin: '0 0 10px 0' }}>Choose Your Status</h2>
          <p style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '18px' }}>Join the network or run the network.</p>
          
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>Ghost Tier</h3>
              <h1 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>₹0</h1>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', color: '#a1a1aa', lineHeight: '2' }}>
                <li>✓ 100% Anonymous Voting</li>
                <li>✓ Basic Profile Avatar</li>
                <li>✓ Participate in Class Polls</li>
                <li style={{ opacity: 0.3 }}>✗ See Who Voted For You</li>
              </ul>
              <button className="btn-primary" style={{ marginTop: 'auto', background: '#27272a', color: '#fff' }} onClick={() => document.getElementById('login-portal').scrollIntoView({ behavior: 'smooth' })}>Get Started for Free</button>
            </div>

            <div className="pricing-card premium">
              <div style={{ position: 'absolute', top: 0, right: 0, background: '#fbbf24', color: '#000', padding: '6px 15px', fontWeight: 'bold', borderBottomLeftRadius: '16px' }}>MOST EXCLUSIVE</div>
              <h3 style={{ fontSize: '24px', margin: '0 0 10px 0', color: '#fbbf24' }}>The 1% Club 👑</h3>
              <h1 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>₹99<span style={{ fontSize: '16px', color: '#a1a1aa', fontWeight: 'normal' }}>/mo</span></h1>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', color: '#fafafa', lineHeight: '2' }}>
                <li><strong>✓ Name Reveal Technology</strong></li>
                <li><strong>✓ God Mode Aura Rings</strong></li>
                <li>✓ VIP Profile Badge</li>
                <li>✓ Leaderboard Priority</li>
              </ul>
              <button className="btn-primary" style={{ marginTop: 'auto', background: '#fbbf24', color: '#000' }} onClick={() => document.getElementById('login-portal').scrollIntoView({ behavior: 'smooth' })}>Unlock the Velvet Rope</button>
            </div>
          </div>
        </div>

        <div className="founder-section">
          <img src="https://placehold.co/400x400/18181b/8b5cf6/png?text=NP" alt="Nikhil Puniya" className="founder-img" />
          <h2 style={{ fontSize: '32px', margin: '0 0 5px 0' }}>Nikhil Puniya</h2>
          <p style={{ fontSize: '18px', color: '#52525b', fontWeight: 'bold', margin: '0 0 15px 0' }}>Founder & CEO • Class 11</p>
          <p style={{ maxWidth: '600px', margin: '0 auto', color: '#3f3f46', lineHeight: '1.6' }}>
            "I built CampusFeed because I was tired of guessing. We created a secure, anonymous space for our school to connect, vote, and actually know where they stand."
          </p>
        </div>

        {/* LOGIN PORTAL */}
        <div id="login-portal" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#09090b' }}>
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '32px', textAlign: 'center', marginBottom: '30px' }}>Enter Network.</h2>
            <div className="card" style={{ background: '#18181b', border: '1px solid #27272a' }}>
              <input className="input-field" placeholder="@handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
              <input className="input-field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <select className="input-field" value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
              
              <div style={{ position: 'relative', marginTop: '5px', marginBottom: '15px' }}>
                <input 
                  className="input-field" 
                  placeholder="Invite Code (Optional)" 
                  value={inviteCode} 
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())} 
                  style={{ marginBottom: 0, border: '1px dashed #52525b', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '2px' }} 
                />
                <span style={{ position: 'absolute', right: '12px', top: '12px', fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                  +50 COINS
                </span>
              </div>

              <button className="btn-primary" onClick={login} style={{ marginTop: '10px', borderRadius: '4px' }}>
                {isAuthenticating ? 'Authenticating...' : 'Connect ➔'}
              </button>
            </div>
          </div>
        </div>

        <div className="contact-section">
          <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>Got questions? Reach out.</p>
          <a href="https://instagram.com/campusfeedst.kabiraale" target="_blank" rel="noreferrer" style={{ fontSize: '20px', color: '#8b5cf6', textDecoration: 'none', fontWeight: 'bold', display: 'block', marginBottom: '40px' }}>
            @campusfeedst.kabiraale
          </a>
          <div style={{ fontSize: '13px', color: '#a1a1aa' }}>
            <p>By entering, you agree to our <br/><span onClick={() => setLegalView('terms')} style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>Terms & Conditions</span> and <span onClick={() => setLegalView('privacy')} style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.</p>
          </div>
        </div>

        <AnimatePresence>
          {legalView && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setLegalView(null)}>
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 style={{ color: '#8b5cf6', marginTop: 0 }}>{legalView === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}</h2>
                <p>Standard Razorpay compliance text goes here.</p>
                <button className="btn-primary" style={{ marginTop: '20px', background: '#27272a' }} onClick={() => setLegalView(null)}>Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="nav-bar">
        <button className={`nav-btn ${view === 'poll' ? 'active' : ''}`} onClick={() => handleNav('poll')}>🎮</button>
        <button className={`nav-btn ${view === 'inbox' ? 'active' : ''}`} onClick={() => handleNav('inbox')}>🔔</button>
        <button className={`nav-btn ${view === 'pro' ? 'active' : ''}`} onClick={() => handleNav('pro')}>👑</button>
        <button className={`nav-btn ${view === 'profile' ? 'active' : ''}`} onClick={() => handleNav('profile')}>👤</button>
        <button className={`nav-btn ${view === 'explore' ? 'active' : ''}`} onClick={() => handleNav('explore')}>🌍</button>
      </div>

      {view === 'poll' && (
        <div className="gas-poll-container">
          {voteCount >= 12 ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="cooldown-screen">
              <h1 style={{ fontSize: '72px', margin: '0 0 20px 0' }}>🔒</h1>
              <h2 style={{ color: '#fff', fontSize: '32px', marginBottom: '10px' }}>Play Again</h2>
              <p style={{ color: 'var(--accent-primary)', fontSize: '24px', fontWeight: 'bold', margin: '0 0 30px 0' }}>New Polls in 29:47</p>
              <div style={{ color: '#52525b', marginBottom: '30px' }}>--------- OR ---------</div>
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                className="btn-primary" 
                style={{ background: '#10b981', color: '#000' }}
                onClick={() => alert('WhatsApp Invite triggered!')}
              >
                Skip the wait ➔ Invite a friend
              </motion.button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {isLoadingPoll ? (
                <motion.div key="loading" exit={{ opacity: 0 }} style={{ textAlign: 'center', marginTop: '100px' }}>
                  <h3 style={{ color: 'var(--text-muted)' }}>Loading network...</h3>
                </motion.div>
              ) : (
                <motion.div 
                  key={currentPoll?.id || 'empty'}
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="gas-card"
                >
                  <div>
                    <div className="gas-emoji">{currentPoll?.emoji || '🔥'}</div>
                    <div className="gas-question">"{currentPoll?.question || 'Who is most likely to win a Nobel Prize?'}"</div>
                  </div>

                  <div className="gas-grid">
                    {options.length > 0 ? options.map((opt) => (
                      <motion.button 
                        key={opt.id} 
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                        whileTap={{ scale: 0.9, backgroundColor: 'var(--accent-primary)' }} 
                        className="gas-option-btn" 
                        onClick={() => {
                          setVoteCount(prev => prev + 1);
                          castVote(opt.id);
                          if (voteCount === 11) {
                            confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 }, colors: ['#fbbf24', '#f59e0b'] });
                          } else {
                            loadNextPoll(gradeFilter);
                          }
                        }}
                      >
                        {opt.handle}
                      </motion.button>
                    )) : (
                      <p style={{ color: '#fff', gridColumn: 'span 2' }}>Not enough users in filter.</p>
                    )}
                  </div>

                  <div className="gas-footer">
                    <span onClick={() => loadNextPoll(gradeFilter)} style={{ cursor: 'pointer' }}>🔀 Shuffle</span>
                    <span onClick={() => loadNextPoll(gradeFilter)} style={{ cursor: 'pointer' }}>⏭ Skip</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      )}

      {view === 'explore' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
          <h2>🏆 Leaderboard</h2>
          <input className="input-field" placeholder="Search handles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="card" style={{ margin: 0 }}>
            {leaderboard.filter(u => u.handle.toLowerCase().includes(searchQuery.toLowerCase())).map((leader, index) => (
              <motion.div key={leader.id} variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring" } } }} onClick={() => loadPublicProfile(leader.id)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--bg-surface-hover)', cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  #{index + 1} {renderProfilePic(leader.profile_pic, leader.avatar, leader.is_pro, leader.ring, 32)}
                  <span style={{ color: leader.is_pro ? 'var(--accent-pro)' : '#fff' }}>@{leader.handle}</span>
                </span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{leader.total_votes}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}

      {view === 'publicProfile' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ textAlign: 'center' }}>
          {publicProfile ? (
            <>
              {renderProfilePic(publicProfile.profile_pic, publicProfile.avatar, publicProfile.is_pro, publicProfile.ring, 120)}
              <h2 style={{ color: publicProfile.is_pro ? 'var(--accent-pro)' : '#fff', margin: '10px 0' }}>@{publicProfile.handle}</h2>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 15px 0' }}>{publicProfile.bio || 'No bio yet.'}</p>
              <p style={{ color: 'var(--accent-primary)', fontWeight: 'bold', marginBottom: '20px' }}>Total Votes: {publicProfile.total_votes}</p>
              <button className="btn-primary" onClick={() => alert('Anonymous Ping Sent! 🔔')} style={{ marginBottom: '10px' }}>Send Anonymous Ping</button>
              <button className="btn-primary" onClick={() => handleNav('explore')} style={{ background: 'var(--bg-surface-hover)' }}>Back to Leaderboard</button>
            </>
          ) : <p style={{ color: 'var(--text-muted)' }}>Loading profile...</p>}
        </motion.div>
      )}

      {view === 'profile' && profileData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ textAlign: 'center' }}>
          {renderProfilePic(profileData.user.profile_pic, editAvatar || profileData.user.avatar, profileData.user.is_pro, editRing, 120)}
          <h2 style={{ color: profileData.user.is_pro ? 'var(--accent-pro)' : '#fff', margin: '10px 0' }}>@{profileData.user.handle}</h2>
          
          {isEditing ? (
            <div>
              <input className="input-field" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="Avatar Emoji" maxLength={2} style={{ width: '60px', display: 'inline-block', marginBottom: '10px' }} />
              <textarea className="input-field" value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Write a bio..." rows={3} />
              
              {user.is_pro && (
                <div style={{ margin: '20px 0', padding: '15px', background: 'var(--bg-surface-hover)', borderRadius: '12px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)' }}>Equip God Mode Aura</h4>
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {Object.keys(AURA_RINGS).filter(k => k !== 'none').map((ringKey) => (
                      <motion.div 
                        key={ringKey}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditRing(ringKey)}
                        style={{ 
                          width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer',
                          background: 'var(--bg-base)',
                          border: editRing === ringKey ? '2px solid #fff' : '2px solid transparent',
                          ...AURA_RINGS[ringKey]
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <button className="btn-primary" onClick={saveProfile}>Save Profile</button>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-muted)', margin: '0 0 15px 0' }}>{profileData.user.bio || 'No bio yet.'}</p>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Total Votes Received: {profileData.user.total_votes}</p>
              <button className="btn-primary" onClick={() => setIsEditing(true)} style={{ background: 'var(--bg-surface-hover)' }}>Edit Profile</button>
              <button className="btn-primary" onClick={deleteAccount} style={{ background: '#ef4444', marginTop: '10px' }}>Delete Account</button>
            </div>
          )}
        </motion.div>
      )}

      {view === 'pro' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ textAlign: 'center', background: 'linear-gradient(145deg, #1f1f22, #2a2015)', border: '1px solid var(--accent-pro)' }}>
          <h1 style={{ fontSize: '40px', margin: '0' }}>👑</h1>
          <h2 style={{ color: 'var(--accent-pro)' }}>{user.is_pro ? 'The 1% Club Active' : 'Unlock The 1% Club'}</h2>
          {!user.is_pro && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" style={{ background: 'var(--accent-pro)', color: '#000', marginTop: '20px' }} onClick={handleUpgrade}>Upgrade Now - ₹99</motion.button>}
        </motion.div>
      )}

      {view === 'inbox' && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: '20px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Activity</h2>
          {['girl', 'boy', 'girl'].map((senderGender, index) => (
            <motion.div 
              key={index} 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="card" 
              style={{ display: 'flex', alignItems: 'center', padding: '20px', marginBottom: '10px', cursor: 'pointer', background: 'var(--bg-surface-hover)', margin: '0 0 10px 0' }}
              onClick={() => handleNav('pro')}
            >
              <div style={{ fontSize: '32px', marginRight: '20px', filter: senderGender === 'girl' ? 'hue-rotate(-50deg)' : 'hue-rotate(180deg)' }}>🔥</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>From a {senderGender} in Class 11</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>{index + 1}h ago</p>
              </div>
            </motion.div>
          ))}
          <button className="btn-primary" style={{ width: '100%', marginTop: '20px', background: '#27272a', padding: '16px' }} onClick={() => handleNav('pro')}>
            🔒 See who likes you
          </button>
        </motion.div>
      )}
    </div>
  );
}