import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPDODashboard, getTeams, getTeamProjects } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';

export default function PDODashboard() {
  const { isPDO, isSchoolHead, teams: userTeams } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPDO || isSchoolHead) {
      getPDODashboard()
        .then(setData)
        .catch(err => toast(err.message))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isPDO, isSchoolHead]);

  if (loading) return <Spinner />;

  if (isPDO && data) return <PDOView data={data} />;
  if (isSchoolHead && data) return <SchoolHeadView data={data} />;

  return <CoordinatorDashboard teams={userTeams} toast={toast} />;
}

function PDOView({ data }) {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Cross-team overview for PDO</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Active
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            Overdue
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={data.totals.activeProjects} color="brand" />
        <StatCard label="Total Tasks" value={data.totals.totalTasks} color="slate" />
        <StatCard label="Completed" value={data.totals.doneTasks} color="emerald" />
        <StatCard label="Overdue" value={data.totals.overdueTasks} color="red" />
      </div>

      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-bold text-slate-900">Teams</h2>
          <div className="h-px flex-1 bg-surface-border" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.teams.map(({ team, stats, members, recentProjects }) => (
            <div key={team.id} className="card p-5 hover:shadow-card-hover transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Link to={`/teams/${team.id}`} className="font-bold text-slate-900 hover:text-brand-600 transition-colors">
                    {team.name}
                  </Link>
                  {team.description && <p className="text-xs text-slate-500 mt-0.5">{team.description}</p>}
                </div>
                <span className="badge-gray text-[11px]">{stats.memberCount} members</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <MiniStat label="Active" value={stats.activeProjects} />
                <MiniStat label="Closed" value={stats.closedProjects} />
                <MiniStat label="Tasks" value={stats.totalTasks} />
                <MiniStat label="Overdue" value={stats.overdueTasks} color="red" />
              </div>
              {recentProjects.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent projects</p>
                  <div className="space-y-1">
                    {recentProjects.map(p => (
                      <Link key={p.id} to={`/teams/${team.id}/projects/${p.id}`}
                        className="flex items-center justify-between text-sm text-slate-600 hover:text-brand-600 transition-colors rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50">
                        <span className="truncate font-medium">{p.title}</span>
                        <span className={`badge text-[11px] flex-shrink-0 ml-2 ${p.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>
                          {p.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SchoolHeadView({ data }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">School Head Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">View-only access across all programs</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value={data.totals.activeProjects} color="brand" />
        <StatCard label="Total Tasks" value={data.totals.totalTasks} color="slate" />
        <StatCard label="Completed" value={data.totals.doneTasks} color="emerald" />
        <StatCard label="Overdue" value={data.totals.overdueTasks} color="red" />
      </div>
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-bold text-slate-900">Teams Overview</h2>
          <div className="h-px flex-1 bg-surface-border" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.teams.map(({ team, stats }) => (
            <div key={team.id} className="card p-5">
              <div className="font-bold text-slate-900 mb-3">{team.name}</div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Active" value={stats.activeProjects} />
                <MiniStat label="Closed" value={stats.closedProjects} />
                <MiniStat label="Tasks" value={stats.totalTasks} />
                <MiniStat label="Overdue" value={stats.overdueTasks} color="red" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CoordinatorDashboard({ teams, toast }) {
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      teams.map(async (t) => {
        const projects = await getTeamProjects(t.id);
        return { team: t, projects };
      })
    ).then(setTeamData).catch(err => toast(err.message)).finally(() => setLoading(false));
  }, [teams]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Your teams and projects at a glance</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {teamData.map(({ team, projects }) => (
          <div key={team.id} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <Link to={`/teams/${team.id}`} className="font-bold text-slate-900 hover:text-brand-600 transition-colors">
                {team.name}
              </Link>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md font-medium">{projects.length} projects</span>
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-slate-400">No projects yet.</p>
            ) : (
              <div className="space-y-1">
                {projects.slice(0, 5).map(p => (
                  <Link key={p.id} to={`/teams/${team.id}/projects/${p.id}`}
                    className="flex items-center justify-between text-sm text-slate-600 hover:text-brand-600 transition-colors py-1.5 px-2 -mx-2 rounded-lg hover:bg-slate-50">
                    <span className="truncate font-medium">{p.title}</span>
                    <span className={`badge text-[11px] flex-shrink-0 ml-2 ${p.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>
                      {p.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
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

function StatCard({ label, value, color }) {
  const colors = {
    brand: 'from-brand-500 to-brand-600',
    slate: 'from-slate-700 to-slate-800',
    emerald: 'from-emerald-500 to-emerald-600',
    red: 'from-red-500 to-red-600',
  };
  const icons = {
    brand: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z',
    slate: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    emerald: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    red: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
  };
  return (
    <div className={`stat-card bg-gradient-to-br ${colors[color] || colors.slate}`}>
      <div className="relative z-10">
        <svg className="w-5 h-5 text-white/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icons[color] || icons.slate} />
        </svg>
        <p className="text-3xl font-extrabold tracking-tight">{value}</p>
        <p className="text-sm text-white/70 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <p className={`text-lg font-bold ${color === 'red' ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
      <p className="text-[11px] text-slate-500 font-medium">{label}</p>
    </div>
  );
}
