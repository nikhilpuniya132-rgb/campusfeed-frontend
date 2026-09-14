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
  // --- CORE STATE ---
  const [user, setUser] = useState(null);
  const [view, setView] = useState('poll');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // --- ONBOARDING STATE ---
  const [obStep, setObStep] = useState(1);
  const [age, setAge] = useState('');
  const [grade, setGrade] = useState('11');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null); // Stores Base64 Image
  const [selectedFriends, setSelectedFriends] = useState([]); // Array of IDs

  // --- APP STATE ---
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

  // --- ONBOARDING LOGIC ---

  // Real Location Browser API
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setObStep(3), // Success: Move to next step
        (err) => { alert("Location needed to find St. Kabir accurately!"); setObStep(3); }
      );
    } else {
      setObStep(3);
    }
  };

  // Real File Upload Handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result); // Save Base64
        setObStep(10); // Move to Add Friends
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFriend = (id) => {
    setSelectedFriends(prev => prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]);
  };

  const login = async () => {
    setIsAuthenticating(true);
    try {
      // Sends all the newly collected real data to server.js
      const res = await fetch(`${API}/auth`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ phone, firstName, lastName, handle, password, grade, gender, avatar: avatarPreview || '😎', friends: selectedFriends }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setUser(data.user);
      setGradeFilter(data.user.grade.toString());
      setObStep(0); // Exit Onboarding
      loadNextPoll(data.user.grade.toString(), data.user.id);
    } catch (err) { alert(err.message); }
    setIsAuthenticating(false);
  };

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

  // Rest of the App Functions (loadNextPoll, castVote, handleNav, saveProfile, deleteAccount, handleUpgrade) remain unchanged...
  const loadNextPoll = async (targetGrade, explicitId = null) => {
    setHasVoted(false); setIsLoadingPoll(true); setGradeFilter(targetGrade);
    const targetId = explicitId || user?.id;
    try {
      const res = await fetch(`${API}/play/${targetId}?gradeFilter=${targetGrade}`);
      const data = await res.json();
      setCurrentPoll(data.poll); setOptions(data.options || []);
    } catch (e) { console.error(e); }
    setIsLoadingPoll(false);
  };

  const castVote = (receiverId) => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setHasVoted(true); 
    fetch(`${API}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pollId: currentPoll.id, voterId: user.id, receiverId }) });
  };

  const loadPublicProfile = async (userId) => {
    setView('publicProfile'); setPublicProfile(null);
    try {
      const res = await fetch(`${API}/profile/public/${userId}`);
      setPublicProfile((await res.json()).user);
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
    setProfileData({ user: updatedUser }); setUser({ ...user, avatar: editAvatar, ring: editRing });
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

  // --- STEP-BY-STEP VIRAL ONBOARDING FUNNEL ---
  if (!user) {
    return (
      <div className="gas-app-container">
        <AnimatePresence mode="wait">
          <motion.div key={obStep} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }} 
            className="gas-ob-screen" style={{ background: obStep === 1 ? '#18181b' : 'var(--gas-orange)', display: 'flex', flexDirection: 'column' }}>
            
            {obStep > 1 && (
              <div style={{ padding: '20px', fontWeight: 800, fontSize: '18px', display: 'flex', alignItems: 'center' }}>
                <span style={{ cursor: 'pointer', paddingRight: '20px' }} onClick={() => setObStep(obStep - 1)}>❮</span>
                {obStep === 2 && "Please allow access"} {obStep === 3 && "What grade are you in?"} {obStep === 4 && "Pick your school"} {obStep === 10 && "Add Friends"}
              </div>
            )}

            {/* STEP 1: Age */}
            {obStep === 1 && (
              <div className="gas-ob-content" style={{ justifyContent: 'flex-start', paddingTop: '60px' }}>
                <h1 style={{ fontSize: '64px', margin: '0 0 40px 0', letterSpacing: '-2px', color: '#fff' }}>CampusFeed</h1>
                <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '40px' }}>By entering your age you agree to our<br/><span onClick={() => setLegalView('terms')} style={{ textDecoration: 'underline' }}>Terms and Privacy Policy</span></p>
                <h3 style={{ color: '#ff6200', marginBottom: '20px' }}>Enter your age</h3>
                <div className="gas-ob-bottom-sheet gas-scroll-picker" style={{ background: '#27272a', borderRadius: '16px', margin: '0 20px', width: 'auto' }}>
                  {[12, 13, 14, 15, 16, 17, 18, 19].map(a => (
                    <motion.div whileTap={{ backgroundColor: '#3f3f46' }} key={a} onClick={() => { setAge(a); setObStep(2); }} style={{ padding: '20px', color: '#a1a1aa', fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #3f3f46', textAlign: 'center' }}>
                      {a === 16 ? <span style={{ color: '#fff' }}>{a}</span> : a}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: Real Permissions */}
            {obStep === 2 && (
              <div className="gas-ob-content">
                <h1 style={{ fontSize: '64px', margin: '0 0 20px 0' }}>CampusFeed</h1>
                <p style={{ fontSize: '18px', marginBottom: '60px', maxWidth: '280px', lineHeight: '1.4' }}>CampusFeed needs to find your school and suggest friends.</p>
                <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" style={{ color: '#000', marginBottom: '15px' }} onClick={requestLocation}>🌍 Enable Location</motion.button>
                <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" style={{ color: '#000' }} onClick={() => setObStep(3)}>📇 Enable Contacts</motion.button>
                <p style={{ marginTop: 'auto', fontSize: '12px', opacity: 0.8 }}><br/>CampusFeed cares intensely about your privacy.</p>
              </div>
            )}

            {/* STEP 3: Grade */}
            {obStep === 3 && (
              <div className="gas-ob-bottom-sheet" style={{ marginTop: 'auto', flex: '0.8', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                <div style={{ padding: '20px', color: '#000', fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid var(--gas-border)' }}>Not in High School</div>
                <div style={{ padding: '15px 20px', color: '#a1a1aa', fontSize: '13px', background: '#f4f4f5', fontWeight: 'bold' }}>HIGH SCHOOL</div>
                {['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g, i) => (
                  <div key={g} className="gas-ob-list-item" onClick={() => { setGrade((i + 9).toString()); setObStep(4); }}>
                    {g} <span style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 'normal' }}>CLASS OF {2027 - i}</span>
                  </div>
                ))}
              </div>
            )}

            {/* STEP 4: Real School Data */}
            {obStep === 4 && (
              <div className="gas-ob-bottom-sheet" style={{ marginTop: '20px', flex: 1 }}>
                <div style={{ padding: '15px 20px', background: '#f4f4f5' }}>
                  <input type="text" placeholder="🔍 Search..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#e4e4e7', fontSize: '16px', boxSizing: 'border-box' }} />
                </div>
                <div className="gas-ob-list-item" onClick={() => setObStep(5)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '24px' }}>🏫</div>
                    <div>
                      <div style={{ color: '#000', fontWeight: '800' }}>St. Kabir Convent School</div>
                      <div style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 'normal' }}>Bathinda, Punjab</div>
                    </div>
                  </div>
                  <div style={{ color: '#ff6200', textAlign: 'right', fontWeight: '800' }}>6<br/><span style={{ fontSize: '10px', color: '#a1a1aa' }}>MEMBERS</span></div>
                </div>
              </div>
            )}

            {/* STEP 5: Phone Number (No OTP) */}
            {obStep === 5 && (
              <div className="gas-ob-content" style={{ justifyContent: 'flex-start', paddingTop: '40px' }}>
                <h2 style={{ marginBottom: '10px' }}>Enter your phone number</h2>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '40px' }}>🇮🇳 +91</p>
                <input type="tel" autoFocus className="gas-ob-input" style={{ width: '100%', maxWidth: '280px', letterSpacing: '2px' }} placeholder="00000 00000" value={phone} onChange={e => setPhone(e.target.value)} />
                <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" style={{ background: '#fff', color: '#ff6200' }} onClick={() => setObStep(6)}>Next</motion.button>
              </div>
            )}

            {/* STEP 6: Name */}
            {obStep === 6 && (
              <div className="gas-ob-content" style={{ justifyContent: 'flex-start', paddingTop: '40px' }}>
                <h2>What's your full name?</h2>
                <input type="text" autoFocus className="gas-ob-input" style={{ marginBottom: '20px' }} placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                <input type="text" className="gas-ob-input" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} />
                <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" onClick={() => setObStep(7)}>Next</motion.button>
              </div>
            )}

            {/* STEP 7: Username & Password */}
            {obStep === 7 && (
              <div className="gas-ob-content" style={{ justifyContent: 'flex-start', paddingTop: '40px' }}>
                <h2>Choose a username</h2>
                <input type="text" autoFocus className="gas-ob-input" style={{ marginBottom: '20px' }} placeholder="@handle" value={handle} onChange={e => setHandle(e.target.value.toLowerCase())} />
                <h2>Secure Password</h2>
                <input type="password" className="gas-ob-input" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" onClick={() => setObStep(8)}>Next</motion.button>
              </div>
            )}

            {/* STEP 8: Gender (Image grid) */}
            {obStep === 8 && (
              <div className="gas-ob-content" style={{ justifyContent: 'flex-start', paddingTop: '40px' }}>
                <h2 style={{ marginBottom: '40px' }}>What's your gender?</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '90%' }}>
                  <motion.div whileTap={{ scale: 0.9 }} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '16px', padding: '30px 10px', cursor: 'pointer' }} onClick={() => { setGender('Boy'); setObStep(9); }}>
                    <div style={{ fontSize: '60px' }}>👦</div><div style={{ marginTop: '10px', fontWeight: 'bold' }}>Boy</div>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.9 }} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '16px', padding: '30px 10px', cursor: 'pointer' }} onClick={() => { setGender('Girl'); setObStep(9); }}>
                    <div style={{ fontSize: '60px' }}>👧</div><div style={{ marginTop: '10px', fontWeight: 'bold' }}>Girl</div>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.9 }} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '16px', padding: '30px 10px', cursor: 'pointer', gridColumn: 'span 2' }} onClick={() => { setGender('Non-binary'); setObStep(9); }}>
                    <div style={{ fontSize: '60px' }}>🧑</div><div style={{ marginTop: '10px', fontWeight: 'bold' }}>Non-binary</div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* STEP 9: Profile Photo Upload */}
            {obStep === 9 && (
              <div className="gas-ob-content" style={{ justifyContent: 'center' }}>
                <h2 style={{ marginBottom: '30px' }}>Add a profile photo</h2>
                <div style={{ fontSize: '100px', background: 'rgba(255,255,255,0.2)', width: '160px', height: '160px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', overflow: 'hidden' }}>
                  {avatarPreview ? <img src={avatarPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📸'}
                </div>
                
                <label className="gas-ob-white-btn" style={{ display: 'inline-block', background: '#fff', color: '#ff6200', textAlign: 'center', cursor: 'pointer', boxSizing: 'border-box' }}>
                  Choose a photo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                </label>
                <div style={{ marginTop: '20px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setObStep(10)}>Skip for now</div>
              </div>
            )}

            {/* STEP 10: Real Database Add Friends */}
            {obStep === 10 && (
              <div className="gas-ob-bottom-sheet" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ padding: '15px 20px', background: '#f4f4f5' }}>
                  <input type="text" placeholder="🔍 Search St. Kabir..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#e4e4e7', fontSize: '16px', boxSizing: 'border-box' }} />
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {ST_KABIR_MEMBERS.map(member => (
                    <div key={member.id} className="gas-ob-list-item" onClick={() => toggleFriend(member.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ fontSize: '40px', background: '#e4e4e7', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧑</div>
                        <div>
                          <div style={{ color: '#000', fontWeight: '800' }}>{member.name}</div>
                          <div style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 'normal' }}>{member.mutuals} mutual friends</div>
                        </div>
                      </div>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #e4e4e7', background: selectedFriends.includes(member.id) ? '#ff6200' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px' }}>
                        {selectedFriends.includes(member.id) && "✓"}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #e4e4e7' }}>
                  <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" style={{ width: '100%', background: '#ff6200', color: '#fff', margin: 0 }} onClick={login}>
                    {isAuthenticating ? 'Building Feed...' : 'Continue'}
                  </motion.button>
                </div>
              </div>
            )}
            
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // --- CORE APP UI (Unchanged) ---
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