import { useState, useEffect } from 'react';
import { getTeamLabels, createTeamLabel, getTaskLabels, addTaskLabel, removeTaskLabel } from '../api/client';

export default function LabelPicker({ teamId, taskId, onUpdate }) {
  const [labels, setLabels] = useState([]);
  const [taskLabels, setTaskLabels] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  useEffect(() => {
    if (!teamId) return;
    getTeamLabels(teamId).then(setLabels).catch(() => {});
  }, [teamId]);

  useEffect(() => {
    if (!taskId) return;
    getTaskLabels(taskId).then(setTaskLabels).catch(() => {});
  }, [taskId]);

  const toggle = async (labelId) => {
    if (!taskId) return;
    const wasActive = taskLabels.find(l => l.id === labelId);
    setTaskLabels(prev => wasActive ? prev.filter(l => l.id !== labelId) : [...prev, labels.find(l => l.id === labelId)]);
    try {
      if (wasActive) {
        await removeTaskLabel(taskId, labelId);
      } else {
        await addTaskLabel(taskId, labelId);
      }
      onUpdate?.();
    } catch {
      setTaskLabels(prev => wasActive ? [...prev, labels.find(l => l.id === labelId)] : prev.filter(l => l.id !== labelId));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const lbl = await createTeamLabel(teamId, { name: newName, color: newColor });
      setLabels(prev => [...prev, lbl]);
      setNewName('');
      setShowNew(false);
    } catch (err) {
      console.error('Failed to create label:', err);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {labels.map(lbl => {
          const active = taskLabels.find(tl => tl.id === lbl.id);
          return (
            <button key={lbl.id} onClick={() => toggle(lbl.id)}
              className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${
                active ? 'text-white border-transparent' : 'text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
              style={active ? { backgroundColor: lbl.color } : {}}>
              {lbl.name}
            </button>
          );
        })}
        <button onClick={() => setShowNew(!showNew)} className="text-xs px-2 py-0.5 rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400">
          + New
        </button>
      </div>
      {showNew && (
        <form onSubmit={handleCreate} className="flex gap-2 items-center">
          <input value={newColor} onChange={e => setNewColor(e.target.value)} type="color" className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Label name" className="input flex-1 text-xs py-1" />
          <button type="submit" className="btn-primary btn-xs">Add</button>
        </form>
      )}
    </div>
  );
}
