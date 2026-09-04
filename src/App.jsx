import { useState } from 'react';
import confetti from 'canvas-confetti';
import { SwipeableList, SwipeableListItem, SwipeAction, TrailingActions, LeadingActions } from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';

const API = 'https://campusfeed-backend-po4g.onrender.com/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState('11');
  const [avatar, setAvatar] = useState('😎'); 
  const [refCode, setRefCode] = useState('');
  
  const [profilePic, setProfilePic] = useState('');
  
  const [view, setView] = useState('poll'); 
  const [tab, setTab] = useState('11'); 
  
  const [currentPoll, setCurrentPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [invites, setInvites] = useState(0);

  const [profileData, setProfileData] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [bioInput, setBioInput] = useState('');
  const [instaInput, setInstaInput] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Photo must be under 2MB!");
    const reader = new FileReader();
    reader.onloadend = () => setProfilePic(reader.result);
    reader.readAsDataURL(file);
  };

  const login = async () => {
    if (!handle || !password) return alert('Enter a handle and password');
    try {
      const res = await fetch(`${API}/auth`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`${API}/play/${userId}?gradeFilter=${targetGrade}`);
    const data = await res.json();
    setCurrentPoll(data.poll);
    setOptions(data.options || []);
  };

  const castVote = async (receiverId) => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    await fetch(`${API}/vote`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId: currentPoll.id, voterId: user.id, receiverId })
    });
    loadNextPoll(user.id, tab);
  };

  const loadInbox = async () => {
    setView('inbox');
    const res = await fetch(`${API}/inbox/${user.id}`);
    const data = await res.json();
    setInbox(data.messages || []);
    setInvites(data.invites || 0);
  };

  const deleteNotification = async (voteId) => {
    await fetch(`${API}/inbox/${voteId}`, { method: 'DELETE' });
    setInbox(inbox.filter(msg => msg.voteId !== voteId));
  };

  const saveNotification = async (voteId) => {
    await fetch(`${API}/inbox/${voteId}/save`, { method: 'PUT' });
    setInbox(inbox.map(msg => msg.voteId === voteId ? { ...msg, isSaved: true } : msg));
  };

  const loadProfile = async () => {
    setView('profile');
    const res = await fetch(`${API}/profile/${user.id}`);
    const data = await res.json();
    setProfileData(data);
    setBioInput(data.user.bio || '');
    setInstaInput(data.user.instagram_handle || '');
    setProfilePic(''); 
  };

  const loadPublicProfile = async (userId) => {
    setView('publicProfile');
    const res = await fetch(`${API}/profile/public/${userId}`);
    const data = await res.json();
    setPublicProfile(data.user);
  };

  const saveProfile = async () => {
    await fetch(`${API}/profile/edit`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: user.id, 
        bio: bioInput, 
        instaId: instaInput, 
        avatar: profileData.user.avatar,
        profilePic: profilePic || profileData.user.profile_pic
      }) 
    });
    alert("Profile updated!");
    loadProfile();
  };

  const loadExplore = async () => {
    setView('explore');
    const res = await fetch(`${API}/explore/leaderboard`);
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

  const renderLeadingActions = (id) => (
    <LeadingActions>
      <SwipeAction onClick={() => saveNotification(id)}>
        <div style={{ background: '#10b981', color: 'white', padding: '20px', display: 'flex', alignItems: 'center', height: '100%' }}>Save</div>
      </SwipeAction>
    </LeadingActions>
  );

  const renderTrailingActions = (id) => (
    <TrailingActions>
      <SwipeAction destructive={true} onClick={() => deleteNotification(id)}>
        <div style={{ background: '#ef4444', color: 'white', padding: '20px', display: 'flex', alignItems: 'center', height: '100%' }}>Delete</div>
      </SwipeAction>
    </TrailingActions>
  );

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
                {opt.profile_pic ? <img src={opt.profile_pic} style={{width: 30, height: 30, objectFit: 'cover', borderRadius: '50%', marginRight: 8}} /> : opt.avatar}
                {opt.handle}
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'inbox' && (
         <div>
         <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
           <h3>Your Invite Code: <span style={{ color: '#60a5fa' }}>{user.invite_code}</span></h3>
         </div>
         
         <SwipeableList>
           {inbox.map(vote => (
             <SwipeableListItem
               key={vote.voteId}
               leadingActions={renderLeadingActions(vote.voteId)}
               trailingActions={renderTrailingActions(vote.voteId)}
             >
               <div className="inbox-item" style={{ width: '100%', border: vote.isSaved ? '2px solid #10b981' : 'none' }}>
                 <p style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#fff' }}>"{vote.question}"</p>
                 <p style={{ margin: '0 0 12px 0', color: '#a1a1aa' }}>Voted by: <strong style={{ color: '#3b82f6' }}>{vote.voterHandle || '???'}</strong></p>
               </div>
             </SwipeableListItem>
           ))}
         </SwipeableList>
       </div>
      )}

      {view === 'explore' && (
        <div>
          <h2>🏆 School Leaderboard</h2>
          <div className="card">
            {leaderboard.map((leader, index) => (
              <div 
                key={leader.id} 
                onClick={() => loadPublicProfile(leader.id)}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #27272a', cursor: 'pointer', alignItems: 'center' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  #{index + 1} 
                  {leader.profile_pic ? <img src={leader.profile_pic} style={{width: 24, height: 24, objectFit: 'cover', borderRadius:'50%'}}/> : leader.avatar} 
                  @{leader.handle}
                </span>
                <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{leader.total_votes} Votes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'publicProfile' && publicProfile && (
        <div className="card" style={{ textAlign: 'center' }}>
          {publicProfile.profile_pic ? (
             <img src={publicProfile.profile_pic} style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 15px', objectFit: 'cover' }} />
          ) : (
             <div style={{ fontSize: '60px', margin: '0 auto 15px' }}>{publicProfile.avatar}</div>
          )}
          <h2>@{publicProfile.handle}</h2>
          <p style={{ color: '#a1a1aa', margin: '15px 0' }}>{publicProfile.bio || "No bio yet."}</p>
          <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>Total Votes: {publicProfile.total_votes}</p>
          
          {publicProfile.instagram_handle && (
            <a 
              href={`https://ig.me/m/${publicProfile.instagram_handle.replace('@', '')}`} 
              target="_blank" 
              rel="noreferrer"
              className="btn-primary"
              style={{ display: 'inline-block', textDecoration: 'none' }}
            >
              Message on Instagram
            </a>
          )}
        </div>
      )}

      {view === 'profile' && profileData && (
        <div className="card" style={{ textAlign: 'center' }}>
          {profilePic || profileData.user.profile_pic ? (
             <img src={profilePic || profileData.user.profile_pic} style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 15px', display: 'block', objectFit: 'cover' }} />
          ) : (
             <div style={{ fontSize: '60px', margin: '0 auto 15px' }}>{profileData.user.avatar}</div>
          )}
          
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginBottom: '20px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
          
          <h2>@{profileData.user.handle}</h2>
          
          <input value={instaInput} onChange={(e) => setInstaInput(e.target.value)} placeholder="Instagram Handle (e.g. @nikhil)" className="input-field" style={{ marginBottom: '10px' }} />
          <textarea value={bioInput} onChange={(e) => setBioInput(e.target.value)} placeholder="Write a bio..." className="input-field" style={{ minHeight: '80px', marginBottom: '15px' }} />
          
          <button onClick={saveProfile} className="btn-primary">Save Profile</button>
        </div>
      )}
    </div>
  );
}