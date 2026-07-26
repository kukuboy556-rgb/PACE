import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCalendar } from '../api/client';
import { useToast } from '../components/Toast';

export default function CalendarPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();

  const getWeekRange = (offset) => {
    const start = new Date(today);
    start.setDate(start.getDate() + offset * 7 - start.getDay() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  };

  const getMonthRange = (offset) => {
    const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { start, end };
  };

  const range = view === 'week' ? getWeekRange(weekOffset) : getMonthRange(monthOffset);

  useEffect(() => {
    setLoading(true);
    getCalendar(range.start.toISOString().split('T')[0], range.end.toISOString().split('T')[0])
      .then(setItems)
      .catch(err => toast(err.message))
      .finally(() => setLoading(false));
  }, [weekOffset, monthOffset, view]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(range.start);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  const monthDays = [];
  if (view === 'month') {
    const start = new Date(range.start);
    const end = new Date(range.end);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      monthDays.push(new Date(d));
    }
    const pad = start.getDay() === 0 ? 6 : start.getDay() - 1;
    for (let i = 0; i < pad; i++) monthDays.unshift(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Activity Calendar</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {view === 'week'
              ? `${range.start.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} \u2014 ${range.end.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
              : `${range.start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5 mr-2">
            <button onClick={() => setView('week')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${view === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Week</button>
            <button onClick={() => setView('month')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${view === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Month</button>
          </div>
          <button onClick={() => { if (view === 'week') setWeekOffset(weekOffset - 1); else setMonthOffset(monthOffset - 1); }} className="btn-secondary btn-sm">&larr;</button>
          <button onClick={() => { if (view === 'week') setWeekOffset(0); else setMonthOffset(0); }} className="btn-ghost btn-sm font-semibold">Today</button>
          <button onClick={() => { if (view === 'week') setWeekOffset(weekOffset + 1); else setMonthOffset(monthOffset + 1); }} className="btn-secondary btn-sm">&rarr;</button>
        </div>
      </div>

      {loading ? <Spinner /> : view === 'week' ? (
        <>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-surface-border bg-slate-50/50">
              {days.map(d => (
                <div key={d} className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-surface-border last:border-r-0">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 divide-x divide-surface-border">
              {weekDays.map(day => {
                const dateStr = day.toISOString().split('T')[0];
                const dayItems = items.filter(i => i.due_date === dateStr);
                const isToday = dateStr === today.toISOString().split('T')[0];
                return (
                  <div key={dateStr} className={`min-h-[220px] p-2 ${isToday ? 'bg-brand-50/30' : ''}`}>
                    <div className={`text-center text-sm font-bold mb-2 py-1 ${isToday ? 'text-white bg-brand-500 rounded-full w-8 h-8 inline-flex items-center justify-center mx-auto' : 'text-slate-700'}`}>{day.getDate()}</div>
                    <div className="space-y-1">
                      {dayItems.map(item => (
                        <Link key={item.task_id} to={`/teams/${item.team_id}/projects/${item.project_id}`}
                          className={`block text-xs p-1.5 rounded-md border-l-[3px] transition-colors hover:shadow-sm ${
                            item.flag === 'overdue' ? 'border-red-500 bg-red-50 text-red-700' :
                            item.flag === 'due-soon' ? 'border-amber-500 bg-amber-50 text-amber-700' :
                            item.flag === 'done' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                            'border-slate-300 bg-slate-50 text-slate-700 hover:bg-white'
                          }`}>
                          <p className="font-semibold truncate">{item.task_title}</p>
                          <p className="truncate opacity-75 text-[10px]">{item.project_title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-surface-border bg-slate-50/50">
            <div className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-surface-border">Sun</div>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-surface-border last:border-r-0">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-surface-border">
            {monthDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/30 p-1" />;
              const dateStr = day.toISOString().split('T')[0];
              const dayItems = items.filter(it => it.due_date === dateStr);
              const isToday = dateStr === today.toISOString().split('T')[0];
              const isCurrentMonth = day.getMonth() === range.start.getMonth();
              return (
                <div key={dateStr} className={`min-h-[120px] p-1 border-b border-surface-border ${isToday ? 'bg-brand-50/30' : ''} ${!isCurrentMonth ? 'opacity-40' : ''}`}>
                  <div className={`text-xs font-bold mb-1 py-0.5 text-center ${isToday ? 'text-white bg-brand-500 rounded-full w-6 h-6 inline-flex items-center justify-center' : 'text-slate-500'}`}>{day.getDate()}</div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 3).map(item => (
                      <Link key={item.task_id} to={`/teams/${item.team_id}/projects/${item.project_id}`}
                        className={`block text-[10px] p-1 rounded border-l-2 truncate ${
                          item.flag === 'overdue' ? 'border-red-500 bg-red-50 text-red-700' :
                          item.flag === 'due-soon' ? 'border-amber-500 bg-amber-50 text-amber-700' :
                          item.flag === 'done' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                          'border-slate-300 bg-slate-50 text-slate-600'
                        }`}>{item.task_title}</Link>
                    ))}
                    {dayItems.length > 3 && <p className="text-[10px] text-slate-400 text-center">+{dayItems.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-3">All Items</h2>
          <div className="space-y-1">
            {items.map(item => (
              <Link key={item.task_id} to={`/teams/${item.team_id}/projects/${item.project_id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-sm transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.flag === 'overdue' ? 'bg-red-500' : item.flag === 'due-soon' ? 'bg-amber-500' : item.flag === 'done' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate">{item.task_title}</p>
                  <p className="text-xs text-slate-500">{item.project_title} &middot; {item.team_name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-400">{item.due_date ? new Date(item.due_date).toLocaleDateString() : ''}</span>
                  <span className={`badge text-xs ${item.flag === 'overdue' ? 'badge-red' : item.flag === 'due-soon' ? 'badge-amber' : item.flag === 'done' ? 'badge-green' : 'badge-gray'}`}>{item.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-slate-400 font-medium">Loading...</span>
      </div>
    </div>
  );
}
