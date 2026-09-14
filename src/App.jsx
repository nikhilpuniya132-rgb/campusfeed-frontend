import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// Real Roster Data
const REAL_CLASSMATES = ['Aayansh Bhardwaj', 'Abhiyansh Gangwar', 'Anamika Swaraj', 'Arnav Singh', 'Aryan Yadav', 'Atiksh Sharma', 'Ayush Chaubey', 'Jassnoor Kaur', 'Vaibhavi Sharma', 'Arushi Yadav', 'Krishna Singh', 'S. Riyanshi'];
const REAL_INBOX = [
  { id: 1, sender: 'girl', time: '12m', grade: 11 }, { id: 2, sender: 'boy', time: '1h', grade: 11 },
  { id: 3, sender: 'girl', time: '2h', grade: 12 }, { id: 4, sender: 'boy', time: '5h', grade: 11 }
];

// Fluid Animation Configs
const pageVariants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, transition: { type: "tween", duration: 0.25 } };
const listStagger = { visible: { opacity: 1, transition: { staggerChildren: 0.05 } }, hidden: { opacity: 0 } };
const itemFade = { visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 10 } };

export default function App() {
  const [view, setView] = useState('welcome'); 
  const [obStep, setObStep] = useState(1); 
  const [handle, setHandle] = useState('');
  const [avatar, setAvatar] = useState('👦');
  const [voteCount, setVoteCount] = useState(0);
  const [coins, setCoins] = useState(124);
  const [isPro, setIsPro] = useState(false); // Controls God Mode UI

  // Helper to get 4 random real names for the polling grid
  const getRandomNames = () => [...REAL_CLASSMATES].sort(() => 0.5 - Math.random()).slice(0, 4);
  const [currentOptions, setCurrentOptions] = useState(getRandomNames());

  const handleVote = () => {
    const newCount = voteCount + 1;
    setVoteCount(newCount);
    if (newCount >= 12) { confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } }); setView('congrats'); } 
    else { setCurrentOptions(getRandomNames()); }
  };

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
              <div className="gas-ob-bottom-sheet" style={{ background: '#27272a' }}>
                {[14, 15, 16, 17].map(a => (
                  <motion.div whileTap={{ backgroundColor: '#3f3f46' }} key={a} onClick={() => setObStep(2)} style={{ padding: '20px', color: '#fff', fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #3f3f46', textAlign: 'center' }}>{a}</motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Skipped steps 2-4 for brevity in UX flow, focusing on mobile input */}
          {obStep === 5 && (
            <div className="gas-ob-content">
              <h2>Choose a username</h2>
              <input type="text" autoFocus className="gas-ob-input" placeholder="@handle" value={handle} onChange={e => setHandle(e.target.value)} />
              <motion.button whileTap={{ scale: 0.95 }} className="gas-ob-white-btn" onClick={() => setObStep(6)}>Next</motion.button>
            </div>
          )}

          {obStep === 6 && (
            <div className="gas-ob-content">
              <h2 style={{ marginBottom: '40px' }}>Your Avatar</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '90%' }}>
                <motion.div whileTap={{ scale: 0.9 }} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '24px', padding: '40px 10px' }} onClick={() => { setAvatar('👦'); setObStep(0); }}>
                  <div style={{ fontSize: '70px' }}>👦</div><div style={{ marginTop: '10px', fontWeight: 'bold' }}>Boy</div>
                </motion.div>
                <motion.div whileTap={{ scale: 0.9 }} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '24px', padding: '40px 10px' }} onClick={() => { setAvatar('👧'); setObStep(0); }}>
                  <div style={{ fontSize: '70px' }}>👧</div><div style={{ marginTop: '10px', fontWeight: 'bold' }}>Girl</div>
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

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
              <div style={{ fontSize: '26px', fontWeight: 900, marginBottom: 'auto' }}>"Most likely to run a startup"</div>
              <div className="gas-poll-grid">
                {currentOptions.map((n) => (
                  <motion.button whileTap={{ scale: 0.9, backgroundColor: '#ff6200', color: '#fff' }} key={n} className="gas-poll-btn" onClick={handleVote}>{n}</motion.button>
                ))}
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
              {REAL_CLASSMATES.slice(0, 7).map((name) => (
                <motion.div variants={itemFade} key={name} className="gas-add-row">
                  <div style={{ fontSize: '40px', marginRight: '15px' }}>🧑</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '18px' }}>{name}</div>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} className="gas-add-btn">ADD</motion.button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {view === 'inbox' && (
          <motion.div key="inbox" {...pageVariants} className="gas-scroll-area">
            <motion.div initial="hidden" animate="visible" variants={listStagger}>
              {REAL_INBOX.map((msg) => (
                <motion.div variants={itemFade} key={msg.id} className="gas-add-row" onClick={() => setView('paywall')}>
                  <div style={{ fontSize: '36px', marginRight: '15px', filter: msg.sender === 'girl' ? 'hue-rotate(-50deg)' : 'hue-rotate(180deg)' }}>🔥</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '18px' }}>From a {msg.sender}</div>
                    <div style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 600 }}>in {msg.grade}th grade</div>
                  </div>
                  <div style={{ color: '#a1a1aa', fontWeight: 800 }}>{msg.time}</div>
                </motion.div>
              ))}
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
                  <span>24 <span style={{ color: '#a1a1aa', fontWeight: 500 }}>friends</span></span>
                  <span>142 <span style={{ color: '#a1a1aa', fontWeight: 500 }}>flames</span></span>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} className="gas-btn-outline" style={{ alignSelf: 'flex-start' }}>EDIT PROFILE</motion.button>
              </div>
            </div>
            
            <div style={{ padding: '0 20px' }}>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>{handle || 'Nikhil'}</h2>
              <p style={{ margin: '0 0 20px 0', color: '#a1a1aa', fontWeight: 700, fontSize: '16px' }}>🏫 St. Kabir Convent</p>
            </div>

            {!isPro && (
              <motion.div whileTap={{ scale: 0.98 }} className="gas-pro-banner" onClick={() => setView('paywall')}>
                <div style={{ fontSize: '24px', marginBottom: '5px' }}>⚡ THE 1% CLUB</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>See exactly who voted for you</div>
              </motion.div>
            )}

            <div className="gas-section-header">TOP FLAMES</div>
            {[ { q: 'Best style in school', icon: '🥶' }, { q: 'Always clutches up', icon: '🏆' }].map((f, i) => (
              <div key={i} className="gas-flame-item">
                <div style={{ position: 'relative', fontSize: '36px', marginRight: '20px' }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '18px' }}>{f.q}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Overlays */}
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