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
      const orderRes = await fetch(`${API}/pay/order`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) });
      const orderData = await orderRes.json();
      const options = {
        key: RAZORPAY_KEY_ID, amount: orderData.amount, currency: 'INR', name: 'CampusFeed', description: 'Unlock God Mode', order_id: orderData.id,
        handler: async (response) => {
          const verifyRes = await fetch(`${API}/pay/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...response, userId: user.id }) });
          if ((await verifyRes.json()).success) { alert('👑 God Mode Unlocked!'); setUser({ ...user, is_pro: true, ring: 'gold' }); handleNav('inbox'); }
        }, theme: { color: '#fbbf24' }
      };
      new window.Razorpay(options).open();
    } catch (e) { alert('Checkout error.'); }
  };

 if (!user) {
    return (
      <div className="landing-wrapper">
        {/* HERO SECTION */}
        <div className="hero-fullscreen">
          <div style={{ position: 'absolute', top: '20px', left: '20px', fontWeight: 'bold', letterSpacing: '2px' }}>
            CAMPUSFEED®
          </div>
          
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'relative', width: '100%' }}>
            <h1 className="massive-text">CAMPUS</h1>
            <div className="script-overlap">stop guessing.</div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ marginTop: '40px', fontSize: '18px', color: '#a1a1aa', maxWidth: '400px' }}>
            The anonymous network designed exclusively for Class 11. Find out who really likes you.
          </motion.p>

          <motion.button 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            className="btn-primary" 
            style={{ width: 'auto', padding: '16px 40px', borderRadius: '4px', marginTop: '40px', background: '#fff', color: '#000' }}
            onClick={() => document.getElementById('login-portal').scrollIntoView({ behavior: 'smooth' })}
          >
            START A PROJECT ➔
          </motion.button>
        </div>

        {/* MARQUEE SECTION */}
        <div className="marquee-container">
          <motion.div 
            animate={{ x: [0, -1000] }} 
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            style={{ display: 'inline-block', fontSize: '24px', fontWeight: 'bold', color: '#fff' }}
          >
            [100% ANONYMOUS] • [GOD MODE ENABLED] • [INVITE ONLY] • [100% ANONYMOUS] • [GOD MODE ENABLED] • [INVITE ONLY] • 
          </motion.div>
        </div>

        {/* LIGHT THEME AGENCY FEATURES */}
        <div className="feature-section">
          <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-1px', margin: '0 0 20px 0' }}>What We Build</h2>
            <p style={{ fontSize: '20px', color: '#52525b', maxWidth: '600px' }}>Core disciplines. One clear goal: helping the student body communicate, grow, and stay memorable.</p>
          </div>

          <div className="feature-grid">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="feature-card">
              <h3 style={{ fontSize: '24px', margin: '0 0 15px 0' }}>[01 / The Vault]</h3>
              <p style={{ color: '#52525b', lineHeight: '1.6' }}>End-to-end encrypted polling. Vote on your classmates without leaving a digital footprint. Pure honesty.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="feature-card">
              <h3 style={{ fontSize: '24px', margin: '0 0 15px 0' }}>[02 / God Mode]</h3>
              <p style={{ color: '#52525b', lineHeight: '1.6' }}>Upgrade to see exactly who voted for you. Unlock premium aura rings and bypass the velvet rope.</p>
            </motion.div>
          </div>
        </div>

        {/* LOGIN PORTAL */}
        <div id="login-portal" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: '#09090b' }}>
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
              <button className="btn-primary" onClick={login} style={{ marginTop: '10px', borderRadius: '4px' }}>
                {isAuthenticating ? 'Authenticating...' : 'Connect ➔'}
              </button>
            </div>

            {/* Legal Footer for Razorpay */}
            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
              <p>By entering, you agree to our <br/>
                <span onClick={() => setLegalView('terms')} style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>Terms & Conditions</span> and <span onClick={() => setLegalView('privacy')} style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Modals */}
        <AnimatePresence>
          {legalView && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setLegalView(null)}>
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 style={{ color: 'var(--accent-primary)', marginTop: 0 }}>{legalView === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}</h2>
                <p>Standard Razorpay compliance text goes here.</p>
                <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setLegalView(null)}>Close</button>
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
            <button className="btn-primary" style={{ flex: 1, background: gradeFilter !== 'all' ? 'var(--accent-primary)' : 'var(--bg-surface-hover)' }} onClick={() => loadNextPoll(user.grade.toString())}>My Class</button>
            <button className="btn-primary" style={{ flex: 1, background: gradeFilter === 'all' ? 'var(--accent-primary)' : 'var(--bg-surface-hover)' }} onClick={() => loadNextPoll('all')}>Whole School</button>
          </div>
          <motion.div key={currentPoll?.id || 'loading'} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="card">
            {isLoadingPoll ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}><h3>Loading next scenario... ⚡</h3></div>
            ) : hasVoted ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <h2 style={{ color: '#10b981' }}>Vote Sent! 🚀</h2>
                <button className="btn-primary" onClick={() => loadNextPoll(gradeFilter)} style={{ marginTop: '20px' }}>Next Question ➔</button>
              </div>
            ) : (
              <>
                <div className="poll-question">"{currentPoll?.question || 'No more questions!'}"</div>
                {options.length === 0 ? (
                  <p style={{ color: '#ef4444', textAlign: 'center', margin: '20px 0' }}>Not enough classmates in this filter!</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {options.map((opt) => (
                      <motion.button key={opt.id} whileHover={{ scale: 1.05, backgroundColor: 'var(--accent-primary)', color: '#fff' }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} className="btn-option" onClick={() => castVote(opt.id)}>
                        {renderProfilePic(opt.profile_pic, opt.avatar, opt.is_pro, opt.ring, 30)}
                        <span style={{ marginLeft: '8px' }}>{opt.handle}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
                <button onClick={() => loadNextPoll(gradeFilter)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', marginTop: '20px', width: '100%', cursor: 'pointer' }}>Skip Question</button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      {view === 'explore' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2>🏆 Leaderboard</h2>
          <input className="input-field" placeholder="Search handles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="card">
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
          <h2 style={{ color: 'var(--accent-pro)' }}>{user.is_pro ? 'God Mode Active' : 'Unlock God Mode'}</h2>
          {!user.is_pro && <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" style={{ background: 'var(--accent-pro)', color: '#000', marginTop: '20px' }} onClick={handleUpgrade}>Upgrade Now - ₹99</motion.button>}
        </motion.div>
      )}

      {view === 'inbox' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: user.is_pro ? 'var(--accent-pro)' : '#fff' }}>{user.is_pro ? '👑 Names Revealed' : '🔒 Names Hidden'}</h3>
          </div>
          {inbox.map((vote, index) => (
            <motion.div key={index} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="card" style={{ marginBottom: '10px', padding: '15px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '18px' }}>"{vote.question}"</p>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Voted by: {vote.voterHandle ? <strong style={{ color: 'var(--accent-pro)' }}>{vote.voterAvatar} @{vote.voterHandle}</strong> : <span style={{ color: '#ef4444' }}>🔒 Hidden</span>}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}