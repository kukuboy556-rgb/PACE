import { useState, useEffect } from 'react';
import { getTeams, getCorrespondence, createCorrespondence, updateCorrespondence, deleteCorrespondence } from '../api/client';
import { useToast } from '../components/Toast';

const CATEGORIES = ['General', 'Request', 'Report', 'Memo', 'Endorsement', 'Transmittal', 'Others'];
const STATUSES = ['Draft', 'Sent', 'Received', 'For Follow-up', 'Closed', 'Archived'];
const STATUS_COLORS = { Draft: 'badge-gray', Sent: 'badge-blue', Received: 'badge-green', 'For Follow-up': 'badge-amber', Closed: 'badge-purple', Archived: 'badge-red' };

export default function CorrespondencePage() {
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ type: '', status: '', category: '' });
  const [form, setForm] = useState({ teamId: '', type: 'Outgoing', date: new Date().toISOString().split('T')[0], subject: '', recipientOrSender: '', referenceNumber: '', category: 'General', status: 'Draft', content: '' });

  useEffect(() => { getTeams().then(setTeams).catch(() => {}).finally(() => setLoading(false)); }, []);

  const loadItems = async () => {
    if (!selectedTeam) return;
    try {
      const data = await getCorrespondence({ teamId: selectedTeam, ...filters });
      setItems(data);
    } catch (err) { toast(err.message); }
  };

  useEffect(() => { loadItems(); }, [selectedTeam, filters]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateCorrespondence(editing.id, form);
        toast('Correspondence updated', 'success');
      } else {
        await createCorrespondence(form);
        toast('Correspondence created', 'success');
      }
      setForm({ teamId: selectedTeam, type: 'Outgoing', date: new Date().toISOString().split('T')[0], subject: '', recipientOrSender: '', referenceNumber: '', category: 'General', status: 'Draft', content: '' });
      setShowForm(false); setEditing(null);
      await loadItems();
    } catch (err) { toast(err.message); }
  };

  const handleEdit = (item) => {
    setForm({
      teamId: item.team_id, type: item.type, date: item.date?.split('T')[0] || '', subject: item.subject,
      recipientOrSender: item.recipient_or_sender, referenceNumber: item.reference_number || '',
      category: item.category, status: item.status, content: item.content || '',
    });
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this correspondence?')) return;
    try { await deleteCorrespondence(id); await loadItems(); } catch (err) { toast(err.message); }
  };

  const handleStatusUpdate = async (id, status) => {
    try { await updateCorrespondence(id, { status }); await loadItems(); } catch (err) { toast(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Correspondence Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Track communications, memos, reports, and endorsements</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white rounded-xl border border-surface-border p-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Team:</label>
          <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="select text-sm py-1.5 max-w-[180px]">
            <option value="">Select team...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {selectedTeam && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Type:</label>
              <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} className="select text-xs py-1.5 max-w-[100px]">
                <option value="">All</option><option>Outgoing</option><option>Incoming</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Status:</label>
              <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="select text-xs py-1.5 max-w-[120px]">
                <option value="">All</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Category:</label>
              <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="select text-xs py-1.5 max-w-[120px]">
                <option value="">All</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={() => { setEditing(null); setForm({ ...form, teamId: selectedTeam }); setShowForm(true); }} className="btn-primary btn-sm ml-auto">+ New</button>
          </>
        )}
      </div>

      {!selectedTeam ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z" /></svg>
          </div>
          <p className="text-sm text-slate-500">Select a team to view correspondence.</p>
        </div>
      ) : (
        <>
          {showForm && (
            <form onSubmit={handleSave} className="card p-5 space-y-4 animate-slide-down">
              <h3 className="font-bold text-slate-900">{editing ? 'Edit Correspondence' : 'New Correspondence'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="select">
                    <option>Outgoing</option><option>Incoming</option>
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="select">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Subject *</label>
                  <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="input" placeholder="Subject line" />
                </div>
                <div>
                  <label className="label">Ref #</label>
                  <input value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} className="input" placeholder="Optional" />
                </div>
                <div className="md:col-span-2">
                  <label className="label">{form.type === 'Outgoing' ? 'Recipient' : 'Sender'} *</label>
                  <input required value={form.recipientOrSender} onChange={e => setForm({ ...form, recipientOrSender: e.target.value })} className="input" placeholder={form.type === 'Outgoing' ? 'To whom sent' : 'From whom received'} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="select">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="label">Content (optional)</label>
                  <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="textarea" rows={3} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary btn-sm">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary btn-sm">Cancel</button>
              </div>
            </form>
          )}

          <div className="card overflow-hidden">
            {items.length === 0 ? (
              <p className="text-sm text-slate-400 p-8 text-center">No correspondence found. Create your first entry.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border bg-slate-50/50">
                    <th className="table-header">Date</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Subject</th>
                    <th className="table-header">Recipient/Sender</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-cell font-medium text-slate-600">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="table-cell">
                        <span className={`badge text-xs ${item.type === 'Outgoing' ? 'badge-blue' : 'badge-amber'}`}>{item.type}</span>
                      </td>
                      <td className="table-cell font-semibold max-w-[250px] truncate" title={item.subject}>{item.subject}</td>
                      <td className="table-cell text-slate-600">{item.recipient_or_sender}</td>
                      <td className="table-cell"><span className="badge-gray text-xs">{item.category}</span></td>
                      <td className="table-cell">
                        <select value={item.status} onChange={e => handleStatusUpdate(item.id, e.target.value)}
                          className={`text-xs border border-slate-200 rounded-md px-1.5 py-0.5 ${STATUS_COLORS[item.status] || 'text-slate-600'} bg-white`}>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(item)} className="text-xs text-brand-500 hover:text-brand-700 font-semibold">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-6 w-6 text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs text-slate-400 font-medium">Loading...</span>
      </div>
    </div>
  );
}
