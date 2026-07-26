import { useEffect, useRef } from 'react';

export default function ConfirmationDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-overlay animate-fade-in z-[60]" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-modal border border-surface-border w-full max-w-sm animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${variant === 'danger' ? 'bg-red-100' : variant === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
              {variant === 'danger' ? (
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              {message && <p className="text-sm text-slate-500 mt-0.5">{message}</p>}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 pb-4">
          <button onClick={onCancel} className="btn-secondary btn-sm">{cancelLabel}</button>
          <button ref={confirmRef} onClick={onConfirm} className={`btn-sm ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
