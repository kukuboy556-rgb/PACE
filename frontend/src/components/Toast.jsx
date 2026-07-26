import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

function genId() {
  return crypto.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2));
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  useEffect(() => {
    return () => { Object.values(timersRef.current).forEach(clearTimeout); };
  }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
    delete timersRef.current[id];
  }, []);

  const show = useCallback((message, type = 'error', action) => {
    const id = genId();
    const duration = action ? 6000 : 4000;
    setToasts(prev => [...prev, { id, message, type, action }]);
    timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const undo = useCallback((id) => {
    const toast = toasts.find(t => t.id === id);
    if (toast?.action?.onUndo) toast.action.onUndo();
    dismiss(id);
  }, [toasts, dismiss]);

  return (
    <ToastContext.Provider value={{ show, dismiss, undo }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full">
        {toasts.map(t => (
          <div key={t.id}
            className={`animate-slide-up px-4 py-3 rounded-xl shadow-dropdown text-sm text-white flex items-center gap-2.5 ${
              t.type === 'error' ? 'bg-red-500' : t.type === 'undo' ? 'bg-slate-800' : 'bg-emerald-500'
            }`}>
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              {t.type === 'error' ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <span className="font-medium flex-1">{t.message}</span>
            {t.action && (
              <button onClick={() => undo(t.id)} className="text-xs font-bold uppercase tracking-wider hover:opacity-80 flex-shrink-0">
                {t.action.label || 'Undo'}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
