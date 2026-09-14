import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// Vercel will automatically use your Render URL if you set VITE_BACKEND_URL in Vercel settings.
// Fallback to your actual Render URL here just in case.
const API = import.meta.env.VITE_BACKEND_URL || 'https://campusfeed-backend-po4g.onrender.com';

const pageVariants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { type: "tween", duration: 0.25 } };
const listStagger = { visible: { opacity: 1, transition: { staggerChildren: 0.05 } }, hidden: { opacity: 0 } };
const itemFade = { visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } };

export default function App() {
  // Navigation & UI State
  const [view, setView] = useState('welcome'); 
  const [obStep, setObStep] = useState(1); 
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isPro, setIsPro] = useState(false);
  
  // Real User Data State (From Backend)
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('11');
  const [avatar, setAvatar] = useState('👦');
  const [coins, setCoins] = useState(0);
  
  // Real Database Feed State
  const [voteCount, setVoteCount] = useState(0);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("Loading...");
  const [inbox, setInbox] = useState([]);
  const [classmates, setClassmates] = useState([]);

  // --- 1. AUTHENTICATE WITH RENDER BACKEND ---
  const handleLogin = async () => {
    setIsAuthenticating(true);
    try {
      const res = await fetch(`${API}/auth`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ handle, password, grade, avatar }) 
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      setUser(data.user);
      setCoins(data.user.coins || 0);
      setObStep(0); // Close onboarding funnel
      fetchInitialData(data.user.id, data.user.grade);
    } catch (err) { 
      console.error(err);
      alert("Backend connection failed. Check if Render server is awake."); 
    }
    setIsAuthenticating(false);
  };

  // --- 2. FETCH LIVE DATA ---
  const fetchInitialData = async (userId, userGrade) => {
    try {
      const [inboxRes, usersRes] = await Promise.all([
        fetch(`${API}/inbox/${userId}`),
        fetch(`${API}/users?grade=${userGrade}`)
      ]);
      
      const inboxData = await inboxRes.json();
      const usersData = await usersRes.json();
      
      setInbox(inboxData || []);
      setClassmates(usersData || []);
      loadNextPoll(usersData || []);
    } catch (err) {
      console.error("Failed to load server data:", err);
    }
  };

  // --- 3. GENERATE POLL ---
  const loadNextPoll = (availableUsers = classmates) => {
    if (availableUsers.length < 4) {
      setCurrentQuestion("Not enough classmates to play yet!");
      setCurrentOptions([]);
      return;
    }
    const shuffled = [...availableUsers].sort(() => 0.5 - Math.random()).slice(0, 4);
    setCurrentOptions(shuffled);
    setCurrentQuestion("Who is most likely to run a startup?");
  };

  // --- 4. HANDLE VOTE TO BACKEND ---
  const handleVote = async (selectedUser) => {
    const newCount = voteCount + 1;
    setVoteCount(newCount);
    
    // Fire and forget to server
    if (user) {
      fetch(`${API}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, receiverId: selectedUser.id, question: currentQuestion })
      }).catch(err => console.error("Vote failed to save:", err));
    }

    if (newCount >= 12) { 
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } }); 
      setView('congrats'); 
      
      if (user) {
        fetch(`${API}/add-coins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, amount: 17 })
        });
      }
      setCoins(prev => prev + 17);
    } else { 
      loadNextPoll(); 
    }
  };

  // --- ONBOARDING FUNNEL UI ---
  const renderOnboarding = () => {
    if (obStep === 0) return null;
    return (
      <AnimatePresence mode="wait">
        <motion.div key={obStep} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }} className={`gas-ob-screen ${obStep === 1 ? 'gas-ob-dark' : ''}`}>
          
          {obStep > 1 && (
            <div style={{ padding: '20px', textAlign: 'center', fontWeight: 800, fontSize: '20px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '20px', top: '20px', cursor: 'pointer' }} onClick={() => setObStep(obStep - 1)}>❮</div>
              {obStep === 2 && "Enable Access"} {obStep === 3 && "Your Grade"} {obStep === 4 && "Find School"}
            </div>
          )}

          {obStep === 1 && (
            <div className="gas-ob-content">
              <h1 style={{ fontSize: '64px', margin: '0 0 40px 0', letterSpacing: '-2px' }}>GAS</h1>
              <h3 style={{ color: '#ff6200', marginBottom: '20px' }}>Enter your age</h3>
              <div className="gas-ob-bottom-sheet gas-scroll-picker" style={{ background: '#27272a' }}>
                {[14, 15, 16, 17, 18].map(a => (
                  <motion.div whileTap={{ backgroundColor: '#3f3f46' }} key={a} onClick={() => setObStep(2)} style={{ padding: '20px', color: '#fff', fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #3f3f46', textAlign: 'center' }}>{a}</motion.div>
                ))}
              </div>
            </div>
          )}

          {obStep === 2 && (
            <div className="gas-ob-content">
              <h1 style={{ fontSize: '64px', margin: '0 0 20px 0' }}>GAS</h1>
              <p style={{ fontSize: '18px', marginBottom: '60px', maxWidth: '250px' }}>Gas needs to find your school and suggest friends.</p>
              <button className="gas-ob-white-btn" onClick={() => setObStep(3)}>🗺️ Enable Location</button>
              <button className="gas-ob-white-btn" onClick={() => setObStep(3)}>📇 Enable Contacts</button>
            </div>
          )}

          {obStep === 3 && (
            <div className="gas-ob-bottom-sheet">
              <div style={{ padding: '15px 20px', color: '#a1a1aa', fontSize: '14px', background: '#f4f4f5', fontWeight: 'bold' }}>HIGH SCHOOL</div>
              {['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g, i) => (
                <div key={g} className="gas-ob-list-item" onClick={() => { setGrade((i + 9).toString()); setObStep(4); }}>
                  {g} <span style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 'normal' }}>CLASS OF {2027 - i}</span>
                </div>
              ))}
            </div>
          )}

          {obStep === 4 && (
            <div className="gas-ob-bottom-sheet">
              <div style={{ padding: '15px 20px', background: '#f4f4f5' }}>
                <input type="text" placeholder="🔍 Search..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#e4e4e7', fontSize: '16px', boxSizing: 'border-box' }} />
              </div>
              <div className="gas-ob-list-item" onClick={() => setObStep(5)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '24px' }}>🏫</div>
                  <div>
                    <div style={{ color: '#ff6200', fontWeight: '800' }}>St. Kabir Convent</div>
                    <div style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 'normal' }}>Bathinda, Punjab</div>
                  </div>
                </div>
                <div style={{ color: '#ff6200', textAlign: 'right', fontWeight: '800' }}>1,515<br/><span style={{ fontSize: '10px', color: '#a1a1aa' }}>MEMBERS</span></div>
              </div>
            </div>
          )}

          {obStep === 5 && (
            <div className="gas-ob-content">
              <h2>Choose a username</h2>
              <input type="text" autoFocus className="gas-ob-input" placeholder="@handle" value={handle} onChange={e => setHandle(e.target.value)} />
              <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" onClick={() => setObStep(6)}>Next</motion.button>
            </div>
          )}

          {obStep === 6 && (
            <div className="gas-ob-content">
              <h2 style={{ marginBottom: '40px' }}>What's your gender?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '90%' }}>
                <motion.div whileTap={{ scale: 0.9 }} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '24px', padding: '40px 10px' }} onClick={() => { setAvatar('👦'); setObStep(7); }}>
                  <div style={{ fontSize: '70px' }}>👦</div><div style={{ marginTop: '10px', fontWeight: 'bold' }}>Boy</div>
                </motion.div>
                <motion.div whileTap={{ scale: 0.9 }} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '24px', padding: '40px 10px' }} onClick={() => { setAvatar('👧'); setObStep(7); }}>
                  <div style={{ fontSize: '70px' }}>👧</div><div style={{ marginTop: '10px', fontWeight: 'bold' }}>Girl</div>
                </motion.div>
              </div>
            </div>
          )}

          {obStep === 7 && (
            <div className="gas-ob-content">
              <h2>Set Password</h2>
              <input type="password" autoFocus className="gas-ob-input" placeholder="Secret" value={password} onChange={e => setPassword(e.target.value)} />
              <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" onClick={handleLogin}>
                {isAuthenticating ? 'Connecting to Server...' : 'Enter CampusFeed'}
              </motion.button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  // --- MAIN APP UI ---
  return (
    <div className="gas-app-container">
      {renderOnboarding()}
      
      {obStep === 0 && view !== 'welcome' && (
        <div className="gas-top-nav">
          <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${(view === 'inbox' || view === 'add') ? 'active' : ''}`} onClick={() => setView('add')}>
            Add+
          </motion.span>
          <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${(view === 'poll' || view === 'congrats') ? 'active' : ''}`} onClick={() => setView('poll')}>
            CampusFeed
          </motion.span>
          <motion.span whileTap={{ scale: 0.9 }} className={`gas-nav-item ${(view === 'profile' || view === 'edit') ? 'active' : ''}`} onClick={() => setView('profile')}>
            Profile
          </motion.span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === 'welcome' && obStep === 0 && (
          <motion.div key="welcome" {...pageVariants} className="gas-white-screen">
            <h1 style={{ fontSize: '48px', color: '#ff6200', margin: '0 0 40px 0' }}>CampusFeed</h1>
            <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" style={{ background: '#ff6200', color: '#fff' }} onClick={() => setView('poll')}>Start</motion.button>
          </motion.div>
        )}

        {view === 'poll' && (
          <motion.div key="poll" {...pageVariants} className="gas-poll-bg">
            <div style={{ fontWeight: 700, opacity: 0.9, margin: '10px 0 30px' }}>{voteCount + 1} of 12</div>
            <motion.div key={voteCount} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '80px', marginBottom: '15px' }}>💯</div>
              <div style={{ fontSize: '26px', fontWeight: 900, marginBottom: 'auto' }}>"{currentQuestion}"</div>
              <div className="gas-poll-grid">
                {currentOptions.length > 0 ? (
                  currentOptions.map((person) => (
                    <motion.button whileTap={{ scale: 0.9, backgroundColor: '#ff6200', color: '#fff' }} key={person.id || person.name} className="gas-poll-btn" onClick={() => handleVote(person)}>
                      {person.name || person.handle}
                    </motion.button>
                  ))
                ) : (
                  <div style={{ gridColumn: 'span 2' }}>Waiting for more classmates to join...</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {view === 'add' && (
          <motion.div key="add" {...pageVariants} className="gas-scroll-area">
            <div style={{ padding: '15px' }}>
              <input type="text" placeholder="🔍 Find friends..." style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#f4f4f5', fontSize: '16px', boxSizing: 'border-box' }} />
            </div>
            <div className="gas-section-header">FROM CLASS 11</div>
            <motion.div initial="hidden" animate="visible" variants={listStagger}>
              {classmates.length > 0 ? classmates.map((person) => (
                <motion.div variants={itemFade} key={person.id || person.handle} className="gas-add-row">
                  <div style={{ fontSize: '40px', marginRight: '15px' }}>{person.avatar || '🧑'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '18px' }}>{person.name || person.handle}</div>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} className="gas-add-btn">ADD</motion.button>
                </motion.div>
              )) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#a1a1aa' }}>No classmates found in database yet.</div>
              )}
            </motion.div>
          </motion.div>
        )}

        {view === 'inbox' && (
          <motion.div key="inbox" {...pageVariants} className="gas-scroll-area">
            <motion.div initial="hidden" animate="visible" variants={listStagger}>
              {inbox.length > 0 ? inbox.map((msg, index) => (
                <motion.div variants={itemFade} key={msg.id || index} className="gas-add-row" onClick={() => setView('paywall')}>
                  <div style={{ fontSize: '36px', marginRight: '15px', filter: msg.sender_gender === 'Girl' ? 'hue-rotate(-50deg)' : 'hue-rotate(180deg)' }}>🔥</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '18px' }}>From a {msg.sender_gender || 'student'}</div>
                    <div style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 600 }}>in {msg.sender_grade || '11'}th grade</div>
                  </div>
                  <div style={{ color: '#a1a1aa', fontWeight: 800 }}>{msg.time_ago || '1h'}</div>
                </motion.div>
              )) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#a1a1aa', fontWeight: 'bold' }}>Your inbox is empty. Play CampusFeed to get noticed!</div>
              )}
            </motion.div>
            <motion.button whileTap={{ scale: 0.95 }} className="gas-sticky-btn" onClick={() => setView('paywall')}>🔒 Reveal Names</motion.button>
          </motion.div>
        )}

        {view === 'profile' && (
          <motion.div key="profile" {...pageVariants} className="gas-scroll-area">
            <div className="gas-profile-header">
              <div style={{ fontSize: '80px', background: '#f4f4f5', borderRadius: '50%', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{avatar}</div>
              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '20px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '20px', fontWeight: 800, fontSize: '18px', marginBottom: '10px' }}>
                  <span>{classmates.length} <span style={{ color: '#a1a1aa', fontWeight: 500 }}>friends</span></span>
                  <span>{inbox.length} <span style={{ color: '#a1a1aa', fontWeight: 500 }}>flames</span></span>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} className="gas-btn-outline" style={{ alignSelf: 'flex-start' }}>EDIT PROFILE</motion.button>
              </div>
            </div>
            
            <div style={{ padding: '0 20px' }}>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>{user?.name || handle}</h2>
              <p style={{ margin: '0 0 20px 0', color: '#a1a1aa', fontWeight: 700, fontSize: '16px' }}>🏫 St. Kabir Convent</p>
            </div>

            {!isPro && (
              <motion.div whileTap={{ scale: 0.98 }} className="gas-pro-banner" onClick={() => setView('paywall')}>
                <div style={{ fontSize: '24px', marginBottom: '5px' }}>⚡ THE 1% CLUB</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>See exactly who voted for you</div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view === 'paywall' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="gas-shop-overlay" style={{ justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="gas-shop-modal" style={{ height: 'auto', textAlign: 'center', border: '2px solid #fbbf24' }}>
               <h2 style={{ fontSize: '28px', margin: '0 0 20px' }}>Unlock ⚡ GOD MODE</h2>
               <div style={{ fontSize: '80px', marginBottom: '20px' }}>💌</div>
               <p style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '10px' }}>Reveal 2 Names Per Week</p>
               <p style={{ color: '#fbbf24', fontWeight: '900', fontSize: '24px', margin: '20px 0 30px' }}>₹99 / month</p>
               <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" style={{ background: '#fbbf24', color: '#000', marginBottom: '20px' }} onClick={() => { setIsPro(true); setView('inbox'); }}>Upgrade Now</motion.button>
               <div style={{ color: '#a1a1aa', fontWeight: 'bold', cursor: 'pointer', padding: '10px' }} onClick={() => setView('inbox')}>Maybe Later</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}