const express = require('express');
const { pool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, t.name as team_name FROM projects p
     JOIN teams t ON t.id = p.team_id
     WHERE p.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
  res.json(rows[0]);
});

router.patch('/:id', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { title, programType, startDate, targetEndDate, status } = req.body;

  const { rows: existing } = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
  if (existing.length === 0) return res.status(404).json({ error: 'Project not found' });

  const { rows } = await pool.query(
    `UPDATE projects SET
      title = COALESCE($1, title),
      program_type = COALESCE($2, program_type),
      start_date = COALESCE($3, start_date),
      target_end_date = COALESCE($4, target_end_date),
      status = COALESCE($5, status)
     WHERE id = $6 RETURNING *`,
    [title, programType, startDate, targetEndDate, status, req.params.id]
  );
  res.json(rows[0]);
});

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

module.exports = router;
