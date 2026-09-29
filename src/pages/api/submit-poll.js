import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Exact System Prompt required by specification:
 * "You are a strict school moderator. Analyze this poll question. If it contains profanity, sexual content, bullying, names a specific student in a negative way, or is mean-spirited, return REJECTED. If it is positive, fun, and safe, return APPROVED."
 */
const MODERATOR_SYSTEM_PROMPT = "You are a strict school moderator. Analyze this poll question. If it contains profanity, sexual content, bullying, names a specific student in a negative way, or is mean-spirited, return REJECTED. If it is positive, fun, and safe, return APPROVED.";

async function moderateWithLLM(question) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `${MODERATOR_SYSTEM_PROMPT}\n\nPoll question to analyze:\n"${question}"\n\nReturn strictly APPROVED or REJECTED.` }]
          }]
        })
      });
      const data = await res.json();
      const output = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (output.toUpperCase().includes('REJECTED')) return 'REJECTED';
      if (output.toUpperCase().includes('APPROVED')) return 'APPROVED';
    } catch (e) {
      console.warn('Gemini API call failed, falling back:', e);
    }
  }

  if (openAiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: MODERATOR_SYSTEM_PROMPT },
            { role: 'user', content: question }
          ],
          temperature: 0
        })
      });
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content?.trim() || '';
      if (reply.toUpperCase().includes('REJECTED')) return 'REJECTED';
      if (reply.toUpperCase().includes('APPROVED')) return 'APPROVED';
    } catch (e) {
      console.warn('OpenAI API call failed, falling back:', e);
    }
  }

  // Safety fallback for school safety
  const lower = question.toLowerCase();
  const badPatterns = [
    /\b(fuck|shit|bitch|asshole|bastard|cunt|dick|pussy|slut|whore|nigger|faggot|retard|idiot|stupid|ugly|fat|loser|hate)\b/i,
    /\b(sex|nude|nudes|naked|horny|porn|boobs|penis|vagina|hookup|drugs|weed|drunk|alcohol)\b/i,
    /\b(kill yourself|kys|die|eww|disgusting|smells bad|creep|creepy|fake friend|snake|trash)\b/i,
    /\b(chutiya|saala|kamina|gandu|harami|bhosdi|madarchod|behenchod|randi|kutta|bakwas)\b/i
  ];

  if (badPatterns.some(p => p.test(lower)) || question.trim().length < 5) {
    return 'REJECTED';
  }

  return 'APPROVED';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, question } = req.body;
    if (!userId || !question || !question.trim()) {
      return res.status(400).json({ error: 'userId and question are required' });
    }

    const cleanQuestion = question.trim();

    // 1. Verify user profile and God Mode privileges
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, is_god_mode, is_pro, invites')
      .eq('id', userId)
      .maybeSingle();

    const isGodMode = Boolean(userProfile?.is_god_mode || userProfile?.is_pro || (userProfile?.invites || 0) >= 25);
    if (!isGodMode) {
      return res.status(403).json({
        error: 'God Mode status required. Invite 25 classmates to unlock custom polls!'
      });
    }

    // 2. Enforce monthly rate limit (Maximum 3 custom polls per user per month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count, error: countError } = await supabase
      .from('custom_polls')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', userId)
      .gte('created_at', startOfMonth);

    if (count !== null && count >= 3) {
      return res.status(429).json({
        error: 'Rate limit exceeded: You have reached the maximum of 3 custom polls for this month.',
        limit: 3,
        count
      });
    }

    // 3. AI Safety Moderation Call
    const verdict = await moderateWithLLM(cleanQuestion);

    if (verdict === 'REJECTED') {
      // Record rejection in database for safety audit
      try {
        await supabase
          .from('custom_polls')
          .insert([{
            question: cleanQuestion,
            created_by: userId,
            status: 'rejected',
            created_at: new Date().toISOString()
          }]);
      } catch (_) {}

      return res.status(400).json({
        success: false,
        status: 'rejected',
        error: 'Poll rejected by AI Safety Moderator. Question was deemed unsafe or hurtful for school.'
      });
    }

    // 4. APPROVED: Save to custom_polls table and polls rotation
    const { data: savedPoll, error: insertError } = await supabase
      .from('custom_polls')
      .insert([{
        question: cleanQuestion,
        created_by: userId,
        status: 'approved',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Database save failed: ' + insertError.message });
    }

    // Insert into live voting rotation
    try {
      await supabase.from('polls').insert([{
        question: cleanQuestion,
        is_crush_poll: false
      }]);
    } catch (_) {}

    return res.status(200).json({
      success: true,
      status: 'approved',
      message: 'Poll approved and saved successfully!',
      poll: savedPoll
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
