import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProjectDocuments, getTeamProjects, getProjectTasks, uploadDocument } from '../api/client';
import { useToast } from '../components/Toast';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import DropZone from '../components/DropZone';

const PAGE_SIZE = 10;

export default function DocumentVault() {
  const { teamId } = useParams();
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [photoGrid, setPhotoGrid] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    getTeamProjects(teamId).then(setProjects).catch(err => toast(err.message));
  }, [teamId]);

  useEffect(() => {
    if (!selectedProject) { setDocuments([]); setTasks([]); return; }
    setLoading(true);
    Promise.all([
      getProjectDocuments(selectedProject, selectedTask || undefined).catch(() => []),
      getProjectTasks(selectedProject).catch(() => []),
    ]).then(([docs, ts]) => {
      setDocuments(docs);
      setTasks(ts);
    }).catch(err => toast(err.message))
    .finally(() => setLoading(false));
  }, [selectedProject, selectedTask]);

  const isImage = (d) => ['jpg','jpeg','png','gif','webp'].includes(d.doc_type?.toLowerCase());

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? documents.filter(d => (d.file_url || '').toLowerCase().includes(q) || (d.task_title || '').toLowerCase().includes(q) || (d.uploader_name || '').toLowerCase().includes(q)) : documents;
  }, [documents, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleUpload = async (files) => {
    if (!selectedProject) { toast('Select a project first'); return; }
    const formData = new FormData();
    for (const f of files) formData.append('files', f);
    formData.append('projectId', selectedProject);
    if (selectedTask) formData.append('taskId', selectedTask);
    try {
      await uploadDocument(formData);
      toast('Files uploaded', 'success');
      const docs = await getProjectDocuments(selectedProject, selectedTask || undefined);
      setDocuments(docs);
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
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Document Vault</h1>
        <p className="text-sm text-slate-500 mt-1">Browse and upload files by project</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Project</label>
          <select value={selectedProject} onChange={e => { setSelectedProject(e.target.value); setSelectedTask(''); setPage(1); }}
            className="select">
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
        {selectedProject && (
          <div>
            <label className="label">Filter by Task</label>
            <select value={selectedTask} onChange={e => { setSelectedTask(e.target.value); setPage(1); }} className="select">
              <option value="">All tasks</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {selectedProject && (
        <DropZone onFiles={handleUpload} multiple />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 max-w-xs"><SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search files..." /></div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPhotoGrid(false)} className={!photoGrid ? 'tab-btn-active' : 'tab-btn-inactive'}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            List
          </button>
          <button onClick={() => setPhotoGrid(true)} className={photoGrid ? 'tab-btn-active' : 'tab-btn-inactive'}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Grid
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        photoGrid && filtered.filter(isImage).length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.filter(isImage).map(d => (
                <a key={d.id} href={d.file_url} target="_blank" rel="noopener noreferrer"
                  className="card overflow-hidden group hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
                  <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img src={d.file_url} alt={d.file_url.split('/').pop()}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-slate-700 truncate">{d.file_url.split('/').pop()}</p>
                    <p className="text-xs text-slate-400 truncate">{d.task_title || d.uploader_name}</p>
                  </div>
                </a>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        ) : (
          <div className="card overflow-hidden">
            {paged.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">No documents found.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border bg-slate-50/50">
                    <th className="table-header">File</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Task</th>
                    <th className="table-header">Uploaded by</th>
                    <th className="table-header">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {paged.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-cell">
                        <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                          className="text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          {d.file_url.split('/').pop()}
                        </a>
                      </td>
                      <td className="table-cell text-slate-500">.{d.doc_type}</td>
                      <td className="table-cell text-slate-500">{d.task_title || '\u2014'}</td>
                      <td className="table-cell font-medium">{d.uploader_name}</td>
                      <td className="table-cell text-slate-500">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )
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
