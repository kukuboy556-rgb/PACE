import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account settings</p>
      </div>

      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-surface-border dark:border-surface-dark-border">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-2xl font-bold">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Display name</label>
            <input type="text" defaultValue={user.name} className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" defaultValue={user.email} className="input" disabled />
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dark mode</p>
              <p className="text-xs text-slate-400">Switch between light and dark themes</p>
            </div>
            <button type="button" onClick={toggle}
              className={`relative w-11 h-6 rounded-full transition-colors ${dark ? 'bg-brand-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${dark ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary btn-sm">
              {saved ? 'Saved!' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Keyboard shortcuts</h3>
        <div className="space-y-2 text-sm">
          {[
            { key: 'g then d', label: 'Go to Dashboard' },
            { key: 'g then t', label: 'Go to Teams' },
            { key: 'g then c', label: 'Go to Calendar' },
            { key: '/', label: 'Focus search' },
            { key: 'n', label: 'New item (varies by page)' },
            { key: 'Escape', label: 'Close modal / cancel' },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-slate-500">{s.label}</span>
              <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-500">{s.key}</kbd>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Sign out</h3>
        <p className="text-xs text-slate-400 mb-3">Sign out of your account on this device</p>
        <button onClick={logout} className="btn-danger btn-sm">Sign out</button>
      </div>
    </div>
  );
}
