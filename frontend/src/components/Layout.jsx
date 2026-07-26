import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { getAlerts, getUnreadCount, markAlertRead, markAllAlertsRead } from '../api/client';
import ConfirmationDialog from './ConfirmationDialog';

const navItems = [
  { label: 'Dashboard', path: '/', icon: GridIcon },
  { label: 'Teams', path: '/teams', icon: TeamIcon, pdoOnly: true },
  { label: 'Compliance', path: '/compliance', icon: ComplianceIcon },
  { label: 'SIP Tracker', path: '/sip', icon: SIPIcon },
  { label: 'Stakeholders', path: '/stakeholders', icon: StakeholderIcon },
  { label: 'Correspondence', path: '/correspondence', icon: MailIcon },
  { label: 'Calendar', path: '/calendar', icon: CalendarIcon },
  { label: 'Verification', path: '/verification', icon: VerifyIcon },
];

export default function Layout() {
  const { user, logout, isPDO, isSchoolHead } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showAlerts, setShowAlerts] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const alertRef = useRef(null);

  const loadAlerts = useCallback(async () => {
    try {
      const [a, u] = await Promise.all([getAlerts(), getUnreadCount()]);
      setAlerts(a.slice(0, 10));
      setUnread(u.count);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [location, loadAlerts]);

  useEffect(() => {
    const handleClick = (e) => { if (alertRef.current && !alertRef.current.contains(e.target)) setShowAlerts(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [location]);

  const shortcuts = useMemo(() => [
    { key: '/', handler: () => { const s = document.querySelector('[data-search-input]'); if (s) s.focus(); } },
    { key: 'Escape', handler: () => setShowAlerts(false) },
    { key: 'd', ctrl: true, handler: () => toggleTheme() },
  ], [toggleTheme]);

  useKeyboardShortcuts(shortcuts);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
    setShowLogoutConfirm(false);
  };

  const handleMarkRead = async (id) => {
    try {
      await markAlertRead(id);
      await loadAlerts();
    } catch (err) {
      console.error('Failed to mark alert read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsRead();
      await loadAlerts();
    } catch (err) {
      console.error('Failed to mark all alerts read:', err);
    }
  };

  const visibleNav = navItems.filter(item => !item.pdoOnly || isPDO);

  const sidebar = (
    <aside className="w-56 bg-sidebar-bg flex flex-col flex-shrink-0 h-full">
      <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm">P</div>
          <div>
            <span className="text-white font-bold text-base tracking-tight">PACE</span>
            <span className="block text-[10px] text-sidebar-text font-medium -mt-0.5">Coordination Engine</span>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 text-sidebar-text hover:text-white rounded-lg hover:bg-sidebar-hover transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(item => (
          <Link key={item.path} to={item.path}
            className={location.pathname === item.path ? 'sidebar-link-active' : 'sidebar-link-inactive'}>
            <item.icon />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-white/5">
        <div className="flex items-center gap-2.5 mb-2 px-1">
              <Link to="/profile" className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-400 text-sm font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-sidebar-text truncate">{user?.email}</p>
                </div>
              </Link>
        </div>
        <div className="flex items-center gap-1.5 px-1 mb-2">
          {isPDO && <span className="badge-blue text-[10px]">PDO</span>}
          {isSchoolHead && <span className="badge-purple text-[10px]">School Head</span>}
        </div>
        <button onClick={() => setShowLogoutConfirm(true)} className="sidebar-link-inactive w-full text-xs">
          <LogoutIcon /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface dark:bg-surface-dark">
      <ConfirmationDialog
        open={showLogoutConfirm}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:block ${sidebarOpen ? 'block' : 'hidden'} animate-slide-in-left lg:animate-none`}>
        {sidebar}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        {sidebar}
      </div>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white dark:bg-surface-dark-card border-b border-surface-border dark:border-surface-dark-border px-4 lg:px-6 py-2 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">
              {navItems.find(n => n.path !== '/' && (location.pathname === n.path || location.pathname.startsWith(n.path + '/')))?.label || (location.pathname === '/' ? 'Dashboard' : '')}
            </h2>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200" title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {dark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
            <div className="relative" ref={alertRef}>
              <button onClick={() => setShowAlerts(!showAlerts)} className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-surface-dark-card">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {showAlerts && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface-dark-card rounded-xl shadow-dropdown border border-surface-border dark:border-surface-dark-border z-50 max-h-96 overflow-hidden animate-slide-down">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-surface-dark-border">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</h3>
                    {unread > 0 && <button onClick={handleMarkAllRead} className="text-xs text-brand-500 hover:text-brand-700 font-semibold">Mark all read</button>}
                  </div>
                  <div className="overflow-y-auto max-h-72">
                    {alerts.length === 0 ? (
                      <p className="text-sm text-slate-400 p-6 text-center">No notifications</p>
                    ) : alerts.map(a => (
                      <Link key={a.id} to={a.link || '#'} onClick={() => handleMarkRead(a.id)}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 border-b border-surface-border dark:border-surface-dark-border last:border-0 transition-colors ${!a.is_read ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''}`}>
                        <AlertIcon type={a.type} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
                          {a.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.message}</p>}
                          <p className="text-[10px] text-slate-400 mt-1">{timeAgo(new Date(a.created_at))}</p>
                        </div>
                        {!a.is_read && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-surface-border dark:border-surface-dark-border max-w-[200px] lg:max-w-none">
              <div className="text-right min-w-0 hidden sm:block">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{isPDO ? 'PDO' : isSchoolHead ? 'School Head' : 'Coordinator'}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-7">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

function AlertIcon({ type }) {
  const colors = {
    deadline: 'text-amber-500',
    overdue: 'text-red-500',
    closure: 'text-brand-500',
    verification: 'text-emerald-500',
    info: 'text-slate-500',
  };
  return (
    <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center flex-shrink-0 ${colors[type] || colors.info}`}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {type === 'overdue' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        ) : type === 'deadline' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        ) : type === 'verification' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        ) : type === 'closure' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        )}
      </svg>
    </div>
  );
}

function timeAgo(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function GridIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function VerifyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ComplianceIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function StakeholderIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z" />
    </svg>
  );
}

function SIPIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}
