/**
 * CampusFeed Referral Engine Utility (Beta 1.0)
 * Generates unique, trackable invite links and WhatsApp viral sharing URLs
 */

/**
 * Returns the trackable referral link using user's unique ID (or fallback code/handle)
 * Format: https://domain/?ref=userID
 */
export function getReferralLink(user) {
  const refId = user?.id || user?.invite_code || user?.handle || 'campus';
  const cleanRef = String(refId).trim().replace(/^@/, '');
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://campusfeed-frontend.vercel.app';
  return `${baseUrl}/?ref=${encodeURIComponent(cleanRef)}`;
}

/**
 * Generates an engaging, high-converting WhatsApp message URL for Batch Captains
 */
export function getWhatsAppShareUrl(user, customMessage = '') {
  const link = getReferralLink(user);
  const gradeText = user?.grade ? `Class ${user.grade}` : 'our class';
  
  const defaultText = `🔥 *CampusFeed St. Kabir Update*: Someone in ${gradeText} just secretly voted for you! 🤫\n\nFind out who voted for you and see your compliments here:\n👉 ${link}\n\n(Takes 10 seconds to join • Free)`;
  
  const message = customMessage || defaultText;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * Copies the user's trackable invite link to clipboard with native fallback
 */
export async function copyReferralLink(user) {
  const link = getReferralLink(user);
  const shareText = `Someone from St. Kabir voted for you on CampusFeed! Join to see who: ${link}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(shareText);
      return { success: true, text: shareText, link };
    } catch (_) {}
  }

  // Fallback for older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = shareText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return { success: true, text: shareText, link };
  } catch (err) {
    return { success: false, error: err };
  }
}
