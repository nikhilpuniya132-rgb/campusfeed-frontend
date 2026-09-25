/**
 * CenterInsider Native Share Utility
 * Handles Web Share API (OS native share sheet for WhatsApp, Instagram, Snapchat, etc.)
 * with clipboard copy fallback and subtle toast notification.
 */

export const showShareToast = (message = 'Link copied to clipboard!') => {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('ci-share-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ci-share-toast';
  toast.innerText = `✓ ${message}`;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '32px',
    left: '50%',
    transform: 'translateX(-50%) translateY(8px)',
    background: '#18181b',
    color: '#10b981',
    border: '1px solid #27272a',
    padding: '10px 18px',
    borderRadius: '24px',
    fontSize: '12.5px',
    fontWeight: '600',
    letterSpacing: '0.2px',
    zIndex: '999999',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
  });

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(8px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }, 2500);
};

export const handleShare = async (data = {}) => {
  const sharePayload = {
    title: 'CenterInsider',
    text: data.text || 'Check this out on CenterInsider!',
    url: data.url || (typeof window !== 'undefined' ? window.location.href : ''),
  };

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(sharePayload);
      return { success: true, method: 'native' };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        // Fallback to clipboard if share threw an unexpected error
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(sharePayload.url);
            showShareToast('Link copied to clipboard!');
            return { success: true, method: 'clipboard' };
          }
        } catch (clipboardErr) {
          console.error('Clipboard copy failed:', clipboardErr);
        }
      }
      return { success: false, aborted: true };
    }
  } else {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(sharePayload.url);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = sharePayload.url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showShareToast('Link copied to clipboard!');
      return { success: true, method: 'clipboard' };
    } catch (clipboardErr) {
      console.error('Clipboard copy failed:', clipboardErr);
      return { success: false, error: clipboardErr };
    }
  }
};
