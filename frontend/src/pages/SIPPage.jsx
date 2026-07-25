import { useState, useEffect } from 'react';
import { getTeams, getSipGoals, createSipGoal, getSipGoal, updateSipGoal, deleteSipGoal, createSipActivity, updateSipActivity, createSipBudgetLine, updateSipBudgetLine, getSipSummary, savePhysicalFinancial, getPhysicalFinancial } from '../api/client';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';

const PRIORITY_AREAS = ['Access', 'Quality', 'Governance', 'Equity', 'Resilience'];
const STATUS_COLORS = { 'Not Started': 'badge-gray', 'In Progress': 'badge-blue', 'Completed': 'badge-green', 'Delayed': 'badge-red', 'Cancelled': 'badge-amber' };

export default function SIPPage() {
  const toast = useToast();
  const { isPDO } = useAuth();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [schoolYear, setSchoolYear] = useState('2025-2026');
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pfRecords, setPfRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showPfForm, setShowPfForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ teamId: '', schoolYear: '2025-2026', goal: '', priorityArea: 'Access', targetMetric: '', baselineValue: '', targetValue: '', targetDate: '' });
  const [activityForm, setActivityForm] = useState({ goalId: '', activity: '', quarter: 1, responsiblePerson: '', targetCompletion: '' });
  const [pfForm, setPfForm] = useState({ teamId: '', schoolYear: '2025-2026', month: new Date().getMonth() + 1, fundSource: 'MOOE', physicalAccomplishment: '', financialObligation: '', financialDisbursement: '' });

  useEffect(() => {
    getTeams().then(setTeams).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadGoals = async () => {
    if (!selectedTeam || !schoolYear) return;
    try {
      const [g, s, pf] = await Promise.all([
        getSipGoals({ teamId: selectedTeam, schoolYear }),
        getSipSummary({ teamId: selectedTeam, schoolYear }),
        getPhysicalFinancial({ teamId: selectedTeam, schoolYear }),
      ]);
      setGoals(g); setSummary(s); setPfRecords(pf);
    } catch (err) { toast(err.message); }
  };

  useEffect(() => { loadGoals(); }, [selectedTeam, schoolYear]);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await createSipGoal(goalForm);
      setShowGoalForm(false);
      setGoalForm({ teamId: selectedTeam, schoolYear, goal: '', priorityArea: 'Access', targetMetric: '', baselineValue: '', targetValue: '', targetDate: '' });
      toast('Goal created', 'success');
      await loadGoals();
    } catch (err) { toast(err.message); }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      await createSipActivity(activityForm);
      setShowActivityForm(false);
      setActivityForm({ goalId: selectedGoal?.id || '', activity: '', quarter: 1, responsiblePerson: '', targetCompletion: '' });
      toast('Activity added', 'success');
      const g = await getSipGoal(selectedGoal.id);
      setSelectedGoal(g);
    } catch (err) { toast(err.message); }
  };

  const handleUpdateActivityStatus = async (id, status) => {
    try {
      await updateSipActivity(id, { status });
      const g = await getSipGoal(selectedGoal.id);
      setSelectedGoal(g);
    } catch (err) { toast(err.message); }
  };

  const handleUpdateBudget = async (id, data) => {
    try {
      await updateSipBudgetLine(id, data);
      const g = await getSipGoal(selectedGoal.id);
      setSelectedGoal(g);
      await loadGoals();
    } catch (err) { toast(err.message); }
  };

  const handleSavePf = async (e) => {
    e.preventDefault();
    try {
      await savePhysicalFinancial({
        ...pfForm,
        physicalAccomplishment: parseFloat(pfForm.physicalAccomplishment) || 0,
        financialObligation: parseFloat(pfForm.financialObligation) || 0,
        financialDisbursement: parseFloat(pfForm.financialDisbursement) || 0,
      });
      setShowPfForm(false);
      setPfForm({ teamId: selectedTeam, schoolYear, month: new Date().getMonth() + 1, fundSource: 'MOOE', physicalAccomplishment: '', financialObligation: '', financialDisbursement: '' });
      toast('Record saved', 'success');
      await loadGoals();
    } catch (err) { toast(err.message); }
  };

  const loadGoalDetail = async (goal) => {
    try {
      const g = await getSipGoal(goal.id);
      setSelectedGoal(g);
    } catch (err) { toast(err.message); }
  };

  const handleDeleteGoal = async (id) => {
    if (!confirm('Delete this goal and all its activities?')) return;
    try {
      await deleteSipGoal(id);
      setSelectedGoal(null);
      await loadGoals();
      toast('Goal deleted', 'success');
    } catch (err) { toast(err.message); }
  };

  if (loading) return <Spinner />;

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: GridIcon },
    { key: 'goals', label: 'Goals & AIP', icon: GoalIcon },
    { key: 'pf', label: 'Physical & Financial', icon: ChartIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">School Improvement Plan</h1>
          <p className="text-sm text-slate-500 mt-1">SIP goals, AIP activities, budget utilization, and physical & financial tracking</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white rounded-xl border border-surface-border p-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Team:</label>
          <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="select text-sm py-1.5 max-w-[200px]">
            <option value="">Select team...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">School Year:</label>
          <select value={schoolYear} onChange={e => setSchoolYear(e.target.value)} className="select text-sm py-1.5 max-w-[140px]">
            {['2024-2025','2025-2026','2026-2027'].map(y => <option key={y}>{y}</option>)}
          </select>
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
        {selectedTeam && tab === 'goals' && (
          <button onClick={() => { setGoalForm({ ...goalForm, teamId: selectedTeam, schoolYear }); setShowGoalForm(true); }} className="btn-primary btn-sm">+ New Goal</button>
        )}
        {selectedTeam && tab === 'pf' && (
          <button onClick={() => { setPfForm({ ...pfForm, teamId: selectedTeam, schoolYear }); setShowPfForm(true); }} className="btn-primary btn-sm">+ Add Record</button>
        )}
      </div>

      {!selectedTeam ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-sm text-slate-500">Select a team and school year to get started.</p>
        </div>
      ) : (
        <>
          {tab === 'dashboard' && summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card bg-gradient-to-br from-brand-500 to-brand-600">
                  <svg className="w-5 h-5 text-white/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-3xl font-extrabold tracking-tight">{summary.goals}</p>
                  <p className="text-sm text-white/70 mt-0.5 font-medium">SIP Goals</p>
                </div>
                <div className="stat-card bg-gradient-to-br from-slate-700 to-slate-800">
                  <svg className="w-5 h-5 text-white/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-3xl font-extrabold tracking-tight">&#8369;{summary.totalAllocated.toLocaleString()}</p>
                  <p className="text-sm text-white/70 mt-0.5 font-medium">Total Budget</p>
                </div>
                <div className="stat-card bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <svg className="w-5 h-5 text-white/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-3xl font-extrabold tracking-tight">&#8369;{summary.totalDisbursed.toLocaleString()}</p>
                  <p className="text-sm text-white/70 mt-0.5 font-medium">Disbursed</p>
                </div>
                <div className="stat-card bg-gradient-to-br from-blue-600 to-blue-700">
                  <svg className="w-5 h-5 text-white/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                  <p className="text-3xl font-extrabold tracking-tight">{summary.utilizationRate}%</p>
                  <p className="text-sm text-white/70 mt-0.5 font-medium">Utilization Rate</p>
                </div>
              </div>

              {summary.physicalFinancial?.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Physical & Financial by Fund Source</h2>
                    <div className="h-px flex-1 bg-surface-border" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {summary.physicalFinancial.map(pf => {
                      const rate = pf.total_obligation > 0 ? Math.round((pf.total_disbursement / pf.total_obligation) * 100) : 0;
                      return (
                        <div key={pf.fund_source} className="card p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-900">{pf.fund_source}</h3>
                            <span className="text-xs text-slate-500">{pf.total_physical}% physical</span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Financial Obligation</span>
                                <span className="font-semibold text-slate-700">&#8369;{parseFloat(pf.total_obligation).toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-brand-500 rounded-full h-2 transition-all" style={{ width: `${Math.min(rate, 100)}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Disbursed</span>
                                <span className="font-semibold text-slate-700">&#8369;{parseFloat(pf.total_disbursement).toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-emerald-500 rounded-full h-2 transition-all" style={{ width: `${Math.min(rate, 100)}%` }} />
                              </div>
                            </div>
                            <p className="text-right text-xs font-bold text-slate-600">{rate}% disbursed</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'goals' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">SIP Goals</h2>
                {goals.length === 0 ? (
                  <div className="card p-8 text-center">
                    <p className="text-sm text-slate-400">No goals yet. Create your first SIP goal.</p>
                  </div>
                ) : goals.map(g => (
                  <div key={g.id}
                    className={`card p-4 cursor-pointer transition-all duration-200 hover:shadow-card-hover ${selectedGoal?.id === g.id ? 'ring-2 ring-brand-500' : ''}`}
                    onClick={() => loadGoalDetail(g)}>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`badge text-xs ${g.priority_area === 'Access' ? 'badge-blue' : g.priority_area === 'Quality' ? 'badge-green' : g.priority_area === 'Governance' ? 'badge-purple' : g.priority_area === 'Equity' ? 'badge-amber' : 'badge-orange'}`}>{g.priority_area}</span>
                      <button onClick={e => { e.stopPropagation(); handleDeleteGoal(g.id); }} className="text-slate-300 hover:text-red-500 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{g.goal}</p>
                    {(g.target_metric || g.target_value) && (
                      <p className="text-xs text-slate-500 mt-1">Target: {g.target_metric} = {g.target_value} {g.baseline_value ? `(baseline: ${g.baseline_value})` : ''}</p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                {selectedGoal ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-900">AIP Activities</h2>
                      <button onClick={() => { setActivityForm({ ...activityForm, goalId: selectedGoal.id }); setShowActivityForm(true); }} className="btn-primary btn-sm">+ Activity</button>
                    </div>
                    {showActivityForm && (
                      <form onSubmit={handleCreateActivity} className="card p-4 space-y-3 animate-slide-down">
                        <input required placeholder="Activity description" value={activityForm.activity} onChange={e => setActivityForm({ ...activityForm, activity: e.target.value })} className="input text-sm" />
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="label">Quarter</label>
                            <select value={activityForm.quarter} onChange={e => setActivityForm({ ...activityForm, quarter: parseInt(e.target.value) })} className="select">
                              <option value={1}>Q1</option><option value={2}>Q2</option><option value={3}>Q3</option><option value={4}>Q4</option>
                            </select>
                          </div>
                          <div>
                            <label className="label">Target completion</label>
                            <input type="date" value={activityForm.targetCompletion} onChange={e => setActivityForm({ ...activityForm, targetCompletion: e.target.value })} className="input" />
                          </div>
                          <div>
                            <label className="label">Responsible</label>
                            <input value={activityForm.responsiblePerson} onChange={e => setActivityForm({ ...activityForm, responsiblePerson: e.target.value })} className="input" placeholder="Name" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="btn-success btn-sm">Add Activity</button>
                          <button type="button" onClick={() => setShowActivityForm(false)} className="btn-secondary btn-sm">Cancel</button>
                        </div>
                      </form>
                    )}
                    {selectedGoal.activities?.length === 0 ? (
                      <div className="card p-6 text-center">
                        <p className="text-sm text-slate-400">No activities yet. Add activities from the AIP.</p>
                      </div>
                    ) : [1, 2, 3, 4].map(q => {
                      const qActivities = selectedGoal.activities?.filter(a => a.quarter === q) || [];
                      if (qActivities.length === 0) return null;
                      return (
                        <div key={q} className="card p-4">
                          <h3 className="text-sm font-bold text-slate-700 mb-3">Quarter {q}</h3>
                          <div className="space-y-2">
                            {qActivities.map(a => {
                              const totalBudget = a.budgets?.reduce((s, b) => s + parseFloat(b.allocated || 0), 0) || 0;
                              return (
                                <div key={a.id} className="bg-slate-50 rounded-lg p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-800 flex-1">{a.activity}</p>
                                    <select value={a.status} onChange={e => handleUpdateActivityStatus(a.id, e.target.value)}
                                      className={`text-xs border border-slate-200 rounded-md px-1.5 py-0.5 ${STATUS_COLORS[a.status] || 'text-slate-600'} bg-white`}>
                                      <option>Not Started</option><option>In Progress</option><option>Completed</option><option>Delayed</option><option>Cancelled</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                    {a.responsible_person && <span>Person: {a.responsible_person}</span>}
                                    {a.target_completion && <span>Target: {new Date(a.target_completion).toLocaleDateString()}</span>}
                                    {totalBudget > 0 && <span className="font-semibold text-slate-700">Budget: &#8369;{totalBudget.toLocaleString()}</span>}
                                    {a.actual_completion && <span>Done: {new Date(a.actual_completion).toLocaleDateString()}</span>}
                                    {a.remarks && <span className="text-slate-400 italic">{a.remarks}</span>}
                                  </div>
                                  {a.budgets?.length > 0 && (
                                    <div className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                                      {a.budgets.map(b => (
                                        <BudgetLine key={b.id} budget={b} onSave={handleUpdateBudget} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="card p-10 text-center">
                    <p className="text-sm text-slate-400">Select a goal to view its AIP activities.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'pf' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {['MOOE', 'SEF', 'PTA', 'LGU', 'Donation'].map(fs => {
                  const records = pfRecords.filter(r => r.fund_source === fs);
                  const totalPhys = records.reduce((s, r) => s + parseFloat(r.physical_accomplishment || 0), 0);
                  const totalDisc = records.reduce((s, r) => s + parseFloat(r.financial_disbursement || 0), 0);
                  return (
                    <div key={fs} className="card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 text-sm">{fs}</h3>
                        <span className="text-xs text-slate-500">{records.length} entries</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Physical:</span><span className="font-semibold">{totalPhys}%</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Disbursed:</span><span className="font-semibold">&#8369;{totalDisc.toLocaleString()}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showPfForm && (
                <form onSubmit={handleSavePf} className="card p-5 space-y-4 animate-slide-down">
                  <h3 className="font-bold text-slate-900">Add Physical & Financial Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Month</label>
                      <select value={pfForm.month} onChange={e => setPfForm({ ...pfForm, month: parseInt(e.target.value) })} className="select">
                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Fund Source</label>
                      <select value={pfForm.fundSource} onChange={e => setPfForm({ ...pfForm, fundSource: e.target.value })} className="select">
                        <option>MOOE</option><option>SEF</option><option>PTA</option><option>LGU</option><option>Donation</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Physical Accomplishment (%)</label>
                      <input type="number" step="0.01" min="0" max="100" value={pfForm.physicalAccomplishment} onChange={e => setPfForm({ ...pfForm, physicalAccomplishment: e.target.value })} className="input" />
                    </div>
                    <div>
                      <label className="label">Financial Obligation (&#8369;)</label>
                      <input type="number" step="0.01" value={pfForm.financialObligation} onChange={e => setPfForm({ ...pfForm, financialObligation: e.target.value })} className="input" />
                    </div>
                    <div>
                      <label className="label">Financial Disbursement (&#8369;)</label>
                      <input type="number" step="0.01" value={pfForm.financialDisbursement} onChange={e => setPfForm({ ...pfForm, financialDisbursement: e.target.value })} className="input" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary btn-sm">Save Record</button>
                    <button type="button" onClick={() => setShowPfForm(false)} className="btn-secondary btn-sm">Cancel</button>
                  </div>
                </form>
              )}

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-border bg-slate-50/50">
                      <th className="table-header">Month</th>
                      <th className="table-header">Fund Source</th>
                      <th className="table-header">Physical %</th>
                      <th className="table-header">Obligation</th>
                      <th className="table-header">Disbursement</th>
                      <th className="table-header">Disbursement Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {pfRecords.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-sm text-slate-400 py-8">No records yet.</td></tr>
                    ) : pfRecords.map(r => {
                      const rate = parseFloat(r.financial_obligation) > 0 ? Math.round((parseFloat(r.financial_disbursement) / parseFloat(r.financial_obligation)) * 100) : 0;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="table-cell font-semibold">{new Date(2024, r.month - 1).toLocaleString('default', { month: 'long' })}</td>
                          <td className="table-cell"><span className="badge-gray text-xs">{r.fund_source}</span></td>
                          <td className="table-cell">{parseFloat(r.physical_accomplishment).toFixed(1)}%</td>
                          <td className="table-cell text-slate-600">&#8369;{parseFloat(r.financial_obligation).toLocaleString()}</td>
                          <td className="table-cell text-slate-600">&#8369;{parseFloat(r.financial_disbursement).toLocaleString()}</td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                <div className={`rounded-full h-1.5 ${rate > 75 ? 'bg-emerald-500' : rate > 50 ? 'bg-brand-500' : rate > 25 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(rate, 100)}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-slate-600">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showGoalForm && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowGoalForm(false)}>
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-xl mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-surface-border">
              <h2 className="font-bold text-slate-900">New SIP Goal</h2>
            </div>
            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              <div>
                <label className="label">Goal statement</label>
                <textarea required value={goalForm.goal} onChange={e => setGoalForm({ ...goalForm, goal: e.target.value })} className="textarea" rows={2} placeholder="e.g. Improve reading proficiency among Grade 3 learners" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Priority Area</label>
                  <select value={goalForm.priorityArea} onChange={e => setGoalForm({ ...goalForm, priorityArea: e.target.value })} className="select">
                    {PRIORITY_AREAS.map(pa => <option key={pa}>{pa}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Target date</label>
                  <input type="date" value={goalForm.targetDate} onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Target metric</label>
                  <input value={goalForm.targetMetric} onChange={e => setGoalForm({ ...goalForm, targetMetric: e.target.value })} className="input" placeholder="e.g. MPS Score" />
                </div>
                <div>
                  <label className="label">Target value</label>
                  <input value={goalForm.targetValue} onChange={e => setGoalForm({ ...goalForm, targetValue: e.target.value })} className="input" placeholder="e.g. 80%" />
                </div>
                <div>
                  <label className="label">Baseline value</label>
                  <input value={goalForm.baselineValue} onChange={e => setGoalForm({ ...goalForm, baselineValue: e.target.value })} className="input" placeholder="e.g. 45%" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary">Create Goal</button>
                <button type="button" onClick={() => setShowGoalForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetLine({ budget, onSave }) {
  const [editing, setEditing] = useState(false);
  const [allocated, setAllocated] = useState(parseFloat(budget.allocated) || 0);
  const [disbursed, setDisbursed] = useState(parseFloat(budget.disbursed) || 0);

  if (!editing) {
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{budget.fund_source}</span>
        <div className="flex items-center gap-2">
          <span>&#8369;{parseFloat(budget.allocated).toLocaleString()} alloc</span>
          <span className="text-slate-300">|</span>
          <span>&#8369;{parseFloat(budget.disbursed).toLocaleString()} disc</span>
          <button onClick={() => setEditing(true)} className="text-brand-500 hover:text-brand-700 font-semibold">Edit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-medium text-slate-600">{budget.fund_source}</span>
      <div className="flex gap-1 items-center">
        <input type="number" step="0.01" value={allocated} onChange={e => setAllocated(parseFloat(e.target.value) || 0)} className="w-20 text-xs border border-slate-200 rounded px-1.5 py-0.5" placeholder="Alloc" />
        <input type="number" step="0.01" value={disbursed} onChange={e => setDisbursed(parseFloat(e.target.value) || 0)} className="w-20 text-xs border border-slate-200 rounded px-1.5 py-0.5" placeholder="Disc" />
        <button onClick={() => { onSave(budget.id, { allocated, disbursed }); setEditing(false); }} className="text-brand-600 hover:text-brand-800 font-semibold">Save</button>
        <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">x</button>
      </div>
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

function GridIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" /></svg>; }
function GoalIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>; }
function ChartIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>; }
