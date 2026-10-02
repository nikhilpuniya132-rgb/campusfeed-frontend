import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

/**
 * <CustomPollSubmit/>
 * Exclusive God Mode feature: allows VIP students to submit custom polls.
 * ONLY renders if the user's is_god_mode (or pro / 25 invites) status is true.
 * Integrates live rate-limit tracking (max 3 polls per user per month)
 * and displays automated AI Safety Moderator review status in real-time.
 */
export default function CustomPollSubmit({ user, API, supabase, onPollCreated }) {
  const currentInvites = user?.invites || user?.recruits || 0;
  const isLegend = Boolean(user?.is_god_mode || currentInvites >= 25);
  const hasPollAccess = Boolean(isLegend || user?.is_pro || currentInvites >= 3);
  const maxLimit = isLegend ? 150 : 3;

  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moderationStep, setModerationStep] = useState('idle'); // 'idle' | 'checking' | 'approved' | 'rejected'
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [remainingLimit, setRemainingLimit] = useState(maxLimit);
  const [monthlyCount, setMonthlyCount] = useState(0);

  // Fetch monthly rate limit count
  useEffect(() => {
    if (!hasPollAccess) return;
    let isMounted = true;
    const fetchStatus = async () => {
      if (!user?.id) return;
      try {
        const backendUrl = API || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '');
        const res = await fetch(`${backendUrl}/custom-polls/status/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMonthlyCount(data.count || 0);
            setRemainingLimit(data.remaining !== undefined ? data.remaining : Math.max(0, maxLimit - (data.count || 0)));
          }
        }
      } catch (_) {
        // Fallback: query Supabase directly
        if (supabase && user?.id) {
          try {
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            const { count } = await supabase
              .from('custom_polls')
              .select('id', { count: 'exact', head: true })
              .eq('created_by', user.id)
              .gte('created_at', startOfMonth);
            if (isMounted && count !== null) {
              setMonthlyCount(count);
              setRemainingLimit(Math.max(0, maxLimit - count));
            }
          } catch (e) {}
        }
      }
    };
    fetchStatus();
    return () => { isMounted = false; };
  }, [user?.id, API, supabase, hasPollAccess, maxLimit]);

  if (!hasPollAccess) {
    return (
      <div
        style={{
          width: '100%',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '20px',
          padding: '18px 16px',
          marginBottom: '16px',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}
      >
        <span style={{ fontSize: '24px' }}>🔒</span>
        <h4 style={{ margin: '8px 0 4px 0', fontSize: '15px', fontWeight: '900', color: '#000000' }}>
          Custom Poll Creation Locked
        </h4>
        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
          Invite 3 friends to create up to 3 custom polls/month, or 25 friends (Lifetime Legend) for up to 150 polls/month!
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanQ = question.trim();
    if (!cleanQ) {
      return setErrorMsg('Please enter a poll question.');
    }
    if (cleanQ.length < 8) {
      return setErrorMsg('Poll question should be at least 8 characters long.');
    }
    if (cleanQ.length > 120) {
      return setErrorMsg('Question cannot exceed 120 characters.');
    }
    if (remainingLimit <= 0) {
      return setErrorMsg('Monthly rate limit reached. You can submit up to 3 custom polls per calendar month.');
    }

    setIsSubmitting(true);
    setModerationStep('checking');

    try {
      const backendUrl = API || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '');
      const response = await fetch(`${backendUrl}/submit-poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          question: cleanQ
        })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'rejected' || !data.success) {
        setModerationStep('rejected');
        setErrorMsg(
          data.error ||
          'Poll rejected by AI Safety Moderator. Question was deemed unsafe, mean-spirited, or against school guidelines.'
        );
        if (window.navigator?.vibrate) window.navigator.vibrate([100, 50, 100]);
        return;
      }

      // APPROVED
      setModerationStep('approved');
      setSuccessMsg('🎉 Poll APPROVED by AI Moderator! It is now live in your school feed.');
      setQuestion('');
      setMonthlyCount(prev => prev + 1);
      setRemainingLimit(prev => Math.max(0, prev - 1));

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (_) {}

      if (onPollCreated) {
        onPollCreated(data.poll);
      }

      setTimeout(() => {
        setModerationStep('idle');
        setSuccessMsg('');
      }, 5000);
    } catch (err) {
      console.error('Custom poll submission error:', err);
      setModerationStep('idle');
      setErrorMsg('Failed to submit poll. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleIdeas = [
    "Most likely to crack NEET with AIR 1?",
    "Who has the most aesthetic handwritten notes?",
    "Biggest tea spilled during Physics recess?",
    "Whose formula sheet does the whole batch rely on?"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        width: '100%',
        background: '#ffffff',
        border: '1.5px solid #000000',
        borderRadius: '20px',
        padding: '20px 18px',
        boxSizing: 'border-box',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
        marginBottom: '22px',
        textAlign: 'left'
      }}
    >
      {/* Header Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>👑</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#000000', letterSpacing: '-0.3px' }}>
              Custom Poll Creator
            </h3>
            <span style={{ fontSize: '10.5px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              God Mode Exclusive • AI Safety Filtered
            </span>
          </div>
        </div>

        {/* Monthly Rate Limit Badge */}
        <div style={{
          background: remainingLimit > 0 ? '#f3f4f6' : '#fee2e2',
          border: remainingLimit > 0 ? '1px solid #e5e7eb' : '1px solid #fca5a5',
          color: remainingLimit > 0 ? '#111827' : '#b91c1c',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '800'
        }}>
          {remainingLimit} / {maxLimit} left this month
        </div>
      </div>

      <p style={{ margin: '0 0 14px 0', fontSize: '12.5px', color: '#4b5563', lineHeight: '1.45' }}>
        Drop a question directly into your coaching batch's active voting deck. Every submission is analyzed in real-time by our school AI safety moderator.
      </p>

      {/* Submission Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="Type your positive, fun school poll question here..."
            maxLength={120}
            rows={3}
            disabled={isSubmitting || remainingLimit <= 0}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '14px',
              border: moderationStep === 'rejected' ? '1.5px solid #ef4444' : '1px solid #d1d5db',
              background: '#f9fafb',
              color: '#000000',
              fontSize: '13.5px',
              fontWeight: '600',
              fontFamily: 'inherit',
              resize: 'none',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border 0.2s ease'
            }}
          />
          <div style={{
            position: 'absolute',
            right: '12px',
            bottom: '10px',
            fontSize: '10.5px',
            fontWeight: '700',
            color: question.length > 105 ? '#ef4444' : '#9ca3af'
          }}>
            {question.length}/120
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ marginBottom: '14px' }}>
          <span style={{ fontSize: '10.5px', color: '#6b7280', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
            💡 Quick Ideas:
          </span>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {sampleIdeas.map((idea, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuestion(idea)}
                disabled={isSubmitting || remainingLimit <= 0}
                style={{
                  flexShrink: 0,
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '5px 10px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#f3f4f6',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        {/* Status Alerts */}
        <AnimatePresence>
          {moderationStep === 'checking' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                padding: '10px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}
            >
              <span className="animate-spin">🤖</span>
              <span>AI Safety Moderator is analyzing question content...</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '12px'
              }}
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '10px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}
            >
              <span>✓</span>
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Action Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting || !question.trim() || remainingLimit <= 0}
          style={{
            width: '100%',
            padding: '12px 18px',
            borderRadius: '14px',
            border: 'none',
            background: remainingLimit <= 0 ? '#9ca3af' : '#000000',
            color: '#ffffff',
            fontSize: '13.5px',
            fontWeight: '800',
            cursor: remainingLimit <= 0 || isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s ease'
          }}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin">⚡</span>
              <span>Moderating & Publishing...</span>
            </>
          ) : remainingLimit <= 0 ? (
            <span>Monthly Limit Reached (3/3 Used)</span>
          ) : (
            <>
              <span>Submit Custom Poll</span>
              <span>➔</span>
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
