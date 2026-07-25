import { useState, useEffect } from 'react';
import { getVerificationLogs, getTeams, getTeamProjects, getProjectTasks, verifyTask } from '../api/client';
import { useToast } from '../components/Toast';

export default function VerificationLog() {
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ teamId: '', from: '', to: '' });
  const [verifyForm, setVerifyForm] = useState({ teamId: '', projectId: '', taskId: '', result: 'Verified', comment: '' });
  const [message, setMessage] = useState('');

  const loadLogs = async () => {
    const params = {};
    if (filters.teamId) params.teamId = filters.teamId;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    try {
      const data = await getVerificationLogs(params);
      setLogs(data);
    } catch (err) { toast(err.message); }
    setLoading(false);
  };

  useEffect(() => { getTeams().then(setTeams).catch(() => {}); }, []);
  useEffect(() => { if (verifyForm.teamId) { getTeamProjects(verifyForm.teamId).then(setProjects); } else { setProjects([]); } setVerifyForm(f => ({ ...f, projectId: '', taskId: '' })); }, [verifyForm.teamId]);
  useEffect(() => { if (verifyForm.projectId) { getProjectTasks(verifyForm.projectId).then(setTasks); } else { setTasks([]); } setVerifyForm(f => ({ ...f, taskId: '' })); }, [verifyForm.projectId]);
  useEffect(() => { loadLogs(); }, [filters]);

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await verifyTask(verifyForm.taskId, verifyForm.result, verifyForm.comment);
      setMessage('Verification recorded successfully!');
      setVerifyForm({ teamId: '', projectId: '', taskId: '', result: 'Verified', comment: '' });
      await loadLogs();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) { toast(err.message); }
  };

  const exportCSV = () => {
    const headers = ['Task', 'Project', 'Result', 'Comment', 'Verified By', 'Date'];
    const rows = logs.map(l => [l.task_title, l.project_title, l.result, l.comment || '', l.verified_by_name, new Date(l.verified_at).toLocaleString()]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'verification_log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verification Log</h1>
          <p className="text-sm text-slate-500 mt-1">Record and export task verifications</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary btn-sm" disabled={logs.length === 0}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {message && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2.5 font-medium">
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          {message}
        </div>
      )}

      <form onSubmit={handleVerify} className="card p-5 space-y-4">
        <h2 className="font-bold text-slate-900">Record Verification</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Team</label>
            <select required value={verifyForm.teamId} onChange={e => setVerifyForm({ ...verifyForm, teamId: e.target.value })} className="select">
              <option value="">Select team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Project</label>
            <select required value={verifyForm.projectId} onChange={e => setVerifyForm({ ...verifyForm, projectId: e.target.value })} className="select">
              <option value="">Select project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Task</label>
            <select required value={verifyForm.taskId} onChange={e => setVerifyForm({ ...verifyForm, taskId: e.target.value })} className="select">
              <option value="">Select task</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Result</label>
            <select value={verifyForm.result} onChange={e => setVerifyForm({ ...verifyForm, result: e.target.value })} className="select">
              <option value="Verified">Verified</option>
              <option value="Discrepancy">Discrepancy</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Comment (optional)</label>
          <textarea placeholder="Add notes about this verification..." value={verifyForm.comment}
            onChange={e => setVerifyForm({ ...verifyForm, comment: e.target.value })} className="textarea" rows={2} />
        </div>
        <button type="submit" className="btn-primary">Submit Verification</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Filter by Team</label>
          <select value={filters.teamId} onChange={e => setFilters({ ...filters, teamId: e.target.value })} className="select">
            <option value="">All teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">From</label>
          <input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} className="input" />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} className="input" />
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-400 p-8 text-center">No verification records found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-slate-50/50">
                  <th className="table-header">Task</th>
                  <th className="table-header">Project</th>
                  <th className="table-header">Result</th>
                  <th className="table-header">Comment</th>
                  <th className="table-header">Verified by</th>
                  <th className="table-header">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell font-semibold">{l.task_title}</td>
                    <td className="table-cell text-slate-500">{l.project_title}</td>
                    <td className="table-cell">
                      <span className={`badge text-xs ${l.result === 'Verified' ? 'badge-green' : 'badge-red'}`}>{l.result}</span>
                    </td>
                    <td className="table-cell text-slate-500">{l.comment || '\u2014'}</td>
                    <td className="table-cell font-medium">{l.verified_by_name}</td>
                    <td className="table-cell text-slate-500">{new Date(l.verified_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
