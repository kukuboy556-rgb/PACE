import { useState, useEffect } from 'react';
import { getTeams, getStakeholders, createStakeholder, updateStakeholder, deleteStakeholder, getEngagementLogs, createEngagementLog } from '../api/client';
import { useToast } from '../components/Toast';

const TYPES = ['Parent', 'Community', 'LGU', 'NGO', 'Private Sector', 'SDO', 'Other'];
const ENGAGEMENT_TYPES = ['Meeting', 'Orientation', 'Consultation', 'Mobilization', 'Advocacy', 'Referral', 'Other'];
const TYPE_COLORS = { Parent: 'badge-blue', Community: 'badge-green', LGU: 'badge-amber', NGO: 'badge-purple', 'Private Sector': 'badge-orange', SDO: 'badge-red', Other: 'badge-gray' };

export default function StakeholderPage() {
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [stakeholders, setStakeholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEngage, setShowEngage] = useState(null);
  const [selected, setSelected] = useState(null);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ teamId: '', name: '', organization: '', type: 'Community', contactPerson: '', contactNumber: '', email: '', address: '', notes: '' });
  const [engageForm, setEngageForm] = useState({ engagementDate: '', engagementType: 'Meeting', notes: '', outcome: '' });
  const [filter, setFilter] = useState('');

  useEffect(() => { getTeams().then(setTeams).catch(() => {}).finally(() => setLoading(false)); }, []);

  const loadStakeholders = async () => {
    if (!selectedTeam) return;
    try {
      const s = await getStakeholders({ teamId: selectedTeam, type: filter || undefined });
      setStakeholders(s);
    } catch (err) { toast(err.message); }
  };

  useEffect(() => { loadStakeholders(); }, [selectedTeam, filter]);

  const loadLogs = async (id) => {
    try { const l = await getEngagementLogs({ stakeholderId: id }); setLogs(l); } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createStakeholder(form);
      setForm({ teamId: selectedTeam, name: '', organization: '', type: 'Community', contactPerson: '', contactNumber: '', email: '', address: '', notes: '' });
      setShowForm(false);
      toast('Stakeholder added', 'success');
      await loadStakeholders();
    } catch (err) { toast(err.message); }
  };

  const handleEngage = async (e) => {
    e.preventDefault();
    try {
      await createEngagementLog({ ...engageForm, stakeholderId: showEngage.id });
      setEngageForm({ engagementDate: '', engagementType: 'Meeting', notes: '', outcome: '' });
      setShowEngage(null);
      toast('Engagement logged', 'success');
      await loadStakeholders();
      if (selected?.id === showEngage.id) await loadLogs(showEngage.id);
    } catch (err) { toast(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this stakeholder?')) return;
    try { await deleteStakeholder(id); setSelected(null); await loadStakeholders(); } catch (err) { toast(err.message); }
  };

  const selectStakeholder = async (s) => {
    setSelected(s);
    await loadLogs(s.id);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stakeholder Engagement</h1>
          <p className="text-sm text-slate-500 mt-1">Directory of partners, parents, LGUs, NGOs, and SDO contacts</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white rounded-xl border border-surface-border p-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Team:</label>
          <select value={selectedTeam} onChange={e => { setSelectedTeam(e.target.value); setSelected(null); }} className="select text-sm py-1.5 max-w-[200px]">
            <option value="">Select team...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        {selectedTeam && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Type:</label>
              <select value={filter} onChange={e => setFilter(e.target.value)} className="select text-sm py-1.5 max-w-[150px]">
                <option value="">All</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={() => { setForm({ ...form, teamId: selectedTeam }); setShowForm(true); }} className="btn-primary btn-sm ml-auto">+ Add Stakeholder</button>
          </>
        )}
      </div>

      {!selectedTeam ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <p className="text-sm text-slate-500">Select a team to view stakeholders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Directory ({stakeholders.length})</h2>
            {stakeholders.length === 0 ? (
              <div className="card p-6 text-center"><p className="text-sm text-slate-400">No stakeholders yet.</p></div>
            ) : stakeholders.map(s => (
              <div key={s.id} onClick={() => selectStakeholder(s)}
                className={`card p-4 cursor-pointer transition-all hover:shadow-card-hover ${selected?.id === s.id ? 'ring-2 ring-brand-500' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900">{s.name}</h3>
                    {s.organization && <p className="text-xs text-slate-500">{s.organization}</p>}
                  </div>
                  <span className={`badge text-xs ${TYPE_COLORS[s.type] || 'badge-gray'}`}>{s.type}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {s.contact_person && <span>Contact: {s.contact_person}</span>}
                  {s.contact_number && <span>Tel: {s.contact_number}</span>}
                  {s.email && <span className="truncate">{s.email}</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>{s.engagementCount || 0} engagements</span>
                  {s.lastEngagement && <span>Last: {new Date(s.lastEngagement).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>

          <div>
            {selected ? (
              <div className="space-y-4">
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900">{selected.name}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => { setEngageForm({ ...engageForm, engagementDate: new Date().toISOString().split('T')[0] }); setShowEngage(selected); }} className="btn-primary btn-sm">Log Engagement</button>
                      <button onClick={() => handleDelete(selected.id)} className="btn-ghost btn-sm text-red-500">Delete</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-slate-500 font-semibold">Organization</p><p className="font-medium">{selected.organization || '\u2014'}</p></div>
                    <div><p className="text-xs text-slate-500 font-semibold">Type</p><p className="font-medium">{selected.type}</p></div>
                    <div><p className="text-xs text-slate-500 font-semibold">Contact Person</p><p className="font-medium">{selected.contact_person || '\u2014'}</p></div>
                    <div><p className="text-xs text-slate-500 font-semibold">Contact #</p><p className="font-medium">{selected.contact_number || '\u2014'}</p></div>
                    <div className="col-span-2"><p className="text-xs text-slate-500 font-semibold">Email</p><p className="font-medium">{selected.email || '\u2014'}</p></div>
                    {selected.address && <div className="col-span-2"><p className="text-xs text-slate-500 font-semibold">Address</p><p className="font-medium">{selected.address}</p></div>}
                    {selected.notes && <div className="col-span-2"><p className="text-xs text-slate-500 font-semibold">Notes</p><p className="text-slate-600">{selected.notes}</p></div>}
                  </div>
                </div>

                {showEngage && (
                  <form onSubmit={handleEngage} className="card p-4 space-y-3 animate-slide-down">
                    <h4 className="font-bold text-sm text-slate-900">Log Engagement with {showEngage.name}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Date</label>
                        <input required type="date" value={engageForm.engagementDate} onChange={e => setEngageForm({ ...engageForm, engagementDate: e.target.value })} className="input" />
                      </div>
                      <div>
                        <label className="label">Type</label>
                        <select value={engageForm.engagementType} onChange={e => setEngageForm({ ...engageForm, engagementType: e.target.value })} className="select">
                          {ENGAGEMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">Notes</label>
                      <textarea required value={engageForm.notes} onChange={e => setEngageForm({ ...engageForm, notes: e.target.value })} className="textarea" rows={2} />
                    </div>
                    <div>
                      <label className="label">Outcome (optional)</label>
                      <textarea value={engageForm.outcome} onChange={e => setEngageForm({ ...engageForm, outcome: e.target.value })} className="textarea" rows={2} />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-success btn-sm">Save Engagement</button>
                      <button type="button" onClick={() => setShowEngage(null)} className="btn-secondary btn-sm">Cancel</button>
                    </div>
                  </form>
                )}

                <div className="card p-5">
                  <h4 className="font-bold text-sm text-slate-900 mb-3">Engagement History</h4>
                  {logs.length === 0 ? (
                    <p className="text-sm text-slate-400">No engagements logged yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.map(l => (
                        <div key={l.id} className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="badge text-xs">{l.engagement_type}</span>
                            <span className="text-xs text-slate-400">{new Date(l.engagement_date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-slate-700">{l.notes}</p>
                          {l.outcome && <p className="text-xs text-slate-500 mt-1 italic">Outcome: {l.outcome}</p>}
                          <p className="text-xs text-slate-400 mt-1">by {l.conducted_by_name || 'Unknown'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-10 text-center">
                <p className="text-sm text-slate-400">Select a stakeholder to view details and engagement history.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-xl mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-surface-border"><h2 className="font-bold text-slate-900">New Stakeholder</h2></div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Stakeholder name" />
                </div>
                <div>
                  <label className="label">Organization</label>
                  <input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} className="input" placeholder="e.g. Barangay Hall" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="select">{TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </div>
                <div>
                  <label className="label">Contact Person</label>
                  <input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Contact Number</label>
                  <input value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="label">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="label">Address</label>
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="label">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="textarea" rows={2} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary">Add Stakeholder</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
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
