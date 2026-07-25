import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTeams, createTeam, addMember, removeMember, registerUser, getUsers } from '../api/client';
import { useToast } from '../components/Toast';

export default function TeamList() {
  const toast = useToast();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '' });
  const [addMemberForm, setAddMemberForm] = useState({ teamId: '', userId: '', roleInTeam: 'Coordinator' });

  const loadAll = async () => {
    try {
      const [t, u] = await Promise.all([getTeams(), getUsers()]);
      setTeams(t);
      setUsers(u);
    } catch (err) { toast(err.message); }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createTeam(form);
      setForm({ name: '', description: '' });
      setShowForm(false);
      toast('Team created', 'success');
      await loadAll();
    } catch (err) { toast(err.message); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerUser(userForm.name, userForm.email, userForm.password);
      setUserForm({ name: '', email: '', password: '' });
      setShowUserForm(false);
      toast('User created', 'success');
      await loadAll();
    } catch (err) { toast(err.message); }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await addMember(addMemberForm.teamId, addMemberForm.userId, addMemberForm.roleInTeam);
      setAddMemberForm({ teamId: '', userId: '', roleInTeam: 'Coordinator' });
      await loadAll();
    } catch (err) { toast(err.message); }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await removeMember(teamId, userId);
      await loadAll();
    } catch (err) { toast(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Team & User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create teams, manage members, and add users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUserForm(!showUserForm)} className="btn-secondary btn-sm">
            {showUserForm ? 'Cancel' : 'New User'}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary btn-sm">
            {showForm ? 'Cancel' : 'New Team'}
          </button>
        </div>
      </div>

      {showUserForm && (
        <form onSubmit={handleRegister} className="card p-5 space-y-4 animate-slide-down">
          <h3 className="font-bold text-slate-900">Create User Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input required placeholder="Full name" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="input" />
            <input required type="email" placeholder="Email address" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="input" />
            <input required type="password" placeholder="Temporary password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="input" />
          </div>
          <button type="submit" className="btn-success btn-sm">Create User</button>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 space-y-4 animate-slide-down">
          <input required placeholder="Team name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
          <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="textarea" rows={2} />
          <button type="submit" className="btn-success btn-sm">Create Team</button>
        </form>
      )}

      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900">Users ({users.length})</h2>
          <div className="h-px flex-1 bg-surface-border" />
        </div>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border bg-slate-50/50">
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-cell font-semibold">{u.name}</td>
                  <td className="table-cell text-slate-500">{u.email}</td>
                  <td className="table-cell text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900">Teams</h2>
          <div className="h-px flex-1 bg-surface-border" />
        </div>
        <div className="space-y-4">
          {teams.map(team => (
            <div key={team.id} className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-border bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <div>
                    <Link to={`/teams/${team.id}`} className="font-bold text-slate-900 hover:text-brand-600 transition-colors">
                      {team.name}
                    </Link>
                    {team.description && <p className="text-sm text-slate-500 mt-0.5">{team.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/teams/${team.id}/logs`} className="btn-ghost btn-sm">Logs</Link>
                    <Link to={`/teams/${team.id}/documents`} className="btn-ghost btn-sm">Docs</Link>
                    <Link to={`/teams/${team.id}`} className="btn-ghost btn-sm">Board</Link>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700">Members</h3>
                  <button onClick={() => setAddMemberForm({ ...addMemberForm, teamId: team.id })}
                    className="text-xs font-semibold text-brand-500 hover:text-brand-700">
                    + Add member
                  </button>
                </div>
                {addMemberForm.teamId === team.id && (
                  <form onSubmit={handleAddMember} className="flex gap-2 mb-4 p-3 bg-slate-50 rounded-xl border border-surface-border">
                    <select value={addMemberForm.userId} onChange={e => setAddMemberForm({ ...addMemberForm, userId: e.target.value })}
                      className="select flex-1" required>
                      <option value="">Select user...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                    <select value={addMemberForm.roleInTeam} onChange={e => setAddMemberForm({ ...addMemberForm, roleInTeam: e.target.value })}
                      className="select w-36">
                      <option value="Coordinator">Coordinator</option>
                      <option value="PDO">PDO</option>
                    </select>
                    <button type="submit" className="btn-primary btn-sm">Add</button>
                  </form>
                )}
                <div className="space-y-1">
                  {(team.members || []).map(m => (
                    <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <span className="text-slate-700 font-semibold">{m.name}</span>
                          <span className="text-slate-400 ml-2 text-xs">({m.email})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge text-xs ${m.role_in_team === 'PDO' ? 'badge-blue' : 'badge-green'}`}>
                          {m.role_in_team}
                        </span>
                        <button onClick={() => handleRemoveMember(team.id, m.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
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
