import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTeamProjects, createProject } from '../api/client';
import { useToast } from '../components/Toast';

export default function TeamBoard() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', programType: '', startDate: '', targetEndDate: '' });

  const load = async () => {
    try {
      const data = await getTeamProjects(teamId);
      setProjects(data);
    } catch (err) { toast(err.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [teamId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const p = await createProject(teamId, form);
      setForm({ title: '', programType: '', startDate: '', targetEndDate: '' });
      setShowForm(false);
      navigate(`/teams/${teamId}/projects/${p.id}`);
    } catch (err) { toast(err.message); }
  };

  if (loading) return <Spinner />;

  const activeProjects = projects.filter(p => p.status === 'Active');
  const closedProjects = projects.filter(p => p.status === 'Closed');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-brand-600 transition-colors mb-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'New Project'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 space-y-4 animate-slide-down">
          <h3 className="font-bold text-slate-900">Create Project</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Project title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" />
            <input required placeholder="Program type (e.g. DRRM, SBFP)" value={form.programType} onChange={e => setForm({ ...form, programType: e.target.value })} className="input" />
            <div>
              <label className="label">Start date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Target end date</label>
              <input type="date" value={form.targetEndDate} onChange={e => setForm({ ...form, targetEndDate: e.target.value })} className="input" />
            </div>
          </div>
          <button type="submit" className="btn-success">Create Project</button>
        </form>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900">Active ({activeProjects.length})</h2>
          <div className="h-px flex-1 bg-surface-border" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map(p => <ProjectCard key={p.id} project={p} teamId={teamId} />)}
          {activeProjects.length === 0 && <p className="text-sm text-slate-400 col-span-full">No active projects.</p>}
        </div>
      </div>

      {closedProjects.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Closed ({closedProjects.length})</h2>
            <div className="h-px flex-1 bg-surface-border" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {closedProjects.map(p => <ProjectCard key={p.id} project={p} teamId={teamId} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, teamId }) {
  return (
    <Link to={`/teams/${teamId}/projects/${project.id}`} className="card-hover p-5 block group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{project.title}</h3>
        <span className={`badge text-xs flex-shrink-0 ml-2 ${project.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>
          {project.status}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-3 font-medium">Program: {project.program_type}</p>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        {project.start_date && <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Start: {new Date(project.start_date).toLocaleDateString()}</span>}
        {project.target_end_date && <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Target: {new Date(project.target_end_date).toLocaleDateString()}</span>}
      </div>
    </Link>
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
