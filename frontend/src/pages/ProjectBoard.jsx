import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { getProject, getProjectTasks, createTask, updateTask, deleteTask, getProjectDocuments, uploadDocument, getClosure, submitClosure, reopenProject, getTaskComments, addTaskComment, getProjectBudgets, createBudget, updateBudget, getTeamLabels, getProjectViews, createProjectView, deleteView, getProjectTaskLabels } from '../api/client';
import { useToast } from '../components/Toast';
import LabelPicker from '../components/LabelPicker';

const COLUMNS = ['To Do', 'In Progress', 'Blocked', 'Done'];

export default function ProjectBoard() {
  const { teamId, projectId } = useParams();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [closure, setClosure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskComments, setTaskComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ source: 'MOOE', amountAllocated: '', amountSpent: '', liquidationStatus: 'For Liquidation', notes: '' });
  const [showClosureForm, setShowClosureForm] = useState(false);
  const [closureForm, setClosureForm] = useState({ lessonsLearned: '', outcomeIndicator: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigneeId: '', dueDate: '', status: 'To Do' });
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [taskLabels, setTaskLabels] = useState({});
  const [teamLabels, setTeamLabels] = useState([]);
  const [views, setViews] = useState([]);
  const [activeView, setActiveView] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [viewFilter, setViewFilter] = useState({ status: '', labelId: '' });
  const [showSaveView, setShowSaveView] = useState(false);
  const [viewName, setViewName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const loadAll = async () => {
    try {
      const [proj, t, docs, b, lbls, vws] = await Promise.all([
        getProject(projectId), getProjectTasks(projectId), getProjectDocuments(projectId), getProjectBudgets(projectId),
        getTeamLabels(teamId).catch(() => []), getProjectViews(projectId).catch(() => []),
      ]);
      setProject(proj); setTasks(t); setDocuments(docs); setBudgets(b);
      setTeamLabels(lbls); setViews(vws);
      const tlRows = await getProjectTaskLabels(projectId);
      const labelMap = {};
      tlRows.forEach(r => {
        if (!labelMap[r.task_id]) labelMap[r.task_id] = [];
        labelMap[r.task_id].push({ id: r.id, name: r.name, color: r.color });
      });
      setTaskLabels(labelMap);
      try { const c = await getClosure(projectId); setClosure(c); } catch { setClosure(null); }
    } catch (err) { toast(err.message); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [projectId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await createTask(projectId, taskForm);
      setTaskForm({ title: '', description: '', assigneeId: '', dueDate: '', status: 'To Do' });
      setShowTaskForm(false); await loadAll();
    } catch (err) { toast(err.message); }
  };

  const handleUpdateTask = async (id, data) => {
    try { await updateTask(id, data); await loadAll(); } catch (err) { toast(err.message); }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await deleteTask(id); setSelectedTask(null); await loadAll(); } catch (err) { toast(err.message); }
  };

  const handleSubmitClosure = async (e) => {
    e.preventDefault();
    try { await submitClosure(projectId, closureForm); setShowClosureForm(false); await loadAll(); } catch (err) { toast(err.message); }
  };

  const handleReopen = async () => {
    if (!confirm('Reopen this project? This will be logged.')) return;
    try { await reopenProject(projectId); await loadAll(); } catch (err) { toast(err.message); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTask) return;
    try { await uploadDocument(selectedTask.id, file); setShowDocUpload(false); await loadAll(); } catch (err) { toast(err.message); }
  };

  const loadComments = async (taskId) => {
    try { const c = await getTaskComments(taskId); setTaskComments(c); } catch {}
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedTask) return;
    try {
      await addTaskComment(selectedTask.id, commentText);
      setCommentText('');
      await loadComments(selectedTask.id);
    } catch (err) { toast(err.message); }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    try {
      await createBudget(projectId, { ...budgetForm, amountAllocated: parseFloat(budgetForm.amountAllocated) || 0, amountSpent: parseFloat(budgetForm.amountSpent) || 0 });
      setBudgetForm({ source: 'MOOE', amountAllocated: '', amountSpent: '', liquidationStatus: 'For Liquidation', notes: '' });
      setShowBudgetForm(false);
      await loadAll();
      toast('Budget added', 'success');
    } catch (err) { toast(err.message); }
  };

  const handleUpdateLiquidation = async (id, liquidationStatus) => {
    try { await updateBudget(id, { liquidationStatus }); await loadAll(); } catch (err) { toast(err.message); }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    let newStatus = activeTask.status;
    let newPosition = 0;

    if (over.data?.current?.type === 'column') {
      newStatus = over.data.current.column;
      const colTasks = tasks.filter(t => t.status === newStatus && t.id !== active.id);
      newPosition = colTasks.length > 0 ? Math.max(...colTasks.map(t => t.position || 0)) + 1 : 0;
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      if (!overTask) return;
      newStatus = overTask.status;
      const colTasks = tasks.filter(t => t.status === newStatus && t.id !== active.id).sort((a, b) => (a.position || 0) - (b.position || 0));
      const overIdx = colTasks.findIndex(t => t.id === over.id);
      if (overIdx === 0) newPosition = (colTasks[0].position || 0) / 2;
      else if (overIdx === -1) newPosition = (colTasks[colTasks.length - 1]?.position || 0) + 1;
      else newPosition = ((colTasks[overIdx - 1]?.position || 0) + (colTasks[overIdx]?.position || 0)) / 2;
    }

    setActiveId(null);
    if (newStatus === activeTask.status && newPosition === (activeTask.position || 0)) return;
    try {
      const updates = { position: newPosition };
      if (newStatus !== activeTask.status) updates.status = newStatus;
      await updateTask(active.id, updates);
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, ...updates } : t));
    } catch (err) { toast(err.message); await loadAll(); }
  };

  const getTaskPosition = (id) => tasks.findIndex(t => t.id === id);

  const applyViewFilter = (task) => {
    if (viewFilter.status && task.status !== viewFilter.status) return false;
    if (viewFilter.labelId && (!taskLabels[task.id] || !taskLabels[task.id].find(l => l.id === viewFilter.labelId))) return false;
    return true;
  };

  const handleSaveView = async (e) => {
    e.preventDefault();
    if (!viewName.trim()) return;
    try {
      await createProjectView(projectId, { name: viewName, filters: viewFilter });
      setViewName(''); setShowSaveView(false);
      const vws = await getProjectViews(projectId);
      setViews(vws);
      toast('View saved', 'success');
    } catch (err) { toast(err.message); }
  };

  const handleApplyView = (v) => {
    setActiveView(v);
    setViewFilter(v.filters);
  };

  if (loading) return <Spinner />;
  if (!project) return <div className="flex items-center justify-center py-20"><p className="text-slate-500">Project not found</p></div>;

  const now = new Date();
  const overdueTasks = tasks.filter(t => t.status !== 'Done' && t.due_date && new Date(t.due_date) < now);
  const doneTasks = tasks.filter(t => t.status === 'Done').length;

  const tabs = [
    { key: 'kanban', label: 'Board', icon: BoardIcon },
    { key: 'timeline', label: 'Timeline', icon: TimelineIcon },
    { key: 'details', label: 'Details', icon: DetailsIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to={`/teams/${teamId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-600 transition-colors mb-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{project.title}</h1>
            <span className={`badge ${project.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{project.status}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span>Program: <strong className="text-slate-700">{project.program_type}</strong></span>
            <span className="text-slate-300">|</span>
            <span>{tasks.length} tasks, <strong className="text-emerald-600">{doneTasks}</strong> done</span>
            {overdueTasks.length > 0 && (
              <span className="badge-red text-[11px]">{overdueTasks.length} overdue</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl border border-surface-border p-1.5">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setView(t.key)}
              className={view === t.key ? 'tab-btn-active' : 'tab-btn-inactive'}>
              <t.icon />
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {view === 'kanban' && (
            <>
              <select value={activeView?.id || ''} onChange={e => {
                const v = views.find(v => v.id === e.target.value);
                v ? handleApplyView(v) : (setActiveView(null), setViewFilter({ status: '', labelId: '' }));
              }} className="select text-xs max-w-[140px] py-1.5">
                <option value="">All tasks</option>
                {views.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              {!showSaveView ? (
                <button onClick={() => setShowSaveView(true)} className="btn-ghost btn-xs text-slate-400">+ View</button>
              ) : (
                <form onSubmit={handleSaveView} className="flex gap-1 items-center">
                  <input value={viewName} onChange={e => setViewName(e.target.value)} placeholder="View name" className="input text-xs py-1 w-24" />
                  <button type="submit" className="btn-primary btn-xs">Save</button>
                  <button type="button" onClick={() => setShowSaveView(false)} className="btn-ghost btn-xs">x</button>
                </form>
              )}
              <div className="flex items-center gap-1 text-xs">
                <select value={viewFilter.status} onChange={e => { setViewFilter(f => ({ ...f, status: e.target.value })); setActiveView(null); }}
                  className="border border-slate-200 rounded-md px-1.5 py-1 outline-none text-slate-500 bg-white max-w-[90px] text-xs">
                  <option value="">Status</option>
                  {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={viewFilter.labelId} onChange={e => { setViewFilter(f => ({ ...f, labelId: e.target.value })); setActiveView(null); }}
                  className="border border-slate-200 rounded-md px-1.5 py-1 outline-none text-slate-500 bg-white max-w-[90px] text-xs">
                  <option value="">Label</option>
                  {teamLabels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </>
          )}
          <Link to={`/teams/${teamId}/logs`} className="btn-ghost btn-sm">Logs</Link>
          <Link to={`/teams/${teamId}/documents`} className="btn-ghost btn-sm">Docs</Link>
          {project.status === 'Active' && (
            <button onClick={() => setShowTaskForm(!showTaskForm)} className="btn-primary btn-sm">
              {showTaskForm ? 'Cancel' : '+ Add Task'}
            </button>
          )}
        </div>
      </div>

      {showTaskForm && (
        <form onSubmit={handleCreateTask} className="card p-5 space-y-4 animate-slide-down">
          <h3 className="font-bold text-slate-900">New Task</h3>
          <input required placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="input" />
          <textarea placeholder="Description (optional)" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} className="textarea" rows={2} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Due date</label>
              <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })} className="select">
                {COLUMNS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-success btn-sm">Create Task</button>
        </form>
      )}

      {view === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={e => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-4 gap-4">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col && applyViewFilter(t)).sort((a, b) => (a.position || 0) - (b.position || 0));
              const count = colTasks.length;
              return (
                <div key={col} className="kanban-column">
                  <div className="flex items-center justify-between mb-3 px-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        col === 'To Do' ? 'bg-slate-400' :
                        col === 'In Progress' ? 'bg-brand-500' :
                        col === 'Blocked' ? 'bg-red-500' : 'bg-emerald-500'
                      }`} />
                      <h3 className="text-sm font-bold text-slate-700">{col}</h3>
                    </div>
                    <span className="text-xs bg-white/80 px-2 py-0.5 rounded-md font-bold text-slate-500">{count}</span>
                  </div>
                  <SortableContext items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 min-h-[60px]">
                      {colTasks.map(task => (
                        <SortableTaskCard key={task.id} task={task} labels={taskLabels[task.id] || []} now={now} onClick={() => setSelectedTask(task)} />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
          <DragOverlay>
            {activeId ? (() => {
              const task = tasks.find(t => t.id === activeId);
              return task ? <DragPreview task={task} labels={taskLabels[task.id] || []} /> : null;
            })() : null}
          </DragOverlay>
        </DndContext>
      )}

      {view === 'timeline' && (
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 mb-4">Task Timeline</h2>
          <div className="space-y-2">
            {[...tasks].sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0)).map(task => {
              const due = task.due_date ? new Date(task.due_date) : null;
              const now = new Date();
              const diff = due ? Math.ceil((due - now) / (1000 * 60 * 60 * 24)) : null;
              let flagClass = 'border-slate-200';
              let dotClass = 'bg-slate-300';
              if (task.status === 'Done') { flagClass = 'border-emerald-200 bg-emerald-50/50'; dotClass = 'bg-emerald-500'; }
              else if (diff !== null && diff < 0) { flagClass = 'border-red-200 bg-red-50/50'; dotClass = 'bg-red-500'; }
              else if (diff !== null && diff <= 3) { flagClass = 'border-amber-200 bg-amber-50/50'; dotClass = 'bg-amber-500'; }

              return (
                <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${flagClass} transition-colors`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.assignee_name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <span className="text-xs text-slate-500">{due ? due.toLocaleDateString() : 'No date'}</span>
                    <span className={`badge text-xs ${
                      task.status === 'Done' ? 'badge-green' :
                      task.status === 'Blocked' ? 'badge-red' :
                      task.status === 'In Progress' ? 'badge-blue' : 'badge-gray'
                    }`}>{task.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="font-bold text-slate-900 mb-4">Project Details</h2>
            <dl className="space-y-3 text-sm">
              <Row label="Start date" value={project.start_date ? new Date(project.start_date).toLocaleDateString() : '\u2014'} />
              <Row label="Target end" value={project.target_end_date ? new Date(project.target_end_date).toLocaleDateString() : '\u2014'} />
              <Row label="Status" value={<span className={`badge ${project.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{project.status}</span>} />
              <Row label="Tasks" value={`${tasks.length} total, ${doneTasks} done`} />
              <Row label="Overdue" value={<span className="text-red-600 font-bold">{overdueTasks.length} tasks</span>} />
            </dl>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Documents ({documents.length})</h2>
              <Link to={`/teams/${teamId}/documents`} className="text-xs font-semibold text-brand-500 hover:text-brand-700">View all</Link>
            </div>
            {documents.length === 0 ? (
              <p className="text-sm text-slate-400">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documents.slice(0, 10).map(d => (
                  <div key={d.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-slate-50">
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800 truncate flex items-center gap-1.5 font-medium">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <span className="truncate">{d.file_url.split('/').pop()}</span>
                    </a>
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-2">.{d.doc_type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Budget</h2>
              <button onClick={() => setShowBudgetForm(!showBudgetForm)} className="btn-secondary btn-sm">
                {showBudgetForm ? 'Cancel' : 'Add Entry'}
              </button>
            </div>
            {showBudgetForm && (
              <form onSubmit={handleAddBudget} className="mb-4 p-4 bg-slate-50 rounded-xl border border-surface-border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Source</label>
                    <select value={budgetForm.source} onChange={e => setBudgetForm({ ...budgetForm, source: e.target.value })} className="input">
                      <option>MOOE</option>
                      <option>SEF</option>
                      <option>PTA</option>
                      <option>LGU</option>
                      <option>Donation</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Liquidation</label>
                    <select value={budgetForm.liquidationStatus} onChange={e => setBudgetForm({ ...budgetForm, liquidationStatus: e.target.value })} className="input">
                      <option>For Liquidation</option>
                      <option>Partially Liquidated</option>
                      <option>Fully Liquidated</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Amount Allocated</label>
                    <input type="number" step="0.01" required placeholder="0.00" value={budgetForm.amountAllocated}
                      onChange={e => setBudgetForm({ ...budgetForm, amountAllocated: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Amount Spent</label>
                    <input type="number" step="0.01" required placeholder="0.00" value={budgetForm.amountSpent}
                      onChange={e => setBudgetForm({ ...budgetForm, amountSpent: e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Notes (optional)</label>
                  <input value={budgetForm.notes} onChange={e => setBudgetForm({ ...budgetForm, notes: e.target.value })} className="input" />
                </div>
                <button type="submit" className="btn-primary btn-sm">Save Budget Entry</button>
              </form>
            )}
            {budgets.length === 0 ? (
              <p className="text-sm text-slate-400">No budget entries yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-left text-xs text-slate-500 uppercase tracking-wider">
                      <th className="pb-2 pr-3 font-semibold">Source</th>
                      <th className="pb-2 pr-3 font-semibold">Allocated</th>
                      <th className="pb-2 pr-3 font-semibold">Spent</th>
                      <th className="pb-2 pr-3 font-semibold">Remaining</th>
                      <th className="pb-2 pr-3 font-semibold">Liquidation</th>
                      <th className="pb-2 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map(b => {
                      const remaining = (parseFloat(b.amount_allocated) || 0) - (parseFloat(b.amount_spent) || 0);
                      return (
                        <tr key={b.id} className="border-b border-surface-border">
                          <td className="py-2 pr-3 font-semibold text-slate-700">{b.source}</td>
                          <td className="py-2 pr-3 text-slate-600">&#8369;{parseFloat(b.amount_allocated).toLocaleString()}</td>
                          <td className="py-2 pr-3 text-slate-600">&#8369;{parseFloat(b.amount_spent).toLocaleString()}</td>
                          <td className={`py-2 pr-3 font-bold ${remaining > 0 ? 'text-emerald-600' : remaining < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                            &#8369;{remaining.toLocaleString()}
                          </td>
                          <td className="py-2 pr-3">
                            <select value={b.liquidation_status} onChange={e => handleUpdateLiquidation(b.id, e.target.value)}
                              className="text-xs border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-600 bg-white">
                              <option>For Liquidation</option>
                              <option>Partially Liquidated</option>
                              <option>Fully Liquidated</option>
                            </select>
                          </td>
                          <td className="py-2 text-slate-500 max-w-[120px] truncate" title={b.notes}>{b.notes || '\u2014'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold text-slate-800 border-t-2 border-slate-300">
                      <td className="pt-3 pr-3">Total</td>
                      <td className="pt-3 pr-3">&#8369;{budgets.reduce((s, b) => s + (parseFloat(b.amount_allocated) || 0), 0).toLocaleString()}</td>
                      <td className="pt-3 pr-3">&#8369;{budgets.reduce((s, b) => s + (parseFloat(b.amount_spent) || 0), 0).toLocaleString()}</td>
                      <td className="pt-3 pr-3">&#8369;{budgets.reduce((s, b) => s + (parseFloat(b.amount_allocated) || 0) - (parseFloat(b.amount_spent) || 0), 0).toLocaleString()}</td>
                      <td className="pt-3 pr-3" colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {closure ? (
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Closure Report</h2>
                <button onClick={handleReopen} className="btn-ghost btn-sm text-red-600 hover:text-red-800">
                  Reopen project
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-semibold">Submitted by</p>
                  <p className="font-bold text-slate-800">{closure.submitted_by_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-semibold">Submitted at</p>
                  <p className="font-bold text-slate-800">{new Date(closure.submitted_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-semibold">Lessons learned</p>
                  <p className="text-slate-700 bg-slate-50 rounded-lg p-3">{closure.lessons_learned}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-semibold">Outcome indicator</p>
                  <p className="text-slate-700 bg-slate-50 rounded-lg p-3">{closure.outcome_indicator}</p>
                </div>
              </div>
              {closure.reopened_at && (
                <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 font-medium">
                  Reopened on {new Date(closure.reopened_at).toLocaleString()}
                </p>
              )}
            </div>
          ) : project.status === 'Active' && (
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Close Project</h2>
                <button onClick={() => setShowClosureForm(!showClosureForm)} className="btn-secondary btn-sm">
                  {showClosureForm ? 'Cancel' : 'Close Project'}
                </button>
              </div>
              {showClosureForm && (
                <form onSubmit={handleSubmitClosure} className="space-y-4">
                  <div>
                    <label className="label">Lessons learned</label>
                    <textarea required placeholder="What did the team learn?" value={closureForm.lessonsLearned}
                      onChange={e => setClosureForm({ ...closureForm, lessonsLearned: e.target.value })} className="textarea" rows={3} />
                  </div>
                  <div>
                    <label className="label">Outcome indicator</label>
                    <textarea required placeholder="Describe the outcome (free text)" value={closureForm.outcomeIndicator}
                      onChange={e => setClosureForm({ ...closureForm, outcomeIndicator: e.target.value })} className="textarea" rows={2} />
                  </div>
                  <button type="submit" className="btn-danger btn-sm">Submit Closure</button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          teamId={teamId}
          documents={documents.filter(d => d.task_id === selectedTask.id)}
          comments={taskComments}
          commentText={commentText}
          onCommentChange={setCommentText}
          onAddComment={handleAddComment}
          onClose={() => { setSelectedTask(null); setShowDocUpload(false); setTaskComments([]); setCommentText(''); }}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          onUpload={handleUpload}
          showUpload={showDocUpload}
          setShowUpload={setShowDocUpload}
          onLoadComments={loadComments}
        />
      )}
    </div>
  );
}

function TaskModal({ task, teamId, documents, comments, commentText, onCommentChange, onAddComment, onClose, onUpdate, onDelete, onUpload, showUpload, setShowUpload, onLoadComments }) {
  useEffect(() => { onLoadComments(task.id); }, [task.id]);
  const [edit, setEdit] = useState(null);
  const [editDesc, setEditDesc] = useState('');

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: edit?.description || '',
    onUpdate: ({ editor }) => setEditDesc(editor.getHTML()),
    editorProps: { attributes: { class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2' } },
  });

  useEffect(() => {
    if (edit && editor) {
      editor.commands.setContent(edit.description || '');
      setEditDesc(edit.description || '');
    }
  }, [edit?.title]);

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-xl mx-4 max-h-[85vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-bold text-slate-900 text-lg">{task.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {edit ? (
            <div className="space-y-4">
              <input value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} className="input" />
              <div>
                <label className="label">Description</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 bg-slate-50">
                    <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBold().run(); }}
                      className={`p-1.5 rounded text-xs font-bold ${editor?.isActive('bold') ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>B</button>
                    <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleItalic().run(); }}
                      className={`p-1.5 rounded text-xs italic ${editor?.isActive('italic') ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>I</button>
                    <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleUnderline().run(); }}
                      className={`p-1.5 rounded text-xs underline ${editor?.isActive('underline') ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>U</button>
                    <span className="w-px h-4 bg-slate-200 mx-1" />
                    <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleBulletList().run(); }}
                      className={`p-1.5 rounded text-xs ${editor?.isActive('bulletList') ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>&#8226;</button>
                    <button type="button" onMouseDown={e => { e.preventDefault(); editor?.chain().focus().toggleOrderedList().run(); }}
                      className={`p-1.5 rounded text-xs ${editor?.isActive('orderedList') ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>1.</button>
                  </div>
                  <EditorContent editor={editor} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <select value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })} className="select">
                    {COLUMNS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Due date</label>
                  <input type="date" value={edit.dueDate} onChange={e => setEdit({ ...edit, dueDate: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={async () => { await onUpdate(task.id, { ...edit, description: editDesc }); setEdit(null); }} className="btn-primary btn-sm">Save</button>
                <button onClick={() => setEdit(null)} className="btn-secondary btn-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 font-semibold mb-1">Description</p>
                  <div className="text-slate-700 prose prose-sm max-w-none bg-slate-50 rounded-xl p-4" dangerouslySetInnerHTML={{ __html: task.description || 'No description' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-semibold mb-1">Assignee</p>
                    <p className="text-slate-700 font-bold">{task.assignee_name || 'Unassigned'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-semibold mb-1">Status</p>
                    <span className={`badge ${task.status === 'Done' ? 'badge-green' : task.status === 'Blocked' ? 'badge-red' : task.status === 'In Progress' ? 'badge-blue' : 'badge-gray'}`}>{task.status}</span>
                  </div>
                  {task.due_date && (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 font-semibold mb-1">Due date</p>
                      <p className={`font-bold ${new Date(task.due_date) < new Date() && task.status !== 'Done' ? 'text-red-600' : 'text-slate-700'}`}>{new Date(task.due_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-surface-border">
                <p className="text-xs text-slate-500 font-semibold mb-2">Labels</p>
                <LabelPicker teamId={teamId} taskId={task.id} />
              </div>

              <div className="flex gap-2 pt-4 border-t border-surface-border">
                <button onClick={() => {
                  setEdit({ title: task.title, status: task.status, dueDate: task.due_date ? task.due_date.split('T')[0] : '' });
                  setEditDesc(task.description || '');
                }} className="btn-secondary btn-sm">Edit</button>
                <button onClick={() => onDelete(task.id)} className="btn-ghost btn-sm text-red-600 hover:text-red-800 ml-auto">Delete</button>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-surface-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">Documents ({documents.length})</h3>
              <button onClick={() => setShowUpload(!showUpload)} className="text-xs font-semibold text-brand-500 hover:text-brand-700">Upload</button>
            </div>
            {showUpload && (
              <div className="mb-3 p-4 rounded-xl bg-slate-50 border border-surface-border">
                <input type="file" onChange={onUpload} accept=".jpg,.png,.pdf,.docx,.xlsx" className="text-sm w-full" />
                <p className="text-xs text-slate-400 mt-1">Allowed: jpg, png, pdf, docx, xlsx (max 10MB)</p>
              </div>
            )}
            {documents.length === 0 ? (
              <p className="text-sm text-slate-400">No documents attached.</p>
            ) : (
              <div className="space-y-1.5">
                {documents.map(d => (
                  <div key={d.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-slate-50">
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800 truncate flex items-center gap-1.5 font-medium">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      {d.file_url.split('/').pop()}
                    </a>
                    <span className="text-xs text-slate-400 flex-shrink-0">.{d.doc_type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-surface-border">
            <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comments
            </h4>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400">No comments yet.</p>
              ) : comments.map(c => (
                <div key={c.id} className="flex gap-2.5 text-sm">
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {c.author_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
                    <p className="text-xs text-slate-500 font-semibold">{c.author_name} <span className="text-slate-300 font-normal">&middot;</span> <span className="font-normal">{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</span></p>
                    <p className="text-slate-700 mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={commentText} onChange={e => onCommentChange(e.target.value)}
                placeholder="Write a comment..." className="input flex-1 text-sm"
                onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) onAddComment(); }} />
              <button onClick={onAddComment} disabled={!commentText.trim()}
                className="btn btn-sm btn-primary flex-shrink-0">Post</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
      <dt className="text-slate-500 text-xs font-semibold">{label}</dt>
      <dd className="text-slate-800 font-bold text-sm">{value}</dd>
    </div>
  );
}

function SortableTaskCard({ task, labels, now, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue = task.due_date && new Date(task.due_date) < now && task.status !== 'Done';

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}
      className={`kanban-card ${isOverdue ? 'border-l-2 border-l-red-400' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-bold text-slate-800 text-sm leading-snug">{task.title}</p>
      </div>
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {labels.map(lbl => (
            <span key={lbl.id} className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: lbl.color }}>{lbl.name}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          {task.assignee_name ? (
            <span className="w-5 h-5 rounded-full bg-slate-200 inline-flex items-center justify-center text-[9px] font-bold text-slate-600 flex-shrink-0">
              {task.assignee_name.charAt(0)}
            </span>
          ) : (
            <span className="w-5 h-5 rounded-full bg-slate-100 inline-flex items-center justify-center text-[9px] text-slate-400 flex-shrink-0">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </span>
          )}
          {task.due_date && (
            <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${
          task.status === 'To Do' ? 'bg-slate-300' :
          task.status === 'In Progress' ? 'bg-brand-500' :
          task.status === 'Blocked' ? 'bg-red-500' : 'bg-emerald-500'
        }`} />
      </div>
    </div>
  );
}

function DragPreview({ task, labels }) {
  return (
    <div className="bg-white rounded-lg border border-brand-300 shadow-lg p-3 rotate-3 opacity-90">
      <p className="font-bold text-slate-800">{task.title}</p>
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {labels.map(lbl => (
            <span key={lbl.id} className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: lbl.color }}>{lbl.name}</span>
          ))}
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

function BoardIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6m-3-3v3m-8 3h18M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7M9 10h.01M12 10h.01M15 10h.01" />
    </svg>
  );
}

function TimelineIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DetailsIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}
