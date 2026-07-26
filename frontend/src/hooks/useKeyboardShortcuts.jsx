import { useEffect } from 'react';

export default function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      for (const { key, ctrl, meta, handler: fn } of shortcuts) {
        const mod = ctrl || meta;
        if (mod ? (e.ctrlKey || e.metaKey) && e.key === key : e.key === key) {
          fn(e);
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
