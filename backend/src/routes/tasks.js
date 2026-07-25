const express = require('express');
const { pool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/:projectId/tasks', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.*, u.name as assignee_name FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE t.project_id = $1
     ORDER BY t.position ASC, t.created_at DESC`,
    [req.params.projectId]
  );
  res.json(rows);
});

router.post('/:projectId/tasks', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { title, description, assigneeId, dueDate, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  const { rows } = await pool.query(
    `INSERT INTO tasks (project_id, assignee_id, title, description, due_date, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.params.projectId, assigneeId || null, title, description || null, dueDate || null, status || 'To Do']
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { title, description, assigneeId, dueDate, status, position } = req.body;

  const updates = [];
  const values = [];
  let idx = 1;

  if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title); }
  if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
  if (assigneeId !== undefined) { updates.push(`assignee_id = $${idx++}`); values.push(assigneeId); }
  if (dueDate !== undefined) { updates.push(`due_date = $${idx++}`); values.push(dueDate); }
  if (status !== undefined) {
    updates.push(`status = $${idx++}`);
    updates.push(`completed_at = CASE WHEN $${idx-1} = 'Done' THEN NOW() ELSE NULL END`);
    values.push(status);
  }
  if (position !== undefined) { updates.push(`position = $${idx++}`); values.push(position); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  values.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
  res.json(rows[0]);
});

router.delete('/:id', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
