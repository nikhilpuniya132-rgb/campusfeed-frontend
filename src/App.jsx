import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function App() {
  // App State
  const [view, setView] = useState('welcome'); // welcome, poll, inbox, profile, add, edit, shop
  const [obStep, setObStep] = useState(1); // 0 = fully logged in, 1-7 = onboarding
  
  // User Data State
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('11');
  const [avatar, setAvatar] = useState('👦');
  
  // Game State
  const [voteCount, setVoteCount] = useState(0);
  const [coins, setCoins] = useState(58);

  // --------------------------------------------------------
  // ONBOARDING FUNNEL
  // --------------------------------------------------------
  const renderOnboarding = () => {
    if (obStep === 0) return null;
    return (
      <AnimatePresence>
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }} className={`gas-ob-screen ${obStep === 1 ? 'gas-ob-dark' : ''}`}>
          
          {obStep > 1 && (
            <div style={{ padding: '20px', textAlign: 'center', fontWeight: 800, fontSize: '20px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '20px', cursor: 'pointer' }} onClick={() => setObStep(obStep - 1)}>❮</div>
              {obStep === 2 && "Please allow access"}
              {obStep === 3 && "What grade are you in?"}
              {obStep === 4 && "Pick your school"}
            </div>
          )}

          {obStep === 1 && (
            <div className="gas-ob-content">
              <h1 style={{ fontSize: '64px', margin: '0 0 40px 0', letterSpacing: '-2px' }}>GAS</h1>
              <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '40px' }}>By entering your age you agree to our<br/>Terms and Privacy Policy</p>
              <h3 style={{ color: '#ff6200', marginBottom: '20px' }}>Enter your age</h3>
              <div className="gas-ob-bottom-sheet" style={{ background: '#27272a' }}>
                {[13, 14, 15, 16, 17, 18].map(a => (
                  <div key={a} onClick={() => setObStep(2)} style={{ padding: '15px', color: '#fff', fontSize: '24px', fontWeight: 'bold', borderBottom: '1px solid #3f3f46', textAlign: 'center' }}>{a}</div>
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
              <div className="gas-section-header">HIGH SCHOOL</div>
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
                <input type="text" placeholder="🔍 Search..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontSize: '16px', boxSizing: 'border-box' }} />
              </div>
              <div className="gas-ob-list-item" onClick={() => setObStep(5)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ fontSize: '24px' }}>🏫</div>
                  <div>
                    <div style={{ color: '#ff6200' }}>St. Kabir Convent Senior Sec.</div>
                    <div style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 'normal' }}>Bathinda, Punjab</div>
                  </div>
                </div>
                <div style={{ color: '#ff6200', textAlign: 'right' }}>1,515<br/><span style={{ fontSize: '10px', color: '#a1a1aa' }}>MEMBERS</span></div>
              </div>
            </div>
          )}

          {obStep === 5 && (
            <div className="gas-ob-content">
              <h2>Choose a username</h2>
              <input className="gas-ob-input" placeholder="@handle" value={handle} onChange={e => setHandle(e.target.value)} />
              <button className="gas-ob-white-btn" onClick={() => setObStep(6)}>Next</button>
            </div>
          )}

          {obStep === 6 && (
            <div className="gas-ob-content">
              <h2 style={{ marginBottom: '40px' }}>What's your gender?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%', maxWidth: '320px' }}>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '30px 10px', cursor: 'pointer' }} onClick={() => { setAvatar('👦'); setObStep(7); }}>
                  <div style={{ fontSize: '64px' }}>👦</div><div style={{ marginTop: '10px', fontWeight: 'bold' }}>Boy</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '30px 10px', cursor: 'pointer' }} onClick={() => { setAvatar('👧'); setObStep(7); }}>
                  <div style={{ fontSize: '64px' }}>👧</div><div style={{ marginTop: '10px', fontWeight: 'bold' }}>Girl</div>
                </div>
              </div>
            </div>
          )}

          {obStep === 7 && (
            <div className="gas-ob-content">
              <h2>Set Password</h2>
              <input type="password" className="gas-ob-input" placeholder="Secret" value={password} onChange={e => setPassword(e.target.value)} />
              <button className="gas-ob-white-btn" onClick={() => setObStep(0)}>Enter CampusFeed</button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  // --------------------------------------------------------
  // MAIN APP RENDERING
  // --------------------------------------------------------
  return (
    <div className="gas-app-container">
      {renderOnboarding()}
      
      {/* Top Navigation */}
      {obStep === 0 && view !== 'welcome' && (
        <div className="gas-top-nav">
          <span className={`gas-nav-item ${(view === 'inbox' || view === 'add') ? 'active' : ''}`} onClick={() => setView('add')}>
            Add+ <span className="gas-badge" style={{background:'#e4e4e7', color:'#000'}}>3</span>
          </span>
          <span className={`gas-nav-item ${(view === 'poll' || view === 'congrats') ? 'active' : ''}`} onClick={() => setView('poll')}>
            CampusFeed
          </span>
          <span className={`gas-nav-item ${(view === 'profile' || view === 'edit') ? 'active' : ''}`} onClick={() => setView('profile')}>
            Profile
          </span>
        </div>
      )}

      {/* 1. Welcome */}
      {view === 'welcome' && obStep === 0 && (
        <div className="gas-white-screen">
          <h2 style={{ fontSize: '18px', letterSpacing: '1px', opacity: 0.6 }}>WELCOME TO</h2>
          <h1 style={{ fontSize: '48px', color: '#ff6200', margin: '0 0 40px 0' }}>CampusFeed</h1>
          <button className="gas-ob-white-btn" style={{ background: '#ff6200', color: '#fff', width: '80%' }} onClick={() => setView('poll')}>Start</button>
        </div>
      )}

      {/* 2. Core Polling */}
      {view === 'poll' && (
        <div className="gas-poll-bg">
          <div style={{ fontWeight: 700, opacity: 0.9, margin: '10px 0 30px' }}>{voteCount + 1} of 12</div>
          <div style={{ fontSize: '80px', marginBottom: '15px' }}>😊</div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginBottom: 'auto' }}>"Smiling 24/7"</div>
          <div className="gas-poll-grid">
            {['Lucy Moore', 'Victoria Moore', 'Anna Grace Smith', 'Hailey Malchow'].map((n) => (
              <button key={n} className="gas-poll-btn" onClick={() => {
                const newCount = voteCount + 1;
                setVoteCount(newCount);
                if (newCount >= 12) { confetti(); setView('congrats'); }
              }}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Congrats */}
      {view === 'congrats' && (
        <div className="gas-white-screen">
          <h1 style={{ fontSize: '42px', marginBottom: '20px' }}>Congrats</h1>
          <div style={{ fontSize: '64px', marginBottom: '10px' }}>🪙🪙</div>
          <p style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '60px' }}>You earned 17 coins</p>
          <button className="gas-ob-white-btn" style={{ background: '#f4f4f5', color: '#000', width: '80%' }} onClick={() => setView('inbox')}>🤑 Cash Out</button>
        </div>
      )}

      {/* 4. Add Friends / Activity */}
      {view === 'add' && (
        <div style={{ flex: 1, background: '#fff', overflowY: 'auto' }}>
          <div style={{ padding: '15px' }}>
            <input type="text" placeholder="🔍 Search..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', background: '#f4f4f5', fontSize: '16px', boxSizing: 'border-box' }} />
          </div>
          
          <div className="gas-section-header">FRIEND REQUESTS</div>
          <div className="gas-add-row" style={{ background: '#fff5f0' }}>
            <div style={{ fontSize: '40px', marginRight: '15px' }}>🧑</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '16px' }}>Mohamed Metti</div>
              <div style={{ color: '#a1a1aa', fontSize: '12px' }}>1 mutual friend</div>
            </div>
            <span className="gas-hide-text">HIDE</span>
            <button className="gas-add-btn">ADD</button>
          </div>

          <div className="gas-section-header">FROM SCHOOL</div>
          {['Aaliyah Jarrell', 'Abraham Andrade', 'Adore Salena'].map(n => (
            <div key={n} className="gas-add-row">
              <div style={{ fontSize: '40px', marginRight: '15px' }}>🧑</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '16px' }}>{n}</div>
                <div style={{ color: '#a1a1aa', fontSize: '12px' }}>Class 11</div>
              </div>
              <span className="gas-hide-text">HIDE</span>
              <button className="gas-add-btn">ADD</button>
            </div>
          ))}
        </div>
      )}

      {/* 5. Inbox */}
      {view === 'inbox' && (
        <div style={{ flex: 1, background: '#fff' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="gas-add-row" style={{ cursor: 'pointer' }} onClick={() => setView('paywall')}>
              <div style={{ fontSize: '32px', marginRight: '15px', filter: i % 2 === 0 ? 'hue-rotate(180deg)' : 'hue-rotate(-50deg)' }}>🔥</div>
              <div style={{ flex: 1, fontWeight: 700, fontSize: '18px' }}>From a {i % 2 === 0 ? 'boy' : 'girl'}</div>
              <div style={{ color: '#a1a1aa', fontWeight: 800 }}>{i}h</div>
            </div>
          ))}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button className="gas-ob-white-btn" style={{ background: '#000', color: '#fff' }} onClick={() => setView('paywall')}>🔒 See who likes you</button>
          </div>
        </div>
      )}

      {/* 6. Profile */}
      {view === 'profile' && (
        <div style={{ flex: 1, background: '#fff', overflowY: 'auto' }}>
          <div className="gas-profile-header">
            <div style={{ fontSize: '80px', background: '#f4f4f5', borderRadius: '50%', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{avatar}</div>
            <div className="gas-profile-stats">
              <div style={{ display: 'flex', gap: '20px', fontWeight: 800, fontSize: '16px' }}>
                <span>176 <span style={{ color: '#a1a1aa', fontWeight: 400 }}>friends</span></span>
                <span>328 <span style={{ color: '#a1a1aa', fontWeight: 400 }}>flames</span></span>
              </div>
              <button className="gas-btn-outline" style={{ alignSelf: 'flex-start' }} onClick={() => setView('edit')}>EDIT PROFILE</button>
            </div>
          </div>
          
          <div style={{ padding: '0 20px' }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '22px' }}>{handle || 'Nikhil Puniya'}</h2>
            <p style={{ margin: '0 0 15px 0', color: '#a1a1aa', fontWeight: 700 }}>@{handle || 'nikhilpuniyaai'}</p>
            <div style={{ display: 'flex', gap: '20px', color: '#a1a1aa', fontWeight: 700, fontSize: '14px', marginBottom: '20px' }}>
              <span>🏫 St. Kabir Convent</span>
              <span>🎓 Class {grade}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
              <button className="gas-btn-outline" style={{ flex: 1, margin: 0, padding: '12px' }}>Share Profile ⍗</button>
              <div className="gas-btn-shop" onClick={() => setView('shop')}>
                <span style={{ color: '#a1a1aa', fontSize: '10px', position: 'absolute', top: '-8px', left: '15px', background: '#fff', padding: '0 4px' }}>COINS</span>
                <span style={{ fontSize: '20px', marginRight: '10px' }}>000<span style={{color:'#000'}}>{coins}</span></span>
                <span style={{ background: '#fbbf24', color: '#000', padding: '6px 12px', borderRadius: '16px' }}>SHOP</span>
              </div>
            </div>
          </div>

          <div className="gas-section-header">TOP FLAMES</div>
          {[
            { q: 'Most unforgettable name', icon: '💡' },
            { q: 'Will grow up, move to LA, and make it big', icon: '💫' },
            { q: 'The heartbreaker', icon: '💔' }
          ].map((f, i) => (
            <div key={i} className="gas-flame-item">
              <div style={{ position: 'relative', fontSize: '32px', marginRight: '20px' }}>
                {f.icon}
                <div className="gas-flame-rank">{i + 1}</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '16px' }}>{f.q}</div>
            </div>
          ))}
        </div>
      )}

      {/* 7. Edit Profile */}
      {view === 'edit' && (
        <div style={{ flex: 1, background: '#fff', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', fontWeight: 800 }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setView('profile')}>Close</span>
            <span>Edit Profile</span>
            <span style={{ opacity: 0 }}>Close</span>
          </div>
          
          <div style={{ textAlign: 'center', margin: '20px 0 40px' }}>
            <div style={{ fontSize: '80px', background: '#f4f4f5', borderRadius: '50%', width: '120px', height: '120px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {avatar}
              <div style={{ position: 'absolute', background: '#fff', borderRadius: '50%', padding: '5px', bottom: '0', right: '0', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>📷</div>
            </div>
          </div>

          <div className="gas-edit-row"><span className="gas-edit-label">First Name</span><span>Nikhil</span></div>
          <div className="gas-edit-row"><span className="gas-edit-label">Last Name</span><span>Puniya</span></div>
          <div className="gas-edit-row"><span className="gas-edit-label">Username</span><span>{handle || 'nikhilpuniyaai'}</span></div>
          <div className="gas-edit-row"><span className="gas-edit-label">Gender</span><span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Boy <span style={{ color: '#a1a1aa' }}>❯</span></span></div>

          <div className="gas-section-header" style={{ marginTop: '20px' }}>SCHOOL</div>
          <div className="gas-edit-row"><span className="gas-edit-label" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '10px', color: '#000' }}>🏫 St. Kabir Convent</span><span style={{ color: '#a1a1aa' }}>❯</span></div>
          <div className="gas-edit-row">
            <span className="gas-edit-label" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '10px', color: '#000' }}>🎓 Class {grade}</span>
            <span style={{ color: '#a1a1aa', fontSize: '12px' }}>Class of 2027 <span style={{ fontSize: '16px' }}>❯</span></span>
          </div>
        </div>
      )}

      {/* 8. Shop Modal */}
      {view === 'shop' && (
        <div className="gas-shop-overlay">
          <div className="gas-shop-modal">
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '18px', marginBottom: '30px' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => setView('profile')}>✕</span>
              <span>Shop</span>
              <span style={{ opacity: 0 }}>✕</span>
            </div>
            
            <div style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 800, letterSpacing: '1px' }}>YOUR BALANCE</div>
            <div style={{ fontSize: '48px', fontWeight: 900, color: '#fbbf24', marginBottom: '30px' }}>🪙 {coins}</div>
            
            <h3 style={{ margin: '0 0 5px 0' }}>Boost Your Name in Polls</h3>
            <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '0 0 20px 0' }}>Use coins to get featured in polls</p>

            <div className="gas-shop-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '32px' }}>📘</div>
                <div>
                  <div style={{ fontWeight: 800 }}>Get Your Name on<br/>3 Random Polls</div>
                </div>
              </div>
              <button className="gas-shop-btn">100 🪙</button>
            </div>

            <div className="gas-shop-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '32px', position: 'relative' }}>📘<span style={{ position: 'absolute', bottom: -5, right: -5, fontSize: '16px' }}>🤫</span></div>
                <div>
                  <div style={{ fontWeight: 800 }}>Put Your Name in<br/>Your Crush's Poll</div>
                  <div style={{ color: '#a1a1aa', fontSize: '12px' }}>Your name remains secret</div>
                </div>
              </div>
              <button className="gas-shop-btn">300 🪙</button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Paywall Modal */}
      {view === 'paywall' && (
        <div className="gas-shop-overlay" style={{ justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#111', color: '#fff', border: '2px solid #fbbf24', borderRadius: '24px', padding: '30px', textAlign: 'center', maxWidth: '350px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
             <h2 style={{ fontSize: '24px', margin: '0 0 20px' }}>See who likes you<br/>with ⚡ GOD MODE</h2>
             <div style={{ fontSize: '64px', marginBottom: '20px' }}>💌🔍</div>
             <p style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>Reveal 2 Names<br/>Per Week</p>
             <p style={{ color: '#fbbf24', fontWeight: '800', fontSize: '20px', margin: '20px 0' }}>₹99/month</p>
             <button className="gas-ob-white-btn" style={{ background: '#fbbf24', color: '#000', marginBottom: '15px' }} onClick={() => alert('Razorpay Initiated')}>Continue</button>
             <div style={{ color: '#a1a1aa', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setView('inbox')}>Maybe Later</div>
          </div>
        </div>
      )}
    </div>
  );
}