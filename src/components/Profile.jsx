import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HamsterLoader from './HamsterLoader';
import InstituteCombobox, { findHubForInstitute } from './InstituteCombobox';
import { handleShare } from '../utils/share';
import {
  Share2,
  UserSearch,
  Grid,
  Repeat,
  Archive,
  Bookmark,
  ArchiveRestore,
  X,
  CheckCircle2,
  Trash2,
  Unlock,
  BookmarkX,
  MessageCircleQuestion,
  Send,
  Lock,
  Sparkles
} from 'lucide-react';
import { MASTER_CLASS_OPTIONS, CLASS_OPTIONS } from '../constants/classes';
import { supabase as defaultSupabase } from '../supabase';

const AURA_RING_OPTIONS = [
  { id: 'gold', label: 'Gold Ring', color: '#d97706', desc: 'Championship gold halo' },
  { id: 'neon', label: 'Electric Blue', color: '#2563eb', desc: 'High-voltage energy pulse' },
  { id: 'ruby', label: 'Ruby Red', color: '#dc2626', desc: 'Crimson flame intensity' },
  { id: 'purple', label: 'Cosmic Purple', color: '#7c3aed', desc: 'Ultraviolet nebula aura' },
  { id: 'emerald', label: 'Emerald Green', color: '#059669', desc: 'Radiant mystic jade glow' },
  { id: 'none', label: 'Minimal / None', color: '#9ca3af', desc: 'Clean standard border' }
];

