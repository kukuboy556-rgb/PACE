import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTeamLogs, createLog } from '../api/client';
import { useToast } from '../components/Toast';

export default function CoordinationLog() {
  const { teamId } = useParams();
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ huddleDate: '', notes: '' });

  const load = async () => {
    try {
      const data = await getTeamLogs(teamId);
      setLogs(data);
    } catch (err) { toast(err.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [teamId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createLog(teamId, form);
      setForm({ huddleDate: '', notes: '' });
      setShowForm(false);
      toast('Log entry saved', 'success');
      await load();
    } catch (err) { toast(err.message); }
  };

  return (
    <div className="space-y-6">
      <Link to={`/teams/${teamId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-600 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to team
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Coordination Log</h1>
          <p className="text-sm text-slate-500 mt-1">Record huddle notes and discussions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ New Entry'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4 animate-slide-down">
          <h3 className="font-bold text-slate-900">New Log Entry</h3>
          <div>
            <label className="label">Huddle date</label>
            <input type="date" required value={form.huddleDate} onChange={e => setForm({ ...form, huddleDate: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea required value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="textarea" rows={4} />
          </div>
          <button type="submit" className="btn-success">Save Entry</button>
        </form>
      )}

      {loading ? <Spinner /> : logs.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-sm text-slate-400">No coordination log entries yet.</p>
          <p className="text-xs text-slate-400 mt-1">Create your first entry to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <div key={log.id} className="card p-5 hover:shadow-card-hover transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{new Date(log.huddle_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="text-xs text-slate-400 block">by {log.created_by_name}</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{log.notes}</p>
              </div>
              <p className="text-xs text-slate-400 mt-3 font-medium">Logged {new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
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
