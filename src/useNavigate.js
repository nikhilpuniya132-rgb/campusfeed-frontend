/**
 * Lightweight SPA navigation hook matching useNavigate semantics
 * Enables instant URL updates and custom view synchronization
 */
export function useNavigate() {
  return (path, options = {}) => {
    if (!path) return;
    const clean = path.replace(/^\//, '');
    const targetPath = (clean === 'feed' || clean === 'poll' || clean === '') ? '/feed' : ('/' + clean);
    
    if (options.replace !== false) {
      window.history.replaceState(null, '', targetPath);
    } else {
      window.history.pushState(null, '', targetPath);
    }

    window.dispatchEvent(new CustomEvent('campus-navigate', { 
      detail: { path: targetPath, view: clean } 
    }));
  };
}

export default useNavigate;