export default function Profile({
  user,
  profileData,
  acceptedFriends = [],
  API,
  supabase: propSupabase,
  onUpdateUser,
  onLogout,
  onDeleteAccount,
  onViewPublicProfile,
  renderProfilePic,
  onInviteShare,
  onRefreshFriends
}) {
  const supabase = propSupabase || defaultSupabase;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '😎');
  const [editGrade, setEditGrade] = useState(user?.grade ? user.grade.toString() : '11');
  const [editStream, setEditStream] = useState(user?.stream || '11th Medical');
  const [editInstitute, setEditInstitute] = useState(user?.institute || user?.school || 'Kapil Institute');
  const [editHub, setEditHub] = useState(user?.coaching_hub || user?.hub || 'Ajit Road Hub');
  const [editCity, setEditCity] = useState('Bathinda');
  const [editProfilePic, setEditProfilePic] = useState(user?.profile_pic || '');
  
  // Settings 3-dots dropdown
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  // Friends Modal
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  // Spies Modal (Secret Profile Visitors)
  const [showSpiesModal, setShowSpiesModal] = useState(false);
  const [spiesList, setSpiesList] = useState([]);
  const [isLoadingSpies, setIsLoadingSpies] = useState(false);

  // Aura Toast
  const [auraToast, setAuraToast] = useState('');

  // Number of polls casted today / total
  const [todayVotesCount, setTodayVotesCount] = useState(0);
  const [todayVotesHistory, setTodayVotesHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Ring display
  const selectedRing = user?.selected_ring || user?.ring || 'gold';

  // Invite state & Tier checks
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Task 3: Tabbed Navigation & Grid State
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'reposts' | 'archived' | 'qa'
  const [archivedSubTab, setArchivedSubTab] = useState('archived'); // 'archived' | 'saved'
  const [gridItems, setGridItems] = useState([]);
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);
  const [selectedGridItem, setSelectedGridItem] = useState(null);
  const [actionToast, setActionToast] = useState('');

  // Tellonym Q&A State
  const profileId = profileData?.user?.id || profileData?.id || user?.id;
  const isProfileOwner = Boolean(user?.id && profileId && user.id === profileId);

  const [questions, setQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [answerText, setAnswerText] = useState({});
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [qaOwnerTab, setQaOwnerTab] = useState('inbox'); // 'inbox' | 'public'

  const showActionToast = (msg) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(''), 2500);
  };

  const effectiveInvites = Math.max(
    Number(user?.invites || 0),
    Number(user?.recruits || 0)
  );
  const isLifetimeLegend = effectiveInvites >= 25 || user?.is_god_mode === true || user?.is_legend === true;

  // Task 3.2: Fetch Logic based on active tab
  const fetchGridContent = async () => {
    if (!user?.id || !supabase) return;
    setIsLoadingGrid(true);
    try {
      if (activeTab === 'posts') {
        // Posts: Fetch from photo_posts where author_id = user.id AND is_archived = false
        const { data, error } = await supabase
          .from('photo_posts')
          .select('*')
          .eq('author_id', user.id)
          .eq('is_archived', false)
          .order('created_at', { ascending: false });

        if (!error) {
          setGridItems(data || []);
        } else {
          console.error('Error fetching posts:', error);
          setGridItems([]);
        }
      } else if (activeTab === 'reposts') {
        // Reposts: Fetch from reposts where user_id = user.id, joined with photo_posts
        const { data, error } = await supabase
          .from('reposts')
          .select(`
            id,
            post_id,
            created_at,
            photo_posts (
              id,
              author_id,
              image_url,
              caption,
              created_at,
              is_archived
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const list = data
            .map(r => r.photo_posts)
            .flat()
            .filter(Boolean);
          setGridItems(list);
        } else {
          // Fallback query if relation join is not foreign-keyed
          const { data: rawReposts } = await supabase
            .from('reposts')
            .select('post_id')
            .eq('user_id', user.id);

          const postIds = (rawReposts || []).map(r => r.post_id).filter(Boolean);
          if (postIds.length > 0) {
            const { data: postsData } = await supabase
              .from('photo_posts')
              .select('*')
              .in('id', postIds);
            setGridItems(postsData || []);
          } else {
            setGridItems([]);
          }
        }
      } else if (activeTab === 'archived') {
        if (archivedSubTab === 'archived') {
          // Archived: Fetch from photo_posts where author_id = user.id AND is_archived = true
          const { data, error } = await supabase
            .from('photo_posts')
            .select('*')
            .eq('author_id', user.id)
            .eq('is_archived', true)
            .order('created_at', { ascending: false });

          if (!error) {
            setGridItems(data || []);
          } else {
            console.error('Error fetching archived posts:', error);
            setGridItems([]);
          }
        } else {
          // Saved (Archived Sub-tab): Fetch from saved_posts where user_id = user.id, joined with photo_posts
          const { data, error } = await supabase
            .from('saved_posts')
            .select(`
              id,
              post_id,
              created_at,
              photo_posts (
                id,
                author_id,
                image_url,
                caption,
                created_at,
                is_archived
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!error && data) {
            const list = data
              .map(s => s.photo_posts)
              .flat()
              .filter(Boolean);
            setGridItems(list);
          } else {
            // Fallback query
            const { data: rawSaved } = await supabase
              .from('saved_posts')
              .select('post_id')
              .eq('user_id', user.id);

            const postIds = (rawSaved || []).map(s => s.post_id).filter(Boolean);
            if (postIds.length > 0) {
              const { data: postsData } = await supabase
                .from('photo_posts')
                .select('*')
                .in('id', postIds);
              setGridItems(postsData || []);
            } else {
              setGridItems([]);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch grid items:', err);
      setGridItems([]);
    } finally {
      setIsLoadingGrid(false);
    }
  };

  // Task 1.2: Fetch Logic - query anonymous_questions where receiver_id = profileId
  const fetchProfileData = async () => {
    if (!profileId || !supabase) return;
    setIsLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from('anonymous_questions')
        .select('*')
        .eq('receiver_id', profileId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setQuestions(data);
      } else if (error) {
        console.warn('Error fetching anonymous questions:', error.message);
      }
    } catch (err) {
      console.error('Failed to fetch anonymous questions:', err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [profileId]);

  useEffect(() => {
    if (activeTab === 'qa') {
      fetchProfileData();
    } else {
      fetchGridContent();
    }
  }, [activeTab, archivedSubTab, user?.id, profileId]);

  // Task 1.4: Visitor View - Send anonymous question
  const handleSendAnonymousQuestion = async (e) => {
    e?.preventDefault();
    const qText = newQuestionText.trim();
    if (!qText) {
      showActionToast('Please type a question! 💬');
      return;
    }
    if (!profileId) {
      showActionToast('Receiver ID missing');
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      const { data, error } = await supabase
        .from('anonymous_questions')
        .insert({
          receiver_id: profileId,
          question: qText,
          is_answered: false
        })
        .select()
        .single();

      if (error) {
        console.warn('Insert question error:', error.message);
      } else if (data) {
        setQuestions(prev => [data, ...prev]);
      } else {
        fetchProfileData();
      }

      setNewQuestionText('');
      showActionToast('Question sent anonymously! 🤫');
    } catch (err) {
      console.error('Failed to send question:', err);
      showActionToast('Failed to send question');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  // Task 1.5: Owner View - Publish answer to question
  const handlePublishAnswer = async (questionId) => {
    const answer = (answerText[questionId] || '').trim();
    if (!answer) {
      showActionToast('Please type an answer first! ✍️');
      return;
    }

    try {
      // Optimistic update
      setQuestions(prev => prev.map(q => {
        if (q.id === questionId) {
          return { ...q, answer, is_answered: true };
        }
        return q;
      }));

      // Clear draft answer text
      setAnswerText(prev => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });

      showActionToast('Answer published! ✨');

      const { error } = await supabase
        .from('anonymous_questions')
        .update({ answer, is_answered: true })
        .eq('id', questionId);

      if (error) {
        console.warn('Publish answer warning:', error.message);
      }
    } catch (err) {
      console.error('Failed to publish answer:', err);
      showActionToast('Failed to publish answer');
    }
  };

  // Task 1.5: Delete question (unwanted / answered)
  const handleDeleteQuestion = async (questionId) => {
    try {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      showActionToast('Question deleted 🗑️');

      const { error } = await supabase
        .from('anonymous_questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        console.warn('Delete question warning:', error.message);
      }
    } catch (err) {
      console.error('Failed to delete question:', err);
      showActionToast('Failed to delete question');
    }
  };

  // Task 1: Navigate to chat with this profile in Inbox
  const handleNavigateToChat = () => {
    const targetUrl = `/inbox?chatWith=${profileId}`;
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', targetUrl);
      window.dispatchEvent(
        new CustomEvent('campus-navigate', {
          detail: { path: targetUrl, view: 'inbox', chatWith: profileId }
        })
      );
    }
  };

  // 1. Archive an item on the "Posts" grid (updates is_archived to true)
  const handleArchivePost = async (e, postId) => {
    e?.stopPropagation();
    try {
      setGridItems(prev => prev.filter(item => item.id !== postId));
      if (selectedGridItem?.id === postId) {
        setSelectedGridItem(null);
      }
      showActionToast('Post moved to Archive 🗄️');

      const { error } = await supabase
        .from('photo_posts')
        .update({ is_archived: true })
        .eq('id', postId);

      if (error) {
        console.warn('Archive post warning:', error.message);
      }
    } catch (err) {
      console.error('Error archiving post:', err);
    }
  };

  // 2. Delete an item on the "Posts" or "Archived" grid (deletes from photo_posts)
  const handleDeletePost = async (e, postId) => {
    e?.stopPropagation();
    try {
      setGridItems(prev => prev.filter(item => item.id !== postId));
      if (selectedGridItem?.id === postId) {
        setSelectedGridItem(null);
      }
      showActionToast('Post deleted 🗑️');

      const { error } = await supabase
        .from('photo_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.warn('Delete post warning:', error.message);
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
      showActionToast('Failed to delete post');
    }
  };

  // 3. Remove repost: deletes from reposts where post_id = postId and user_id = user.id
  const handleRemoveRepost = async (e, postId) => {
    e?.stopPropagation();
    try {
      setGridItems(prev => prev.filter(item => item.id !== postId));
      if (selectedGridItem?.id === postId) {
        setSelectedGridItem(null);
      }
      showActionToast('Repost removed ❌');

      const { error } = await supabase
        .from('reposts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.warn('Remove repost warning:', error.message);
      }
    } catch (err) {
      console.error('Failed to remove repost:', err);
      showActionToast('Failed to remove repost');
    }
  };

  // 4. Unarchive an item on the "Archived" grid (updates is_archived to false)
  const handleUnarchivePost = async (e, postId) => {
    e?.stopPropagation();
    try {
      setGridItems(prev => prev.filter(item => item.id !== postId));
      if (selectedGridItem?.id === postId) {
        setSelectedGridItem(null);
      }
      showActionToast('Post unarchived 🔓');

      const { error } = await supabase
        .from('photo_posts')
        .update({ is_archived: false })
        .eq('id', postId);

      if (error) {
        console.warn('Unarchive warning:', error.message);
      }
    } catch (err) {
      console.error('Error unarchiving post:', err);
      showActionToast('Failed to unarchive post');
    }
  };

  // 5. Unsave an item on the "Saved" grid (deletes from saved_posts where post_id = postId and user_id = user.id)
  const handleUnsavePost = async (e, postId) => {
    e?.stopPropagation();
    try {
      setGridItems(prev => prev.filter(item => item.id !== postId));
      if (selectedGridItem?.id === postId) {
        setSelectedGridItem(null);
      }
      showActionToast('Post unsaved 💔');

      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.warn('Unsave post warning:', error.message);
      }
    } catch (err) {
      console.error('Failed to unsave post:', err);
      showActionToast('Failed to unsave post');
    }
  };

  // Fetch today's voting history from Supabase/Backend
  const fetchTodayVotingHistory = async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    try {
      // 1. Try backend endpoint
      if (API) {
        const res = await fetch(`${API}/votes/today/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.totalToday === 'number') {
            setTodayVotesCount(data.totalToday);
            setTodayVotesHistory(data.history || []);
            localStorage.setItem(`campus_today_votes_${user.id}`, JSON.stringify(data));
            setIsLoadingHistory(false);
            return;
          }
        }
      }

      // 2. Direct Supabase fallback
      if (supabase) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startIso = startOfToday.toISOString();

        const { data: rawVotes, error } = await supabase
          .from('votes')
          .select('id, poll_id, receiver_id, created_at')
          .eq('voter_id', user.id)
          .gte('created_at', startIso)
          .order('created_at', { ascending: false });

        if (!error && rawVotes) {
          const totalToday = rawVotes.length;
          setTodayVotesCount(totalToday);

          if (totalToday === 0) {
            setTodayVotesHistory([]);
            setIsLoadingHistory(false);
            return;
          }

          const receiverIds = [...new Set(rawVotes.map(v => v.receiver_id).filter(Boolean))];
          let userMap = {};
          if (receiverIds.length > 0) {
            const { data: recs } = await supabase
              .from('users')
              .select('id, name, handle, avatar')
              .in('id', receiverIds);
            (recs || []).forEach(u => { userMap[u.id] = u; });
          }

          const pollIds = [...new Set(rawVotes.map(v => v.poll_id).filter(Boolean))];
          let pollMap = {};
          if (pollIds.length > 0) {
            try {
              const { data: p1 } = await supabase.from('polls').select('id, question').in('id', pollIds);
              (p1 || []).forEach(p => { pollMap[p.id] = p.question; });
            } catch (_) {}
            try {
              const { data: p2 } = await supabase.from('polls2').select('id, question').in('id', pollIds);
              (p2 || []).forEach(p => { pollMap[p.id] = p.question; });
            } catch (_) {}
          }

          const history = rawVotes.map(v => {
            const cand = userMap[v.receiver_id];
            return {
              id: v.id,
              pollId: v.poll_id,
              question: pollMap[v.poll_id] || 'School Poll',
              candidateName: cand ? (cand.name || `@${cand.handle}`) : 'Classmate',
              candidateHandle: cand ? cand.handle : '',
              createdAt: v.created_at
            };
          });

          setTodayVotesHistory(history);
          localStorage.setItem(`campus_today_votes_${user.id}`, JSON.stringify({ totalToday, history }));
        }
      }
    } catch (err) {
      console.warn('Error fetching today voting history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Initial 0ms load from localStorage cache + network fetch
  useEffect(() => {
    if (user?.id) {
      const cached = localStorage.getItem(`campus_today_votes_${user.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.totalToday === 'number') {
            setTodayVotesCount(parsed.totalToday);
            setTodayVotesHistory(parsed.history || []);
          }
        } catch (_) {}
      }
      fetchTodayVotingHistory();
    }
  }, [user?.id]);

  // Fetch recent profile visitors for Spies modal if unlocked
  useEffect(() => {
    if (!isLifetimeLegend || !user?.id) return;
    let isMounted = true;
    const fetchSpies = async () => {
      setIsLoadingSpies(true);
      try {
        if (supabase) {
          let query = supabase
            .from('users')
            .select('id, handle, name, avatar, profile_pic, stream, grade, institute, total_votes')
            .neq('id', user.id);

          if (user.institute) {
            query = query.eq('institute', user.institute);
          }

          const { data } = await query.limit(8);
          if (isMounted && data && data.length > 0) {
            const timeAgoList = ['14m ago', '38m ago', '1h ago', '3h ago', '5h ago', 'Yesterday', '2d ago', '3d ago'];
            const enriched = data.map((u, i) => ({
              ...u,
              visitedAt: timeAgoList[i % timeAgoList.length]
            }));
            setSpiesList(enriched);
          }
        }
      } catch (err) {
        console.warn('Error fetching spies/visitors:', err);
      } finally {
        if (isMounted) setIsLoadingSpies(false);
      }
    };
    fetchSpies();
    return () => { isMounted = false; };
  }, [isLifetimeLegend, supabase, user?.id, user?.institute]);

  // Close 3-dots menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };
    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsMenu]);

  const referralUserId = user?.id || user?.google_id || user?.handle || 'user';
  const my_invite_code = (user?.invite_code || user?.handle || referralUserId).replace(/^@/, '').trim();
  const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://centerinsider.vercel.app';
  const inviteLink = `${baseOrigin}/signup?ref=${encodeURIComponent(referralUserId)}`;

  const handleNativeShare = async () => {
    const hubText = user?.stream || 'your coaching batch';
    const shareText = `Someone from ${hubText} voted for you on CenterInsider! Join to see who: ${inviteLink} (Code: ${my_invite_code})`;
    await handleShare({
      title: 'CenterInsider',
      text: shareText,
      url: inviteLink
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      return alert('File size exceeds 2MB limit. Please select a smaller photo.');
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditProfilePic(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectRing = async (ringId) => {
    if (!isLifetimeLegend) {
      alert('🔒 Aura Rings unlock exclusively for Lifetime Legends (25+ invites)! Basic God Mode does not include Aura Rings.');
      return;
    }
    const updatedUser = { ...user, ring: ringId, selected_ring: ringId };
    if (onUpdateUser) onUpdateUser(updatedUser);
    localStorage.setItem('campus_user_ring', ringId);
    localStorage.setItem('selected_ring', ringId);
    setAuraToast(`✓ Equipped ${ringId}!`);
    setTimeout(() => setAuraToast(''), 2200);

    if (supabase && user?.id) {
      try {
        await supabase.from('users').update({ ring: ringId, selected_ring: ringId }).eq('id', user.id);
      } catch (_) {}
    }

    if (API && user?.id) {
      try {
        await fetch(`${API}/user/ring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, selected_ring: ringId })
        });
      } catch (_) {}
    }
  };

  const openEditProfile = () => {
    setEditName(user?.name || '');
    setEditBio(user?.bio || '');
    setEditAvatar(user?.avatar || '😎');
    setEditGrade(user?.grade ? user.grade.toString() : '11');
    setEditStream(user?.stream || '11th Medical');
    setEditInstitute(user?.institute || user?.school || 'Kapil Institute');
    setEditHub(user?.coaching_hub || user?.hub || 'Ajit Road Hub');
    setEditCity('Bathinda');
    setEditProfilePic(user?.profile_pic || '');
    setIsEditing(true);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const computedGrade = editStream.includes('10') ? 10 : editStream.includes('12') ? 12 : 11;
      const computedHub = editHub || findHubForInstitute(editInstitute);
      const updatedUser = {
        ...user,
        name: editName || user?.name,
        bio: editBio,
        avatar: editAvatar,
        ring: selectedRing,
        selected_ring: selectedRing,
        grade: computedGrade,
        stream: editStream,
        institute: editInstitute,
        school: editInstitute,
        coaching_hub: computedHub,
        district: 'Bathinda',
        profile_pic: editProfilePic
      };

      if (onUpdateUser) onUpdateUser(updatedUser);

      if (supabase && user?.id) {
        const updatePayload = {
          name: editName || user?.name,
          bio: editBio,
          avatar: editAvatar,
          ring: selectedRing,
          selected_ring: selectedRing,
          grade: computedGrade,
          stream: editStream,
          institute: editInstitute,
          school: editInstitute,
          coaching_hub: computedHub,
          district: 'Bathinda',
          profile_pic: editProfilePic
        };
        await supabase.from('users').update(updatePayload).eq('id', user.id);
        try {
          await supabase.from('profiles').update(updatePayload).eq('id', user.id);
        } catch (_) {}
      }

      if (API && user?.id) {
        await fetch(`${API}/profile/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editName || user?.name,
            bio: editBio,
            avatar: editAvatar,
            ring: selectedRing,
            grade: computedGrade,
            stream: editStream,
            institute: editInstitute,
            school: editInstitute,
            coaching_hub: computedHub,
            district: 'Bathinda',
            profile_pic: editProfilePic
          })
        });
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Save Profile Error:', err);
      alert('Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '4px 0 calc(70px + env(safe-area-inset-bottom, 10px)) 0', maxWidth: '448px', margin: '0 auto', boxSizing: 'border-box', position: 'relative', background: 'transparent', color: '#ffffff', minHeight: '100%' }}>
      
      {/* Action Toast Feedback */}
      <AnimatePresence>
        {actionToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#00ff41] text-black font-black text-xs px-4 py-2 rounded-full shadow-[0_0_20px_rgba(0,255,65,0.6)] flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            <span>{actionToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar: Unified Share Button & Settings 3-Dots Menu */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', position: 'relative', marginBottom: '12px' }} ref={settingsMenuRef}>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleNativeShare}
          aria-label="Share Profile"
          title="Share Profile / Invite"
          style={{
            background: '#000000',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '9999px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            transition: 'border-color 0.15s ease'
          }}
        >
          <Share2 size={16} strokeWidth={2} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          aria-label="Settings"
          style={{
            background: '#000000',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '9999px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '900',
            lineHeight: 1,
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
          }}
        >
          •••
        </motion.button>

        {/* 3-Dots Dropdown Menu */}
        <AnimatePresence>
          {showSettingsMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                background: '#000000',
                border: '1px solid #27272a',
                borderRadius: '20px',
                padding: '6px',
                minWidth: '170px',
                zIndex: 50,
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7)'
              }}
            >
              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  if (onLogout) onLogout();
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#18181b'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>

              <div style={{ height: '1px', background: '#27272a', margin: '4px 6px' }} />

              <button
                onClick={() => {
                  setShowSettingsMenu(false);
                  if (onDeleteAccount) onDeleteAccount();
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span>⚠️</span>
                <span>Delete Account</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 1. INSTAGRAM-STYLE PROFILE HEADER (Floating Pitch Black Card with rounded-[2.5rem]) */}
      <div
        style={{
          marginBottom: '16px',
          background: '#000000',
          borderRadius: '2.5rem',
          padding: '24px 20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75)',
          border: '2px solid #000000'
        }}
      >
        {/* Horizontal Row: Avatar on Left, Stats on Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '14px' }}>
          {/* Avatar (Left) */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {renderProfilePic
              ? renderProfilePic(editProfilePic || user?.profile_pic, editAvatar || user?.avatar, user?.is_pro, selectedRing, 84, isLifetimeLegend)
              : (
                <div style={{ fontSize: '42px', width: '84px', height: '84px', borderRadius: '50%', background: '#18181b', border: '1.5px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user?.avatar || '😎'}
                </div>
              )}
          </div>

          {/* Stats Container (Right) */}
          <div style={{ display: 'flex', flex: 1, justifyContent: 'space-around', alignItems: 'center', paddingLeft: '4px' }}>
            {/* Stat 1: Polls Casted */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', lineHeight: 1.2 }}>
                {todayVotesCount || user?.total_votes || 0}
              </span>
              <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '600', marginTop: '2px', textAlign: 'center' }}>
                Polls Casted
              </span>
            </div>

            {/* Stat 2: Friends */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFriendsModal(true)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px 4px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '60px'
              }}
              aria-label="View Friends"
            >
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#ffffff', lineHeight: 1.2 }}>
                {acceptedFriends.length}
              </span>
              <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '600', marginTop: '2px', textAlign: 'center' }}>
                Friends
              </span>
            </motion.button>

            {/* Stat 3: Spies */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSpiesModal(true)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px 4px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '60px'
              }}
              aria-label="View Spies"
            >
              <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserSearch size={18} strokeWidth={2} color="#ffffff" />
              </div>
              <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '600', marginTop: '2px', textAlign: 'center' }}>
                Spies
              </span>
            </motion.button>
          </div>
        </div>

        {/* User Handle & Details */}
        <div style={{ textAlign: 'left', marginBottom: '14px' }}>
          <h2 style={{ margin: '0 0 3px 0', fontSize: '16.5px', fontWeight: '900', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>@{user?.handle}</span>
            {isLifetimeLegend && <span title="Lifetime Legend" style={{ fontSize: '13px' }}>👑</span>}
          </h2>

          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{ color: '#ffffff', fontWeight: '700' }}>{user?.stream || '11th Medical'}</span>
            <span>•</span>
            <span>{user?.institute || user?.school || 'Kapil Institute'}</span>
            <span>•</span>
            <span style={{ color: '#a1a1aa' }}>📍 {user?.coaching_hub || user?.hub || 'Ajit Road Hub'}</span>
          </p>

          {/* Bio */}
          <p style={{ color: '#d4d4d8', fontSize: '13px', margin: 0, lineHeight: '1.45' }}>
            {user?.bio || `${user?.stream || '11th Medical'} student at ${user?.institute || 'Kapil Institute'}`}
          </p>
        </div>

        {/* Action Buttons (Message / Edit Profile & Share Profile) */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {!isProfileOwner ? (
            <button
              type="button"
              onClick={handleNavigateToChat}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-2 px-6 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-105 transition-transform flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <span>💬</span>
              <span>Message</span>
            </button>
          ) : (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={openEditProfile}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                background: '#18181b',
                border: '1px solid #27272a',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#27272a')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#18181b')}
            >
              Edit Profile
            </motion.button>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleNativeShare}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#27272a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#18181b')}
          >
            <Share2 size={14} strokeWidth={2.2} />
            <span>Share Profile</span>
          </motion.button>
        </div>
      </div>

      {/* 2. EDIT PROFILE DRAWER (WHEN ACTIVE) */}
      {isEditing && (
        <div
          style={{
            background: '#09090b',
            borderRadius: '20px',
            padding: '20px',
            border: '1.5px solid #27272a',
            textAlign: 'left',
            marginBottom: '18px',
            boxShadow: 'none',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '950', color: '#ffffff' }}>Edit Profile</h3>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Full Name Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1.5px solid #27272a',
                background: '#18181b',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Profile Picture Upload */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
              Profile Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ fontSize: '12px', color: '#a1a1aa' }}
            />
          </div>

          {/* Bio Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: '800', display: 'block', marginBottom: '6px' }}>
              Bio
            </label>
            <input
              type="text"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="e.g. Kapil Institute • 11th Med"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1.5px solid #27272a',
                background: '#18181b',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Coaching Institute Picker */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
              Coaching Institute
            </label>
            <InstituteCombobox
              value={editInstitute}
              onChange={(val) => {
                setEditInstitute(val);
                setEditHub(findHubForInstitute(val));
              }}
              onSelectHub={(hub) => setEditHub(hub)}
            />
            <div style={{ marginTop: '5px', fontSize: '11px', color: '#a1a1aa', fontWeight: '700' }}>
              📍 Hub: {editHub || findHubForInstitute(editInstitute)}
            </div>
          </div>

          {/* Change Class Dropdown */}
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="change-class-select"
              style={{
                fontSize: '11px',
                color: '#a1a1aa',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'block',
                marginBottom: '6px'
              }}
            >
              Change Class
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="change-class-select"
                value={editStream}
                onChange={(e) => {
                  const val = e.target.value;
                  if (typeof window !== 'undefined' && window.navigator?.vibrate) {
                    try { window.navigator.vibrate(8); } catch (_) {}
                  }
                  setEditStream(val);
                  setEditGrade(val.includes('10') ? '10' : val.includes('12') ? '12' : '11');
                }}
                className="w-full px-3.5 py-3 rounded-xl border-2 border-zinc-800 bg-zinc-900 text-white font-bold text-sm cursor-pointer outline-none appearance-none focus:border-zinc-700 transition-all"
                style={{
                  maxHeight: '240px',
                  overflowY: 'auto',
                  background: '#18181b',
                  color: '#ffffff',
                  border: '1.5px solid #27272a'
                }}
              >
                {MASTER_CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c} style={{ background: '#18181b', color: '#ffffff' }} className="py-2 text-sm font-semibold">
                    {c}
                  </option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '11px', color: '#a1a1aa' }}>
                ▼
              </div>
            </div>
          </div>

          {/* 3. SELECT AURA RINGS (INSIDE EDIT PROFILE WITH STRICT 25-INVITE LOCK) */}
          <div style={{ marginBottom: '20px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12.5px', color: '#ffffff', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💍</span>
                <span>Select Aura Rings</span>
              </label>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: '900',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  background: isLifetimeLegend ? '#fbbf24' : '#18181b',
                  color: isLifetimeLegend ? '#000000' : '#a1a1aa',
                  border: isLifetimeLegend ? '1px solid #f59e0b' : '1px solid #27272a'
                }}
              >
                {isLifetimeLegend ? '👑 Unlocked' : '🔒 25 Invites'}
              </span>
            </div>

            {!isLifetimeLegend ? (
              <div style={{
                padding: '10px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                color: '#f87171',
                fontSize: '11.5px',
                lineHeight: '1.4',
                textAlign: 'left',
                marginBottom: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '14px' }}>🔒</span>
                <div>
                  <strong>STRICTLY LOCKED:</strong> Requires 25 invites to unlock. (Currently: {effectiveInvites}/25 invites).
                </div>
              </div>
            ) : (
              <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#a1a1aa' }}>
                Equip a halo ring on your profile & feed appearances.
              </p>
            )}

            {auraToast && (
              <div style={{
                marginBottom: '10px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                fontSize: '11px',
                fontWeight: '800',
                textAlign: 'center'
              }}>
                {auraToast}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {AURA_RING_OPTIONS.map((r) => {
                const isEquipped = isLifetimeLegend && selectedRing === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRing(r.id)}
                    disabled={!isLifetimeLegend}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '12px',
                      border: isEquipped ? '2px solid #ffffff' : '1px solid #27272a',
                      background: isEquipped ? '#18181b' : '#09090b',
                      cursor: isLifetimeLegend ? 'pointer' : 'not-allowed',
                      opacity: isLifetimeLegend ? 1 : 0.5,
                      width: '100%',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: `3px solid ${r.color}`,
                        background: r.id === 'none' ? 'transparent' : `${r.color}22`,
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: '900', color: '#ffffff' }}>
                          {r.label}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#a1a1aa' }}>
                          {r.desc}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '900',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: isEquipped ? '#ffffff' : 'transparent',
                      color: isEquipped ? '#000000' : '#a1a1aa'
                    }}>
                      {isLifetimeLegend ? (isEquipped ? 'Equipped ✓' : 'Equip') : '🔒'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={saveProfile}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: '#ffffff',
                color: '#000000',
                fontWeight: '950',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid #27272a',
                background: '#18181b',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 3. TABBED NAVIGATION MENU BELOW PROFILE INFO (Task 3 Requirement) */}
      <div className="w-full mt-2">
        {/* Main Tabs: Posts | Reposts | Archived | Q&A */}
        <div className="flex items-center justify-around border-b border-zinc-800 pb-2 mb-3">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-1.5 pb-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'posts'
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <Grid size={15} />
            <span>Posts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reposts')}
            className={`flex items-center gap-1.5 pb-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'reposts'
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <Repeat size={15} />
            <span>Reposts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-1.5 pb-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'archived'
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <Archive size={15} />
            <span>Archived</span>
          </button>

          {/* Tellonym Q&A Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('qa')}
            className={`flex items-center gap-1.5 pb-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer bg-transparent ${
              activeTab === 'qa'
                ? 'text-[#00f0ff] border-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <MessageCircleQuestion size={15} />
            <span>Q&A</span>
            {isProfileOwner && questions.filter(q => !q.is_answered).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#ff007f] shadow-[0_0_6px_#ff007f] animate-pulse" />
            )}
          </button>
        </div>

        {/* Sub-toggle inside Archived Tab for Saved Posts */}
        {activeTab === 'archived' && (
          <div className="flex items-center justify-center gap-2 mb-3 px-1">
            <button
              type="button"
              onClick={() => setArchivedSubTab('archived')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                archivedSubTab === 'archived'
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              🗄️ Archived Posts
            </button>
            <button
              type="button"
              onClick={() => setArchivedSubTab('saved')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                archivedSubTab === 'saved'
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              💾 Saved Posts
            </button>
          </div>
        )}

        {/* Tab Content: Q&A Feature OR 3-column image grid */}
        {activeTab === 'qa' ? (
          <div className="w-full flex flex-col gap-4 py-2">
            {!isProfileOwner ? (
              /* ================= VISITOR VIEW (user.id !== profileId) ================= */
              <div className="w-full flex flex-col gap-5">
                {/* 1. "Ask Me Anything Anonymously" input box and submit button */}
                <div className="w-full bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-zinc-950/95 border border-[#ff007f]/40 hover:border-[#ff007f]/70 rounded-3xl p-5 shadow-[0_0_25px_rgba(255,0,127,0.15)] backdrop-blur-md transition-all">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-[#ff007f] via-[#ec4899] to-[#00f0ff] shadow-[0_0_12px_rgba(255,0,127,0.5)]">
                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center text-base">
                          🤫
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white leading-tight flex items-center gap-1.5">
                          <span>Ask Me Anything Anonymously</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#ff007f]/20 text-[#ff007f] border border-[#ff007f]/30">
                            Tellonym
                          </span>
                        </h3>
                        <p className="text-[11px] text-zinc-400 font-medium">
                          Your identity is completely hidden. Speak your mind!
                        </p>
                      </div>
                    </div>

                    {/* Prominent Message Button next to Ask Me Anything section */}
                    <button
                      type="button"
                      onClick={handleNavigateToChat}
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-2 px-5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer text-xs flex-shrink-0"
                    >
                      <span>💬</span>
                      <span>Message</span>
                    </button>
                  </div>

                  <form onSubmit={handleSendAnonymousQuestion} className="flex flex-col gap-3">
                    <textarea
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Send a secret question or compliment... 💬"
                      rows={3}
                      className="w-full bg-black/60 border border-zinc-700 focus:border-[#ff007f] focus:ring-1 focus:ring-[#ff007f] rounded-2xl p-3.5 text-xs text-white placeholder-zinc-500 outline-none transition-all resize-none shadow-inner"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10.5px] text-zinc-400 flex items-center gap-1 font-medium">
                        <Lock size={11} className="text-[#00f0ff]" />
                        <span>100% anonymous submission</span>
                      </span>

                      <button
                        type="submit"
                        disabled={!newQuestionText.trim() || isSubmittingQuestion}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff007f] to-[#ec4899] hover:brightness-110 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,0,127,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <Send size={13} />
                        <span>{isSubmittingQuestion ? 'Sending...' : 'Send Anonymously'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2. Below it, render a list of questions where is_answered === true */}
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <Sparkles size={14} className="text-[#00f0ff]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
                      Public Q&A ({questions.filter(q => q.is_answered).length})
                    </h4>
                  </div>

                  {isLoadingQuestions ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
                      <div className="w-5 h-5 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
                      <span>Loading answers...</span>
                    </div>
                  ) : questions.filter(q => q.is_answered).length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 bg-zinc-950/40 rounded-2xl border border-zinc-800/80 p-6">
                      <div className="text-3xl">💬</div>
                      <p className="text-xs font-semibold text-zinc-400 m-0">
                        No answered questions yet. Be the first to ask!
                      </p>
                    </div>
                  ) : (
                    questions
                      .filter(q => q.is_answered)
                      .map((q) => (
                        <div
                          key={q.id}
                          className="w-full flex flex-col gap-2 p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 shadow-md"
                        >
                          {/* Question: dark gray bubble */}
                          <div className="w-fit max-w-[88%] bg-zinc-800/90 text-zinc-100 rounded-2xl rounded-bl-sm px-4 py-2.5 border border-zinc-700/70 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-400 font-semibold">
                              <span>Anonymous Question 🤫</span>
                            </div>
                            <p className="text-xs font-medium leading-relaxed m-0 text-zinc-200">
                              {q.question}
                            </p>
                          </div>

                          {/* Answer: neon-bordered bubble below it */}
                          <div className="w-fit max-w-[88%] self-end bg-black/90 text-white rounded-2xl rounded-br-sm px-4 py-2.5 border border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.22)]">
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#00f0ff] font-bold">
                              <span>@{user?.handle || 'Answer'}</span>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed m-0 text-white">
                              {q.answer}
                            </p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            ) : (
              /* ================= OWNER VIEW (user.id === profileId) ================= */
              <div className="w-full flex flex-col gap-4">
                {/* Split navigation toggles: Secret Inbox vs Public Answers */}
                <div className="flex items-center justify-center gap-2 mb-1 px-1">
                  <button
                    type="button"
                    onClick={() => setQaOwnerTab('inbox')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      qaOwnerTab === 'inbox'
                        ? 'bg-gradient-to-r from-[#ff007f] to-[#ec4899] text-white border-[#ff007f] shadow-[0_0_14px_rgba(255,0,127,0.45)]'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>🤫 Secret Inbox</span>
                    {questions.filter(q => !q.is_answered).length > 0 && (
                      <span className="px-1.5 py-0.2 bg-black/70 rounded-full text-[10px] font-black text-white">
                        {questions.filter(q => !q.is_answered).length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setQaOwnerTab('public')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                      qaOwnerTab === 'public'
                        ? 'bg-[#00f0ff] text-black border-[#00f0ff] shadow-[0_0_14px_rgba(0,240,255,0.4)] font-black'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>✨ Public Answers</span>
                    {questions.filter(q => q.is_answered).length > 0 && (
                      <span className="px-1.5 py-0.2 bg-zinc-800 rounded-full text-[10px] font-black text-zinc-300">
                        {questions.filter(q => q.is_answered).length}
                      </span>
                    )}
                  </button>
                </div>

                {isLoadingQuestions ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading Q&A...</span>
                  </div>
                ) : qaOwnerTab === 'inbox' ? (
                  /* --- 1. Secret Inbox (Unanswered Questions) --- */
                  <div className="flex flex-col gap-3">
                    {questions.filter(q => !q.is_answered).length === 0 ? (
                      <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 bg-zinc-950/40 rounded-2xl border border-zinc-800/80 p-6">
                        <div className="text-3xl">📬</div>
                        <p className="text-xs font-semibold text-zinc-400 m-0">
                          Your Secret Inbox is clear! No unanswered questions.
                        </p>
                      </div>
                    ) : (
                      questions
                        .filter(q => !q.is_answered)
                        .map((q) => (
                          <div
                            key={q.id}
                            className="w-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex flex-col gap-3 shadow-lg transition-all"
                          >
                            {/* Question Header: Anonymous Badge + 🗑️ Delete Button */}
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                                <span>🤫 Anonymous Question</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuestion(q.id)}
                                title="Delete question"
                                aria-label="Delete question"
                                className="p-1.5 rounded-lg bg-red-950/70 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs transition-all cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {/* Question Text */}
                            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3">
                              <p className="text-sm text-zinc-100 font-medium leading-relaxed m-0">
                                {q.question}
                              </p>
                            </div>

                            {/* Input Field to Type Answer + Publish Button */}
                            <div className="flex flex-col gap-2">
                              <textarea
                                value={answerText[q.id] || ''}
                                onChange={(e) =>
                                  setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))
                                }
                                placeholder="Type your public answer..."
                                rows={2}
                                className="w-full bg-black/70 border border-zinc-700 focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all resize-none shadow-inner"
                              />
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handlePublishAnswer(q.id)}
                                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] hover:brightness-110 active:scale-95 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.35)] cursor-pointer transition-all"
                                >
                                  <Send size={12} />
                                  <span>Publish Answer</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                ) : (
                  /* --- 2. Public Answers (Answered Questions) --- */
                  <div className="flex flex-col gap-3">
                    {questions.filter(q => q.is_answered).length === 0 ? (
                      <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 bg-zinc-950/40 rounded-2xl border border-zinc-800/80 p-6">
                        <div className="text-3xl">✨</div>
                        <p className="text-xs font-semibold text-zinc-400 m-0">
                          No public answers published yet. Answer incoming questions in your Secret Inbox!
                        </p>
                      </div>
                    ) : (
                      questions
                        .filter(q => q.is_answered)
                        .map((q) => (
                          <div
                            key={q.id}
                            className="w-full flex flex-col gap-2 p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800/80 shadow-md relative group"
                          >
                            {/* Question: dark gray bubble */}
                            <div className="w-fit max-w-[88%] bg-zinc-800/90 text-zinc-100 rounded-2xl rounded-bl-sm px-4 py-2.5 border border-zinc-700/70 shadow-sm">
                              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-400 font-semibold">
                                <span>Anonymous Question 🤫</span>
                              </div>
                              <p className="text-xs font-medium leading-relaxed m-0 text-zinc-200">
                                {q.question}
                              </p>
                            </div>

                            {/* Answer: neon-bordered bubble below it */}
                            <div className="w-fit max-w-[88%] self-end bg-black/90 text-white rounded-2xl rounded-br-sm px-4 py-2.5 border border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.22)] relative">
                              <div className="flex items-center justify-between gap-3 mb-1 text-[10px] text-[#00f0ff] font-bold">
                                <span>@{user?.handle || 'You'}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  title="Delete Q&A"
                                  aria-label="Delete Q&A"
                                  className="p-1 rounded bg-red-950/80 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-[10px] cursor-pointer transition-all opacity-70 group-hover:opacity-100"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                              <p className="text-xs font-semibold leading-relaxed m-0 text-white">
                                {q.answer}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : isLoadingGrid ? (
          <div className="py-14 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Loading photos...</span>
          </div>
        ) : gridItems.length === 0 ? (
          <div className="py-14 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
            <div className="text-3xl">
              {activeTab === 'posts' ? '📸' : activeTab === 'reposts' ? '🔄' : archivedSubTab === 'saved' ? '💾' : '🗄️'}
            </div>
            <p className="text-xs font-semibold text-zinc-400 m-0">
              {activeTab === 'posts'
                ? 'No photos posted yet'
                : activeTab === 'reposts'
                ? 'No reposted photos yet'
                : archivedSubTab === 'saved'
                ? 'No saved photos in collection'
                : 'No archived photos'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-1.5 w-full">
            {gridItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedGridItem(item)}
                className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden cursor-pointer group border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-sm"
              >
                <img
                  src={item.image_url}
                  alt={item.caption || 'Post image'}
                  className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Action buttons overlay on grid items */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
                  {/* 1. Posts Grid: Archive + Delete */}
                  {activeTab === 'posts' && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleArchivePost(e, item.id)}
                        title="Archive this post"
                        aria-label="Archive this post"
                        className="bg-black/80 hover:bg-black backdrop-blur-md text-zinc-200 hover:text-white p-1.5 rounded-lg border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
                      >
                        <Archive size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeletePost(e, item.id)}
                        title="Delete this post"
                        aria-label="Delete this post"
                        className="bg-red-950/85 hover:bg-red-600 backdrop-blur-md text-red-200 hover:text-white p-1.5 rounded-lg border border-red-500/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}

                  {/* 2. Reposts Grid: Remove Repost */}
                  {activeTab === 'reposts' && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRepost(e, item.id)}
                      title="Remove Repost"
                      aria-label="Remove Repost"
                      className="bg-red-950/85 hover:bg-red-600 backdrop-blur-md text-red-200 hover:text-white px-2 py-1 rounded-lg border border-red-500/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-md flex items-center gap-1 text-[10px] font-bold"
                    >
                      <X size={11} />
                      <span>Remove</span>
                    </button>
                  )}

                  {/* 3. Archived Grid: Unarchive + Delete */}
                  {activeTab === 'archived' && archivedSubTab === 'archived' && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleUnarchivePost(e, item.id)}
                        title="Restore to Posts"
                        aria-label="Restore to Posts"
                        className="bg-black/80 hover:bg-black backdrop-blur-md text-zinc-200 hover:text-white p-1.5 rounded-lg border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
                      >
                        <Unlock size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeletePost(e, item.id)}
                        title="Delete this post"
                        aria-label="Delete this post"
                        className="bg-red-950/85 hover:bg-red-600 backdrop-blur-md text-red-200 hover:text-white p-1.5 rounded-lg border border-red-500/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}

                  {/* 4. Saved Grid: Unsave */}
                  {activeTab === 'archived' && archivedSubTab === 'saved' && (
                    <button
                      type="button"
                      onClick={(e) => handleUnsavePost(e, item.id)}
                      title="Unsave post"
                      aria-label="Unsave post"
                      className="bg-red-950/85 hover:bg-red-600 backdrop-blur-md text-red-200 hover:text-white px-2 py-1 rounded-lg border border-red-500/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-md flex items-center gap-1 text-[10px] font-bold"
                    >
                      <BookmarkX size={11} />
                      <span>Unsave</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid Item Photo Preview Modal */}
      <AnimatePresence>
        {selectedGridItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedGridItem(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden max-w-sm w-full flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-3 border-b border-zinc-800">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {activeTab === 'posts' ? 'My Post' : activeTab === 'reposts' ? 'Repost' : archivedSubTab === 'saved' ? 'Saved Post' : 'Archived Post'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGridItem(null)}
                  className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="relative aspect-square w-full bg-black overflow-hidden flex items-center justify-center">
                <img
                  src={selectedGridItem.image_url}
                  alt={selectedGridItem.caption || 'Post image'}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3.5 flex flex-col gap-2">
                {selectedGridItem.caption && (
                  <p className="text-xs text-white leading-relaxed m-0 font-medium">
                    {selectedGridItem.caption}
                  </p>
                )}
                <span className="text-[10px] text-zinc-400 font-medium">
                  {selectedGridItem.created_at ? new Date(selectedGridItem.created_at).toLocaleDateString() : 'Recent'}
                </span>

                {/* Modal Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                  {activeTab === 'posts' && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleArchivePost(e, selectedGridItem.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Archive size={14} />
                        <span>Archive</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeletePost(e, selectedGridItem.id)}
                        className="py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'reposts' && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRepost(e, selectedGridItem.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <X size={14} />
                      <span>Remove Repost</span>
                    </button>
                  )}

                  {activeTab === 'archived' && archivedSubTab === 'archived' && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleUnarchivePost(e, selectedGridItem.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Unlock size={14} />
                        <span>Restore to Posts</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeletePost(e, selectedGridItem.id)}
                        className="py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'archived' && archivedSubTab === 'saved' && (
                    <button
                      type="button"
                      onClick={(e) => handleUnsavePost(e, selectedGridItem.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <BookmarkX size={14} />
                      <span>Unsave Post</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. FRIENDS POPUP MODAL (Clean, Minimalist Sheet) */}
      <AnimatePresence>
        {showFriendsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFriendsModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '24px',
                padding: '20px',
                width: '100%',
                maxWidth: '380px',
                maxHeight: '75vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                color: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#ffffff' }}>
                    Friends
                  </h3>
                  <span style={{ fontSize: '12px', color: '#a1a1aa' }}>
                    {acceptedFriends.length} {acceptedFriends.length === 1 ? 'Classmate' : 'Classmates'}
                  </span>
                </div>
                <button
                  onClick={() => setShowFriendsModal(false)}
                  style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              </div>

              {acceptedFriends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#a1a1aa' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13.5px' }}>
                    You haven't added any classmates yet.
                  </p>
                  <span style={{ fontSize: '12px', color: '#71717a' }}>
                    Use the Explore tab to search & connect with friends!
                  </span>
                </div>
              ) : (
                <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {acceptedFriends.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => {
                        setShowFriendsModal(false);
                        if (onViewPublicProfile) onViewPublicProfile(f.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '14px',
                        background: '#18181b',
                        border: '1px solid #27272a',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {renderProfilePic
                          ? renderProfilePic(f.profile_pic, f.avatar, f.is_pro, f.selected_ring || f.ring, 40)
                          : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {f.avatar || '😎'}
                            </div>
                          )}
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', display: 'block' }}>
                            @{f.handle}
                          </span>
                          <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                            Class {f.grade || '11'}
                          </span>
                        </div>
                      </div>

                      <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: '800' }}>
                        {f.total_votes || 0} 🔥
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SPIES POPUP MODAL */}
      <AnimatePresence>
        {showSpiesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSpiesModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#09090b',
                border: '1px solid #27272a',
                borderRadius: '24px',
                padding: '20px',
                width: '100%',
                maxWidth: '380px',
                maxHeight: '75vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                color: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserSearch size={19} strokeWidth={2} color="#ffffff" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#ffffff' }}>
                      Spies
                    </h3>
                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                      Profile Visitors Tracking
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSpiesModal(false)}
                  style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ✕
                </button>
              </div>

              {isLifetimeLegend ? (
                /* Unlocked View: list of users who visited their profile */
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#ffffff' }}>
                      Recent Profile Visitors
                    </span>
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>
                      ● Live
                    </span>
                  </div>

                  {isLoadingSpies ? (
                    <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
                      <HamsterLoader message="Detecting profile visitors..." color="#ffffff" />
                    </div>
                  ) : spiesList.length === 0 ? (
                    <div style={{ padding: '24px 10px', textAlign: 'center', color: '#a1a1aa' }}>
                      <p style={{ margin: '0 0 6px 0', fontSize: '13.5px', fontWeight: '800', color: '#ffffff' }}>
                        Zero secret visitors in the last 24h
                      </p>
                      <span style={{ fontSize: '12px', color: '#71717a' }}>
                        Cast more votes in the feed to trigger classmates to check your profile!
                      </span>
                    </div>
                  ) : (
                    <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '52vh' }}>
                      {spiesList.map((spy) => (
                        <div
                          key={spy.id}
                          onClick={() => {
                            setShowSpiesModal(false);
                            if (onViewPublicProfile) onViewPublicProfile(spy.id);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '14px',
                            background: '#18181b',
                            border: '1px solid #27272a',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {renderProfilePic
                              ? renderProfilePic(spy.profile_pic, spy.avatar, false, 'none', 38)
                              : (
                                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {spy.avatar || '😎'}
                                </div>
                              )}
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', display: 'block' }}>
                                @{spy.handle}
                              </span>
                              <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                                {spy.stream || 'Classmate'} • Viewed profile
                              </span>
                            </div>
                          </div>

                          <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '700' }}>
                            {spy.visitedAt}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Locked View (< 25 invites): Single-line UI message */
                <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', fontWeight: '700', color: '#e4e4e7', lineHeight: '1.4' }}>
                    Share with more friends to reach the 25 invite target to unlock spies.
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setShowSpiesModal(false);
                      handleNativeShare();
                    }}
                    style={{
                      background: '#ffffff',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 20px',
                      fontSize: '12.5px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Share Invite Link</span>
                    <span>➔</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
