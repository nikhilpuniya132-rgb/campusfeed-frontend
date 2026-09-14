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

const pageVariants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { type: "tween", duration: 0.25 } };

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
      <div className="gas-app-container">
        <div className="gas-ob-screen">
          <div className="gas-ob-content">
            <h1 style={{ fontSize: '48px', color: '#fff', marginBottom: '40px' }}>CampusFeed</h1>
            
            <div style={{ background: '#18181b', padding: '20px', borderRadius: '16px', width: '90%', maxWidth: '350px' }}>
              <input className="gas-ob-input" style={{ width: '100%', fontSize: '20px', marginBottom: '20px' }} placeholder="@handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
              <input className="gas-ob-input" style={{ width: '100%', fontSize: '20px', marginBottom: '20px' }} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              
              <select className="gas-ob-input" style={{ width: '100%', fontSize: '20px', marginBottom: '20px', appearance: 'none' }} value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
              
              <button className="gas-ob-white-btn" style={{ width: '100%' }} onClick={login}>
                {isAuthenticating ? 'Connecting...' : 'Connect ➔'}
              </button>
            </div>
            
            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '13px', color: '#a1a1aa' }}>
              <p>By entering, you agree to our <br/>
                <span onClick={() => setLegalView('terms')} style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>Terms & Conditions</span>
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {legalView && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="gas-shop-overlay" onClick={() => setLegalView(null)}>
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="gas-shop-modal" onClick={e => e.stopPropagation()}>
                <h2 style={{ color: '#ff6200', marginTop: 0 }}>{legalView === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}</h2>
                <p>Standard Razorpay compliance text goes here.</p>
                <button className="gas-ob-white-btn" style={{ marginTop: 'auto' }} onClick={() => setLegalView(null)}>Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="gas-app-container">
      {/* Top Navigation */}
      <div className="gas-top-nav">
        <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${view === 'poll' ? 'active' : ''}`} onClick={() => handleNav('poll')}>Feed</motion.span>
        <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${view === 'inbox' ? 'active' : ''}`} onClick={() => handleNav('inbox')}>Inbox</motion.span>
        <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${view === 'pro' ? 'active' : ''}`} onClick={() => handleNav('pro')}>👑 Pro</motion.span>
        <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${view === 'explore' ? 'active' : ''}`} onClick={() => handleNav('explore')}>Rank</motion.span>
        <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${view === 'profile' ? 'active' : ''}`} onClick={() => handleNav('profile')}>Profile</motion.span>
      </div>

      <AnimatePresence mode="wait">
        
        {view === 'poll' && (
          <motion.div key="poll" {...pageVariants} className="gas-poll-bg">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <button className="gas-ob-white-btn" style={{ flex: 1, padding: '10px', fontSize: '14px', background: gradeFilter !== 'all' ? '#ff6200' : '#fff', color: gradeFilter !== 'all' ? '#fff' : '#000' }} onClick={() => loadNextPoll(user.grade.toString())}>My Class</button>
              <button className="gas-ob-white-btn" style={{ flex: 1, padding: '10px', fontSize: '14px', background: gradeFilter === 'all' ? '#ff6200' : '#fff', color: gradeFilter === 'all' ? '#fff' : '#000' }} onClick={() => loadNextPoll('all')}>Whole School</button>
            </div>
            
            <motion.div key={currentPoll?.id || 'loading'} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {isLoadingPoll ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}><h3>Loading next scenario... ⚡</h3></div>
              ) : hasVoted ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <h2 style={{ color: '#fff' }}>Vote Sent! 🚀</h2>
                  <button className="gas-ob-white-btn" onClick={() => loadNextPoll(gradeFilter)} style={{ marginTop: '20px' }}>Next Question ➔</button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '26px', fontWeight: 900, marginBottom: 'auto' }}>"{currentPoll?.question || 'No more questions!'}"</div>
                  {options.length === 0 ? (
                    <p style={{ textAlign: 'center', margin: '20px 0' }}>Not enough classmates in this filter!</p>
                  ) : (
                    <div className="gas-poll-grid">
                      {options.map((opt) => (
                        <motion.button key={opt.id} whileTap={{ scale: 0.95 }} className="gas-poll-btn" onClick={() => castVote(opt.id)}>
                          {renderProfilePic(opt.profile_pic, opt.avatar, opt.is_pro, opt.ring, 40)}
                          <div style={{ marginTop: '8px' }}>{opt.handle}</div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => loadNextPoll(gradeFilter)} style={{ background: 'transparent', color: '#fff', border: 'none', marginTop: '20px', width: '100%', cursor: 'pointer', padding: '15px' }}>Skip Question</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {view === 'explore' && (
          <motion.div key="explore" {...pageVariants} className="gas-scroll-area" style={{ padding: '20px' }}>
            <h2 style={{ marginTop: 0 }}>🏆 Leaderboard</h2>
            <input type="text" placeholder="Search handles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#f4f4f5', fontSize: '16px', boxSizing: 'border-box', marginBottom: '20px' }} />
            
            <div>
              {leaderboard.filter(u => u.handle.toLowerCase().includes(searchQuery.toLowerCase())).map((leader, index) => (
                <motion.div key={leader.id} onClick={() => loadPublicProfile(leader.id)} className="gas-add-row" style={{ padding: '15px 0' }}>
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

        {view === 'publicProfile' && (
          <motion.div key="publicProfile" {...pageVariants} className="gas-scroll-area" style={{ padding: '20px', textAlign: 'center' }}>
            {publicProfile ? (
              <>
                <div style={{ margin: '20px 0' }}>
                  {renderProfilePic(publicProfile.profile_pic, publicProfile.avatar, publicProfile.is_pro, publicProfile.ring, 120)}
                </div>
                <h2 style={{ color: publicProfile.is_pro ? '#fbbf24' : '#000', margin: '10px 0' }}>@{publicProfile.handle}</h2>
                <p style={{ color: '#a1a1aa', margin: '0 0 15px 0' }}>{publicProfile.bio || 'No bio yet.'}</p>
                <p style={{ color: '#ff6200', fontWeight: 'bold', marginBottom: '30px' }}>Total Votes: {publicProfile.total_votes}</p>
                
                <button className="gas-ob-white-btn" style={{ background: '#000', color: '#fff', width: '100%' }} onClick={() => alert('Anonymous Ping Sent! 🔔')}>Send Anonymous Ping</button>
                <button className="gas-ob-white-btn" style={{ background: '#f4f4f5', color: '#000', width: '100%' }} onClick={() => handleNav('explore')}>Back to Leaderboard</button>
              </>
            ) : <p style={{ color: '#a1a1aa', marginTop: '40px' }}>Loading profile...</p>}
          </motion.div>
        )}

        {view === 'profile' && profileData && (
          <motion.div key="profile" {...pageVariants} className="gas-scroll-area" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ margin: '20px 0' }}>
              {renderProfilePic(profileData.user.profile_pic, editAvatar || profileData.user.avatar, profileData.user.is_pro, editRing, 120)}
            </div>
            <h2 style={{ color: profileData.user.is_pro ? '#fbbf24' : '#000', margin: '10px 0' }}>@{profileData.user.handle}</h2>
            
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
                <button className="gas-ob-white-btn" style={{ width: '100%' }} onClick={saveProfile}>Save Profile</button>
              </div>
            ) : (
              <div>
                <p style={{ color: '#a1a1aa', margin: '0 0 15px 0' }}>{profileData.user.bio || 'No bio yet.'}</p>
                <p style={{ color: '#a1a1aa', marginBottom: '30px' }}>Total Votes Received: {profileData.user.total_votes}</p>
                <button className="gas-ob-white-btn" style={{ background: '#f4f4f5', color: '#000', width: '100%' }} onClick={() => setIsEditing(true)}>Edit Profile</button>
                <button className="gas-ob-white-btn" style={{ background: '#ef4444', color: '#fff', width: '100%' }} onClick={deleteAccount}>Delete Account</button>
              </div>
            )}
          </motion.div>
        )}

        {view === 'pro' && (
          <motion.div key="pro" {...pageVariants} className="gas-scroll-area" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ background: '#111', color: '#fff', borderRadius: '24px', padding: '40px 20px', border: '2px solid #fbbf24', marginTop: '20px' }}>
              <h1 style={{ fontSize: '60px', margin: '0 0 20px' }}>👑</h1>
              <h2 style={{ color: '#fbbf24', margin: '0 0 20px' }}>{user.is_pro ? 'God Mode Active' : 'Unlock God Mode'}</h2>
              <p style={{ fontSize: '18px', marginBottom: '30px' }}>{user.is_pro ? 'You have access to all premium features.' : 'Reveal 2 Names Per Week & unlock exclusive Aura Rings.'}</p>
              
              {!user.is_pro && (
                <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" style={{ background: '#fbbf24', color: '#000', width: '100%' }} onClick={handleUpgrade}>
                  Upgrade Now - ₹99
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {view === 'inbox' && (
          <motion.div key="inbox" {...pageVariants} className="gas-scroll-area">
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