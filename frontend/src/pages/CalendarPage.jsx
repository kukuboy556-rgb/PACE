import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCalendar } from '../api/client';
import { useToast } from '../components/Toast';

export default function CalendarPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();

  const getWeekRange = (offset) => {
    const start = new Date(today);
    start.setDate(start.getDate() + offset * 7 - start.getDay() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  };

  const range = getWeekRange(weekOffset);

  useEffect(() => {
    setLoading(true);
    getCalendar(range.start.toISOString().split('T')[0], range.end.toISOString().split('T')[0])
      .then(setItems)
      .catch(err => toast(err.message))
      .finally(() => setLoading(false));
  }, [weekOffset]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(range.start);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Activity Calendar</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {range.start.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} &mdash; {range.end.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="btn-secondary btn-sm">&larr; Previous</button>
          <button onClick={() => setWeekOffset(0)} className="btn-ghost btn-sm font-semibold">Today</button>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="btn-secondary btn-sm">Next &rarr;</button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-surface-border bg-slate-50/50">
            {days.map(d => (
              <div key={d} className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-surface-border last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-surface-border">
            {weekDays.map(day => {
              const dateStr = day.toISOString().split('T')[0];
              const dayItems = items.filter(i => i.due_date === dateStr);
              const isToday = dateStr === today.toISOString().split('T')[0];

              return (
                <div key={dateStr} className={`min-h-[220px] p-2 ${isToday ? 'bg-brand-50/30' : ''}`}>
                  <div className={`text-center text-sm font-bold mb-2 py-1 ${isToday ? 'text-white bg-brand-500 rounded-full w-8 h-8 inline-flex items-center justify-center mx-auto' : 'text-slate-700'}`}>
                    {day.getDate()}
                  </div>
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
      )}

      {!loading && items.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-3">This Week's Tasks</h2>
          <div className="space-y-1">
            {items.map(item => (
              <Link key={item.task_id} to={`/teams/${item.team_id}/projects/${item.project_id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-sm transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  item.flag === 'overdue' ? 'bg-red-500' :
                  item.flag === 'due-soon' ? 'bg-amber-500' :
                  item.flag === 'done' ? 'bg-emerald-500' : 'bg-slate-300'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate">{item.task_title}</p>
                  <p className="text-xs text-slate-500">{item.project_title} &middot; {item.team_name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-400">{item.due_date ? new Date(item.due_date).toLocaleDateString() : ''}</span>
                  <span className={`badge text-xs ${
                    item.flag === 'overdue' ? 'badge-red' :
                    item.flag === 'due-soon' ? 'badge-amber' :
                    item.flag === 'done' ? 'badge-green' : 'badge-gray'
                  }`}>{item.status}</span>
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
