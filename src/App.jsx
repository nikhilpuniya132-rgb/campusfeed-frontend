import { useState } from 'react';
import confetti from 'canvas-confetti';

const API = '[https://campusfeed-backend-po4g.onrender.com/api](https://campusfeed-backend-po4g.onrender.com/api)';
const AVATARS = ['😎', '👽', '👻', '🤖', '👑', '🔥', '🦊', '🚀'];

export default function App() {
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('11');
  const [avatar, setAvatar] = useState('😎'); 
  const [refCode, setRefCode] = useState('');
  
  const [view, setView] = useState('poll'); 
  const [tab, setTab] = useState('11'); 
  
  const [currentPoll, setCurrentPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [invites, setInvites] = useState(0);

  const [profileData, setProfileData] = useState(null);
  const [bioInput, setBioInput] = useState('');
  const [instaInput, setInstaInput] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(''); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Photo must be under 2MB!");
    
    const reader = new FileReader();
    reader.onloadend = () => setProfileAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const login = async () => {
    if (!handle || !password) return alert('Enter a handle and password');
    try {
      const res = await fetch(`${API}/auth`, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ handle, password, grade, avatar, refCode })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Server Error');
      
      setUser(data.user);
      setTab(data.user.grade.toString());
      loadNextPoll(data.user.id, data.user.grade.toString());
    } catch (err) { alert("Network Error"); }
  };

  const loadNextPoll = async (userId, targetGrade) => {
    const res = await fetch(`${API}/play/${userId}?gradeFilter=${targetGrade}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await res.json();
    setCurrentPoll(data.poll);
    setOptions(data.options || []);
  };

  const castVote = async (receiverId) => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#3b82f6', '#f43f5e'] });
    await fetch(`${API}/vote`, {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ pollId: currentPoll.id, voterId: user.id, receiverId })
    });
    loadNextPoll(user.id, tab);
  };

  const loadInbox = async () => {
    setView('inbox');
    const res = await fetch(`${API}/inbox/${user.id}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await res.json();
    setInbox(data.messages || []);
    setInvites(data.invites || 0);
  };

  // NEW FUNCTION: Delete Notification
  const deleteNotification = async (voteId) => {
    try {
      await fetch(`${API}/inbox/${voteId}`, {
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      // Refresh inbox to show the item is gone
      loadInbox();
    } catch (err) {
      alert("Failed to delete notification");
    }
  };

  const loadProfile = async () => {
    setView('profile');
    const res = await fetch(`${API}/profile/${user.id}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await res.json();
    setProfileData(data);
    setBioInput(data.user.bio || '');
    setInstaInput(data.user.insta_id || '');
    setProfileAvatar(data.user.avatar || ''); 
  };

  const saveProfile = async () => {
    if (bioInput.trim().split(/\s+/).filter(Boolean).length > 50) return alert("Bio must be 50 words or less!");
    await fetch(`${API}/profile/edit`, {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ userId: user.id, bio: bioInput, instaId: instaInput, avatar: profileAvatar }) 
    });
    alert("Profile updated!");
    loadProfile();
  };

  const loadExplore = async () => {
    setView('explore');
    const res = await fetch(`${API}/explore/leaderboard`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await res.json();
    setLeaderboard(data.leaderboard || []);
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center' }}>
        <h1 style={{ textAlign: 'center', fontSize: '42px', fontWeight: '900' }}>Campus<span style={{color: '#3b82f6'}}>Feed</span></h1>
        <div className="card">
          <input className="input-field" placeholder="Handle" value={handle} onChange={e => setHandle(e.target.value)} autoComplete="off" />
          <input className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <input className="input-field" placeholder="Invite Code (Optional)" value={refCode} onChange={e => setRefCode(e.target.value)} autoComplete="off" />
          <select className="input-field" value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
          </select>
          <button className="btn-primary" onClick={login}>Enter Network 🚀</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="nav-bar">
        <button className={`nav-btn ${view === 'poll' ? 'active' : ''}`} onClick={() => { setView('poll'); loadNextPoll(user.id, tab); }}>🎮</button>
        <button className={`nav-btn ${view === 'inbox' ? 'active' : ''}`} onClick={loadInbox}>🔔</button>
        <button className={`nav-btn ${view === 'profile' ? 'active' : ''}`} onClick={loadProfile}>👤</button>
        <button className={`nav-btn ${view === 'explore' ? 'active' : ''}`} onClick={loadExplore}>🌍</button>
      </div>

      {view === 'poll' && (
        <div className="card">
          <div className="poll-question">"{currentPoll?.question}"</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {options.map(opt => (
              <button key={opt.id} className="btn-option" onClick={() => castVote(opt.id)}>
                {opt.handle}
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'inbox' && (
         <div>
         <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))' }}>
           <h3 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>Your Invite Code: <span style={{ color: '#60a5fa' }}>{user.invite_code}</span></h3>
         </div>
         
         {inbox.length === 0 ? <p style={{ textAlign: 'center', color: '#71717a' }}>No votes yet.</p> : inbox.map(vote => (
             
             <div key={vote.voteId} className="inbox-item" style={{ position: 'relative' }}>
               
               {/* NEW TRASH BUTTON */}
               <button 
                 onClick={() => deleteNotification(vote.voteId)} 
                 style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                 title="Delete Notification"
               >
                 🗑️
               </button>

               <p style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '900', color: '#fff' }}>"{vote.question}"</p>
               
               <p style={{ margin: '0 0 12px 0', color: '#a1a1aa' }}>Voted by: <strong style={{ color: vote.voterHandle ? '#3b82f6' : '#fff' }}>{vote.voterHandle || '???'}</strong></p>
             </div>
           ))}
       </div>
      )}

      {view === 'profile' && profileData && (
        <div className="card">
          <h2>@{profileData.user.handle}</h2>
          <textarea value={bioInput} onChange={(e) => setBioInput(e.target.value)} placeholder="Write a bio..." className="input-field" />
          <button onClick={saveProfile} className="btn-primary">Save Profile</button>
        </div>
      )}

      {view === 'explore' && (
        <div>
          <h2>🏆 School Leaderboard</h2>
          <div className="card">
            {leaderboard.map((leader, index) => (
              <div key={leader.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #27272a' }}>
                <span>#{index + 1} @{leader.handle}</span>
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{leader.total_votes} Votes</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}