import { useState } from 'react';
import confetti from 'canvas-confetti';

const API = 'https://backfire-decrease-festivity.ngrok-free.dev/api';
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

  const shuffleQuestion = async () => {
    const res = await fetch(`${API}/shuffle/poll`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await res.json();
    setCurrentPoll(data.poll);
  };

  const shuffleOptions = async (targetGrade) => {
    const res = await fetch(`${API}/shuffle/options/${user.id}?gradeFilter=${targetGrade}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await res.json();
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
    setInbox(data.messages);
    setInvites(data.invites);
  };

  const handleRadarGuess = async (voteId, guessedHandle) => {
    const res = await fetch(`${API}/radar/guess`, {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ voteId, guessedHandle, userId: user.id })
    });
    const data = await res.json();
    alert(data.message);
    if (data.match) loadInbox();
  };

  const sendFistBump = async (voteId) => {
    await fetch(`${API}/fistbump`, {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ voteId, senderId: user.id })
    });
    alert("Fist bump sent! 👊");
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

  const toggleSaveVote = async (voteId, isSaved) => {
    await fetch(`${API}/vote/${voteId}/save`, {
      method: 'PUT', 
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ isSaved: !isSaved })
    });
    loadProfile(); 
  };

  const deleteVote = async (voteId) => {
    await fetch(`${API}/vote/${voteId}`, { 
      method: 'DELETE',
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    loadProfile(); 
  };

  const loadExplore = async () => {
    setView('explore');
    const res = await fetch(`${API}/explore/leaderboard`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await res.json();
    setLeaderboard(data.leaderboard);
  };

  const handleSearch = async (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length < 2) return setSearchResults([]);
    const res = await fetch(`${API}/search?q=${e.target.value}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const data = await res.json();
    setSearchResults(data.results);
  };

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center' }}>
        <h1 style={{ textAlign: 'center', fontSize: '42px', fontWeight: '900' }}>Campus<span style={{color: '#3b82f6'}}>Feed</span></h1>
        <div className="card">
          <input className="input-field" placeholder="Handle (e.g. nikhil_puniya)" value={handle} onChange={e => setHandle(e.target.value)} autoComplete="off" />
          <input className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <input className="input-field" placeholder="Invite Code (Optional)" value={refCode} onChange={e => setRefCode(e.target.value)} autoComplete="off" />
          <select className="input-field" value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
          </select>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', margin: '15px 0' }}>
            {AVATARS.map(emoji => (
              <button 
                key={emoji} 
                onClick={() => setAvatar(emoji)} 
                style={{ fontSize: '30px', background: avatar === emoji ? '#3b82f6' : 'transparent', border: 'none', borderRadius: '50%', cursor: 'pointer' }}
              >
                {emoji}
              </button>
            ))}
          </div>

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
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button className={`nav-btn ${tab === user.grade.toString() ? 'active' : ''}`} onClick={() => { setTab(user.grade.toString()); shuffleOptions(user.grade.toString()); }}>My Class</button>
            <button className={`nav-btn ${tab === 'all' ? 'active' : ''}`} onClick={() => { setTab('all'); shuffleOptions('all'); }}>Whole School</button>
          </div>
          {options && options.length >= 4 ? (
            <div className="card">
              <div className="poll-question">"{currentPoll?.question}"</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {options.map(opt => (
                  <button key={opt.id} className="btn-option" onClick={() => castVote(opt.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
                    
                    {opt.avatar && (opt.avatar.startsWith('data:') || opt.avatar.startsWith('http')) ? (
                      <img src={opt.avatar} alt={opt.handle} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} />
                    ) : (
                      <span style={{ fontSize: '40px', marginBottom: '10px' }}>{opt.avatar || '👤'}</span>
                    )}

                    <span>{opt.handle}</span>
                    {tab === 'all' && <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Class {opt.grade}</span>}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button onClick={shuffleQuestion} style={{ flex: 1, padding: '16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#a1a1aa', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>🔀 Question</button>
                <button onClick={() => shuffleOptions(tab)} style={{ flex: 1, padding: '16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#a1a1aa', borderRadius: '12px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>🔀 Names</button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '40px 20px', marginTop: '20px' }}>
              <span style={{ fontSize: '48px' }}>🚷</span>
              <h2 style={{ margin: '16px 0 8px 0', color: '#fff' }}>Not Enough Students</h2>
              <p style={{ color: '#a1a1aa' }}>Need 4 people in {tab === 'all' ? 'school' : `Class ${tab}`} to generate a poll.</p>
            </div>
          )}
        </>
      )}

      {view === 'inbox' && (
         <div>
         <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
           <h3 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>Your Invite Code: <span style={{ color: '#60a5fa' }}>{user.inviteCode}</span></h3>
           <p style={{ margin: 0, color: '#94a3b8' }}>You have {invites} invites.</p>
         </div>
         {inbox.length === 0 ? <p style={{ textAlign: 'center', color: '#71717a' }}>No votes yet.</p> : inbox.map(vote => (
             <div key={vote.voteId} className="inbox-item">
               <p style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '900', color: '#fff' }}>"{vote.question}"</p>
               {vote.status === 'matched' ? (
                 <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                   <p style={{ color: '#34d399', margin: 0, fontWeight: '900' }}>🔥 MUTUAL MATCH!</p>
                   <p style={{ color: '#fff', margin: '4px 0 0 0' }}>You and @{vote.voterHandle} like each other.</p>
                 </div>
               ) : vote.isCrush ? (
                 <div style={{ background: 'rgba(244, 63, 94, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                   <p style={{ color: '#fb7185', fontWeight: '900' }}>🔒 CRUSH RADAR ACTIVE</p>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                     {vote.radarOptions?.map(opt => <button key={opt} className="radar-btn" onClick={() => handleRadarGuess(vote.voteId, opt)}>{opt}</button>)}
                   </div>
                 </div>
               ) : (
                 <div>
                   <p style={{ margin: '0 0 12px 0', color: '#a1a1aa' }}>Voted by: <strong style={{ color: vote.voterHandle ? '#3b82f6' : '#fff' }}>{vote.voterHandle || '??? (Need 1 Invite to unlock)'}</strong></p>
                   {vote.voterHandle && <button onClick={() => sendFistBump(vote.voteId)} style={{ background: '#27272a', color: '#fff', border: '1px solid #3f3f46', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>👊 Send Fist Bump</button>}
                 </div>
               )}
             </div>
           ))}
       </div>
      )}

      {view === 'profile' && profileData && (
        <div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {profileAvatar && (profileAvatar.startsWith('data:') || profileAvatar.startsWith('http')) ? (
              <img src={profileAvatar} alt="avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} />
            ) : (
              <span style={{ fontSize: '64px', marginBottom: '10px' }}>{profileAvatar || '👤'}</span>
            )}
            
            <label style={{ color: '#a1a1aa', fontSize: '13px', marginBottom: '5px' }}>Change Photo:</label>
            <input type="file" accept="image/*" onChange={handleProfileImageUpload} style={{ color: '#fff', fontSize: '13px', width: '100%', marginBottom: '15px' }} />

            <h2 style={{ margin: '0 0 5px 0' }}>@{profileData.user.handle}</h2>
            <p style={{ color: '#a1a1aa', margin: '0 0 20px 0' }}>Class {profileData.user.grade}</p>
            <textarea value={bioInput} onChange={(e) => setBioInput(e.target.value)} placeholder="Write a bio (max 50 words)..." style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: '#fff', borderRadius: '12px', padding: '12px', marginBottom: '10px' }} />
            <input value={instaInput} onChange={(e) => setInstaInput(e.target.value)} placeholder="Instagram (e.g., @nikhil)" style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', color: '#fff', borderRadius: '12px', padding: '12px', marginBottom: '15px' }} />
            <button onClick={saveProfile} style={{ background: '#3b82f6', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Update Profile</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#a1a1aa', fontSize: '14px' }}>TOTAL VOTES</h3>
              <p style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>{profileData.totalVotes}</p>
            </div>
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#a1a1aa', fontSize: '14px' }}>TOP POLL</h3>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{profileData.topPoll ? `"${profileData.topPoll.question}"` : 'No votes yet'}</p>
            </div>
          </div>
          
          <h3 style={{ color: '#fff', marginBottom: '15px' }}>Your Voting History (30 Days)</h3>
          {profileData.history.length === 0 ? <p style={{ color: '#a1a1aa', textAlign: 'center' }}>You haven't voted for anyone recently.</p> : profileData.history.map(hist => (
              <div key={hist.id} className="inbox-item">
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>You voted @{hist.receiver_handle} for:</p>
                <p style={{ margin: '0 0 15px 0', color: '#a1a1aa' }}>"{hist.question}"</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => toggleSaveVote(hist.id, hist.is_saved)} style={{ background: hist.is_saved ? '#10b981' : '#27272a', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>{hist.is_saved ? '✅ Saved' : '💾 Save'}</button>
                  <button onClick={() => deleteVote(hist.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Delete</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {view === 'explore' && (
        <div>
          <input type="text" placeholder="Search users..." value={searchQuery} onChange={handleSearch} className="input-field" />
          {searchResults.length > 0 && (
            <div className="card" style={{ padding: '15px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>Search Results</h3>
              {searchResults.map(res => (
                <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #27272a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    
                    {res.avatar && (res.avatar.startsWith('data:') || res.avatar.startsWith('http')) ? (
                      <img src={res.avatar} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '24px' }}>{res.avatar || '👤'}</span>
                    )}

                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>@{res.handle}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#a1a1aa' }}>Class {res.grade}</p>
                    </div>
                  </div>
                  {res.insta_id && (
                    <button onClick={() => window.open(`https://instagram.com/${res.insta_id.replace('@', '')}`, '_blank')} style={{ background: '#e1306c', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Message</button>
                  )}
                </div>
              ))}
            </div>
          )}
          <h2 style={{ color: '#fff', marginBottom: '15px' }}>🏆 School Leaderboard</h2>
          <div className="card" style={{ padding: '10px' }}>
            {leaderboard.map((leader, index) => (
              <div key={leader.id} style={{ display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #27272a' }}>
                <span style={{ fontSize: '20px', fontWeight: '900', color: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#fff', width: '30px' }}>#{index + 1}</span>
                
                {leader.avatar && (leader.avatar.startsWith('data:') || leader.avatar.startsWith('http')) ? (
                  <img src={leader.avatar} alt="avatar" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', margin: '0 15px' }} />
                ) : (
                  <span style={{ fontSize: '32px', margin: '0 15px' }}>{leader.avatar || '👤'}</span>
                )}

                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>@{leader.handle}</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#a1a1aa' }}>Class {leader.grade}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: '900', fontSize: '20px', color: '#3b82f6' }}>{leader.total_votes}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#a1a1aa' }}>Votes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}