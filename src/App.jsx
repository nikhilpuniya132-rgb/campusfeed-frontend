import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

const API = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://campusfeed-backend-po4g.onrender.com/api';
const RAZORPAY_KEY_ID = 'rzp_test_YOUR_ACTUAL_TEST_KEY_ID'; // Keep your real key here

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

  const [currentPoll, setCurrentPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoadingPoll, setIsLoadingPoll] = useState(false); 
  
  const [inbox, setInbox] = useState([]);
  const [canRevealNames, setCanRevealNames] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null); 

  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  useEffect(() => {
    if (!document.getElementById('razorpay-sdk')) {
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
    }
  }, []);

  const renderProfilePic = (pic, ava, isPro, size = 100) => (
    <div style={{ position: 'relative', display: 'inline-block', margin: '0 auto 15px' }}>
      {pic ? (
        <img src={pic} alt="profile" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: isPro ? '4px solid #fbbf24' : 'none' }} />
      ) : (
        <div style={{ fontSize: `${size * 0.6}px`, width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', border: isPro ? '4px solid #fbbf24' : 'none', borderRadius: '50%', background: '#27272a' }}>{ava}</div>
      )}
      {isPro && <div style={{ position: 'absolute', bottom: -5, right: '50%', transform: 'translateX(50%)', fontSize: `${size * 0.25}px` }}>⭐</div>}
    </div>
  );

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
    if (newView === 'inbox') fetch(`${API}/inbox/${user.id}`).then(r => r.json()).then(d => { setInbox(d.messages || []); setCanRevealNames(d.canReveal); });
    if (newView === 'explore') fetch(`${API}/explore/leaderboard`).then(r => r.json()).then(d => setLeaderboard(d.leaderboard || []));
    if (newView === 'profile') fetch(`${API}/profile/${user.id}`).then(r => r.json()).then(d => { setProfileData(d); setEditBio(d.user.bio || ''); setEditAvatar(d.user.avatar || ''); });
  };

  const saveProfile = async () => {
    setIsEditing(false);
    const updatedUser = { ...profileData.user, bio: editBio, avatar: editAvatar };
    setProfileData({ user: updatedUser }); 
    setUser({ ...user, avatar: editAvatar });
    await fetch(`${API}/profile/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bio: editBio, avatar: editAvatar }) });
  };

  const deleteAccount = async () => {
    const pass = prompt('Warning: This is permanent. Enter your password to delete your account:');
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
          if ((await verifyRes.json()).success) { alert('👑 God Mode Unlocked!'); setUser({ ...user, is_pro: true }); handleNav('inbox'); }
        }, theme: { color: '#fbbf24' }
      };
      new window.Razorpay(options).open();
    } catch (e) { alert('Checkout error.'); }
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center' }}>
        <h1 style={{ textAlign: 'center', fontSize: '42px', fontWeight: '900' }}>Campus<span style={{ color: '#3b82f6' }}>Feed</span></h1>
        <div className="card">
          <input className="input-field" placeholder="Handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <input className="input-field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <select className="input-field" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
          </select>
          <button className="btn-primary" onClick={login}>{isAuthenticating ? 'Loading...' : 'Enter Network 🚀'}</button>
        </div>
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
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
            <button className="btn-primary" style={{ flex: 1, background: gradeFilter !== 'all' ? '#3b82f6' : '#27272a' }} onClick={() => loadNextPoll(user.grade.toString())}>My Class</button>
            <button className="btn-primary" style={{ flex: 1, background: gradeFilter === 'all' ? '#8b5cf6' : '#27272a' }} onClick={() => loadNextPoll('all')}>Whole School</button>
          </div>
          <div className="card">
            {isLoadingPoll ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#a1a1aa' }}><h3>Loading next scenario... ⚡</h3></div>
            ) : hasVoted ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <h2 style={{ color: '#10b981' }}>Vote Sent! 🚀</h2>
                <button className="btn-primary" onClick={() => loadNextPoll(gradeFilter)} style={{ marginTop: '20px' }}>Next Question ➔</button>
              </div>
            ) : (
              <>
                <div className="poll-question">"{currentPoll?.question || 'No more questions!'}"</div>
                {options.length === 0 ? (
                  <p style={{ color: '#ef4444', textAlign: 'center', margin: '20px 0' }}>Not enough classmates in this filter! Invite friends to keep playing.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {options.map((opt) => (
                      <button key={opt.id} className="btn-option" onClick={() => castVote(opt.id)}>
                        {opt.profile_pic ? <img src={opt.profile_pic} alt="" style={{ width: 30, height: 30, borderRadius: '50%', marginRight: 8 }} /> : opt.avatar}
                        {opt.handle}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => loadNextPoll(gradeFilter)} style={{ background: 'transparent', color: '#a1a1aa', border: 'none', marginTop: '20px', width: '100%', cursor: 'pointer' }}>Skip Question</button>
              </>
            )}
          </div>
        </div>
      )}

      {view === 'explore' && (
        <div>
          <h2>🏆 Leaderboard</h2>
          <input className="input-field" placeholder="Search handles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: '15px' }} />
          <div className="card">
            {leaderboard.filter(u => u.handle.toLowerCase().includes(searchQuery.toLowerCase())).map((leader, index) => (
              <div key={leader.id} onClick={() => loadPublicProfile(leader.id)} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #27272a', cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  #{index + 1} {renderProfilePic(leader.profile_pic, leader.avatar, leader.is_pro, 32)}
                  <span style={{ color: leader.is_pro ? '#fbbf24' : '#fff' }}>@{leader.handle}</span>
                </span>
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{leader.total_votes}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'publicProfile' && (
        <div className="card" style={{ textAlign: 'center' }}>
          {publicProfile ? (
            <>
              {renderProfilePic(publicProfile.profile_pic, publicProfile.avatar, publicProfile.is_pro, 120)}
              <h2 style={{ color: publicProfile.is_pro ? '#fbbf24' : '#fff', margin: '10px 0' }}>@{publicProfile.handle}</h2>
              <p style={{ color: '#a1a1aa', margin: '0 0 15px 0' }}>{publicProfile.bio || 'No bio yet.'}</p>
              <p style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '20px' }}>Total Votes: {publicProfile.total_votes}</p>
              
              <button className="btn-primary" onClick={() => alert('Anonymous Ping Sent! 🔔')} style={{ background: '#8b5cf6', marginBottom: '10px' }}>Send Anonymous Ping</button>
              <button className="btn-primary" onClick={() => handleNav('explore')} style={{ background: '#3f3f46' }}>Back to Leaderboard</button>
            </>
          ) : <p style={{ color: '#a1a1aa' }}>Loading profile...</p>}
        </div>
      )}

      {view === 'profile' && profileData && (
        <div className="card" style={{ textAlign: 'center' }}>
          {renderProfilePic(profileData.user.profile_pic, profileData.user.avatar, profileData.user.is_pro, 120)}
          <h2 style={{ color: profileData.user.is_pro ? '#fbbf24' : '#fff', margin: '10px 0' }}>@{profileData.user.handle}</h2>
          
          {isEditing ? (
            <div>
              <input className="input-field" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} placeholder="Avatar Emoji" maxLength={2} style={{ width: '60px', display: 'inline-block', marginBottom: '10px' }} />
              <textarea className="input-field" value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Write a bio..." rows={3} />
              <button className="btn-primary" onClick={saveProfile}>Save Profile</button>
            </div>
          ) : (
            <div>
              <p style={{ color: '#a1a1aa', margin: '0 0 15px 0' }}>{profileData.user.bio || 'No bio yet.'}</p>
              <p style={{ color: '#a1a1aa', marginBottom: '20px' }}>Total Votes Received: {profileData.user.total_votes}</p>
              <button className="btn-primary" onClick={() => setIsEditing(true)} style={{ background: '#3f3f46' }}>Edit Profile</button>
              <button className="btn-primary" onClick={deleteAccount} style={{ background: '#ef4444', marginTop: '10px' }}>Delete Account</button>
            </div>
          )}
        </div>
      )}

      {view === 'pro' && (
        <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(145deg, #1f1f22, #2a2015)', border: '1px solid #fbbf24' }}>
          <h1 style={{ fontSize: '40px', margin: '0' }}>👑</h1>
          <h2 style={{ color: '#fbbf24' }}>{user.is_pro ? 'God Mode Active' : 'Unlock God Mode'}</h2>
          {!user.is_pro && <button className="btn-primary" style={{ background: '#fbbf24', color: '#000', marginTop: '20px' }} onClick={handleUpgrade}>Upgrade Now - ₹99</button>}
        </div>
      )}

      {view === 'inbox' && (
        <div>
          <div className="card" style={{ padding: '20px', textAlign: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: user.is_pro ? '#fbbf24' : '#fff' }}>{user.is_pro ? '👑 Names Revealed' : '🔒 Names Hidden'}</h3>
          </div>
          {inbox.map((vote) => (
            <div key={vote.voteId} className="card" style={{ marginBottom: '10px', padding: '15px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '18px' }}>"{vote.question}"</p>
              <p style={{ margin: 0, color: '#a1a1aa' }}>Voted by: {vote.voterHandle ? <strong style={{ color: '#fbbf24' }}>{vote.voterAvatar} @{vote.voterHandle}</strong> : <span style={{ color: '#ef4444' }}>🔒 Hidden</span>}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}