import { useState, useEffect, useMemo } from 'react';
import { getComplianceForms, createComplianceForm, getComplianceSubmissions, createComplianceSubmission, updateComplianceSubmission, saveSchoolFormData, getSchoolFormData, getTeams } from '../api/client';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STATUS_COLORS = { 'Pending': 'bg-slate-100 text-slate-600', 'On Track': 'bg-blue-100 text-blue-700', 'Late': 'bg-red-100 text-red-700', 'Submitted': 'bg-emerald-100 text-emerald-700', 'Acknowledged': 'bg-purple-100 text-purple-700' };

export default function CompliancePage() {
  const toast = useToast();
  const { isPDO } = useAuth();
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('submissions');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showFormDataModal, setShowFormDataModal] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', code: '', description: '', frequency: 'Quarterly', category: 'School Form', divisionPolicy: '' });
  const [newSub, setNewSub] = useState({ formId: '', periodLabel: '', dueDate: '' });
  const [formDataEntry, setFormDataEntry] = useState({ formCode: '', periodLabel: '', data: '{}' });
  const [teams, setTeams] = useState([]);
  const [filter, setFilter] = useState({ formId: '', status: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadAll = async () => {
    try {
      const [f, s, fd, t] = await Promise.all([
        getComplianceForms(), getComplianceSubmissions(filter),
        getSchoolFormData({}), getTeams().catch(() => []),
      ]);
      setForms(f); setSubmissions(s); setFormData(fd); setTeams(t);
    } catch (err) { toast(err.message); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    getComplianceSubmissions(filter).then(setSubmissions).catch(() => {});
  }, [filter]);

  const handleCreateForm = async (e) => {
    e.preventDefault();
    try {
      await createComplianceForm(newForm);
      setNewForm({ name: '', code: '', description: '', frequency: 'Quarterly', category: 'School Form', divisionPolicy: '' });
      setShowFormModal(false);
      toast('Form created', 'success');
      await loadAll();
    } catch (err) { toast(err.message); }
  };

  const handleCreateSubmission = async (e) => {
    e.preventDefault();
    try {
      await createComplianceSubmission(newSub);
      setNewSub({ formId: '', periodLabel: '', dueDate: '' });
      setShowSubModal(false);
      toast('Submission created', 'success');
      await loadAll();
    } catch (err) { toast(err.message); }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateComplianceSubmission(id, { status });
      await loadAll();
    } catch (err) { toast(err.message); }
  };

  const handleFormDataSave = async (e) => {
    e.preventDefault();
    try {
      await saveSchoolFormData({ ...formDataEntry, data: JSON.parse(formDataEntry.data) });
      setShowFormDataModal(false);
      toast('Form data saved', 'success');
      await loadAll();
    } catch (err) { toast(err.message); }
  };

  if (loading) return <Spinner />;

  const now = new Date();
  const overdue = submissions.filter(s => s.status !== 'Submitted' && s.status !== 'Acknowledged' && new Date(s.due_date) < now);

  const filteredSubmissions = useMemo(() => {
    const q = search.toLowerCase();
    return q ? submissions.filter(s => (s.form_name || '').toLowerCase().includes(q) || (s.form_code || '').toLowerCase().includes(q) || (s.period_label || '').toLowerCase().includes(q)) : submissions;
  }, [submissions, search]);
  const submissionTotalPages = Math.ceil(filteredSubmissions.length / PAGE_SIZE);
  const pagedSubmissions = filteredSubmissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabs = [
    { key: 'submissions', label: 'Submissions', icon: CheckIcon },
    { key: 'forms', label: 'Form Templates', icon: FileIcon },
    { key: 'data', label: 'Form Data', icon: DataIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">School Forms & Compliance</h1>
          <p className="text-sm text-slate-500 mt-1">Track SDO submissions, manage compliance deadlines, and generate school forms</p>
        </div>
        <div className="flex items-center gap-2">
          {overdue.length > 0 && <span className="badge-red text-xs">{overdue.length} overdue</span>}
        </div>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl border border-surface-border p-1.5">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={tab === t.key ? 'tab-btn-active' : 'tab-btn-inactive'}>
              <t.icon /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tab === 'submissions' && (
            <button onClick={() => setShowSubModal(true)} className="btn-primary btn-sm">+ New Submission</button>
          )}
          {tab === 'forms' && isPDO && (
            <button onClick={() => setShowFormModal(true)} className="btn-primary btn-sm">+ New Form</button>
          )}
          {tab === 'data' && (
            <button onClick={() => setShowFormDataModal(true)} className="btn-primary btn-sm">Enter Data</button>
          )}
        </div>
      </div>

      {showFormModal && (
        <form onSubmit={handleCreateForm} className="card p-5 space-y-4 animate-slide-down">
          <h3 className="font-bold text-slate-900">New Compliance Form Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Form name (e.g. SF1 - School Register)" value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} className="input" />
            <input required placeholder="Code (e.g. SF1)" value={newForm.code} onChange={e => setNewForm({ ...newForm, code: e.target.value })} className="input" />
            <textarea placeholder="Description" value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} className="textarea" rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Frequency</label>
                <select value={newForm.frequency} onChange={e => setNewForm({ ...newForm, frequency: e.target.value })} className="select">
                  <option>Monthly</option><option>Quarterly</option><option>Semestral</option><option>Annual</option><option>Ad-hoc</option>
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select value={newForm.category} onChange={e => setNewForm({ ...newForm, category: e.target.value })} className="select">
                  <option>School Form</option><option>Compliance Report</option><option>Division Requirement</option><option>Other</option>
                </select>
              </div>
            </div>
            <input placeholder="Division policy reference (optional)" value={newForm.divisionPolicy} onChange={e => setNewForm({ ...newForm, divisionPolicy: e.target.value })} className="input md:col-span-2" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary btn-sm">Create Form</button>
            <button type="button" onClick={() => setShowFormModal(false)} className="btn-secondary btn-sm">Cancel</button>
          </div>
        </form>
      )}

      {showSubModal && (
        <form onSubmit={handleCreateSubmission} className="card p-5 space-y-4 animate-slide-down">
          <h3 className="font-bold text-slate-900">New Submission Tracker</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Form</label>
              <select required value={newSub.formId} onChange={e => setNewSub({ ...newSub, formId: e.target.value })} className="select">
                <option value="">Select form...</option>
                {forms.map(f => <option key={f.id} value={f.id}>{f.code} - {f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Period label</label>
              <input required placeholder="e.g. Q1 2025-2026" value={newSub.periodLabel} onChange={e => setNewSub({ ...newSub, periodLabel: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Due date</label>
              <input required type="date" value={newSub.dueDate} onChange={e => setNewSub({ ...newSub, dueDate: e.target.value })} className="input" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary btn-sm">Create</button>
            <button type="button" onClick={() => setShowSubModal(false)} className="btn-secondary btn-sm">Cancel</button>
          </div>
        </form>
      )}

      {showFormDataModal && (
        <form onSubmit={handleFormDataSave} className="card p-5 space-y-4 animate-slide-down">
          <h3 className="font-bold text-slate-900">Enter School Form Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Form code</label>
              <input required placeholder="e.g. SF1" value={formDataEntry.formCode} onChange={e => setFormDataEntry({ ...formDataEntry, formCode: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Period</label>
              <input required placeholder="e.g. Q1 2025-2026" value={formDataEntry.periodLabel} onChange={e => setFormDataEntry({ ...formDataEntry, periodLabel: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Data (JSON)</label>
            <textarea required value={formDataEntry.data} onChange={e => setFormDataEntry({ ...formDataEntry, data: e.target.value })} className="textarea font-mono text-xs" rows={6} />
            <p className="text-xs text-slate-400 mt-1">Enter form data as JSON. Use the structure matching your form template.</p>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary btn-sm">Save Data</button>
            <button type="button" onClick={() => setShowFormDataModal(false)} className="btn-secondary btn-sm">Cancel</button>
          </div>
        </form>
      )}

      {tab === 'submissions' && (
        <div>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-xs font-semibold text-slate-500">Form:</label>
              <select value={filter.formId} onChange={e => { setFilter({ ...filter, formId: e.target.value }); setPage(1); }} className="select text-xs max-w-[180px] py-1.5">
                <option value="">All forms</option>
                {forms.map(f => <option key={f.id} value={f.id}>{f.code} - {f.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-xs font-semibold text-slate-500">Status:</label>
              <select value={filter.status} onChange={e => { setFilter({ ...filter, status: e.target.value }); setPage(1); }} className="select text-xs max-w-[140px] py-1.5">
                <option value="">All</option>
                <option>Pending</option><option>On Track</option><option>Late</option><option>Submitted</option><option>Acknowledged</option>
              </select>
            </div>
            <div className="flex-1 max-w-xs"><SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search submissions..." /></div>
          </div>
          <div className="card overflow-hidden">
            {filteredSubmissions.length === 0 ? (
              <p className="text-sm text-slate-400 p-8 text-center">No submissions found. Create your first submission tracker.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border bg-slate-50/50">
                    <th className="table-header">Form</th>
                    <th className="table-header">Period</th>
                    <th className="table-header">Due Date</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Submitted</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {pagedSubmissions.map(s => {
                    const isLate = s.status !== 'Submitted' && s.status !== 'Acknowledged' && new Date(s.due_date) < now;
                    return (
                      <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${isLate ? 'bg-red-50/30' : ''}`}>
                        <td className="table-cell font-semibold">{s.form_name} <span className="text-slate-400 font-normal">({s.form_code})</span></td>
                        <td className="table-cell">{s.period_label}</td>
                        <td className="table-cell">{new Date(s.due_date).toLocaleDateString()}</td>
                        <td className="table-cell">
                          <span className={`badge text-xs ${STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-600'}`}>{s.status}</span>
                        </td>
                        <td className="table-cell text-slate-500">{s.submitter_name ? `${s.submitter_name} ${new Date(s.submitted_at).toLocaleDateString()}` : '\u2014'}</td>
                        <td className="table-cell">
                          <select value={s.status} onChange={e => handleStatusUpdate(s.id, e.target.value)}
                            className="text-xs border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600 bg-white">
                            <option>Pending</option><option>On Track</option><option>Late</option><option>Submitted</option><option>Acknowledged</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <Pagination page={page} totalPages={submissionTotalPages} onChange={setPage} />
          </div>
        </div>
      )}

      {tab === 'forms' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map(f => (
            <div key={f.id} className="card p-5 hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="badge-orange text-xs">{f.code}</span>
                  <h3 className="font-bold text-slate-900 mt-2">{f.name}</h3>
                </div>
              </div>
              {f.description && <p className="text-xs text-slate-500 mb-3">{f.description}</p>}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">{f.frequency}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">{f.category}</span>
              </div>
              {f.division_policy && <p className="text-xs text-slate-400 mt-2">Policy: {f.division_policy}</p>}
            </div>
          ))}
          {forms.length === 0 && <p className="text-sm text-slate-400 col-span-full">No form templates yet.</p>}
        </div>
      )}

      {tab === 'data' && (
        <div className="card overflow-hidden">
          {formData.length === 0 ? (
            <p className="text-sm text-slate-400 p-8 text-center">No form data entries yet. Click "Enter Data" to add one.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-slate-50/50">
                  <th className="table-header">Form Code</th>
                  <th className="table-header">Period</th>
                  <th className="table-header">Submitted By</th>
                  <th className="table-header">Last Updated</th>
                  <th className="table-header">Data Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {formData.map(fd => (
                  <tr key={fd.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-cell font-semibold"><span className="badge-orange text-xs">{fd.form_code}</span></td>
                    <td className="table-cell">{fd.period_label}</td>
                    <td className="table-cell">{fd.submitter_name || '\u2014'}</td>
                    <td className="table-cell text-slate-500">{new Date(fd.updated_at).toLocaleString()}</td>
                    <td className="table-cell text-slate-500 font-mono text-xs max-w-[200px] truncate">{JSON.stringify(fd.data).slice(0, 80)}...</td>
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

function CheckIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function FileIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>; }
function DataIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>; }
