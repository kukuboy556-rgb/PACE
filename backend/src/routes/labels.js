const express = require('express');
const { pool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/:teamId/labels', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM labels WHERE team_id = $1 ORDER BY name', [req.params.teamId]);
  res.json(rows);
});

router.post('/:teamId/labels', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Label name is required' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO labels (team_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [req.params.teamId, name, color || '#3b82f6']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Label already exists' });
    throw err;
  }
});

router.delete('/labels/:id', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  await pool.query('DELETE FROM labels WHERE id = $1', [req.params.id]);
  res.json({ message: 'Label deleted' });
});

router.get('/projects/:projectId/task-labels', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT tl.task_id, l.id, l.name, l.color FROM task_labels tl
     JOIN labels l ON l.id = tl.label_id
     JOIN tasks t ON t.id = tl.task_id
     WHERE t.project_id = $1`,
    [req.params.projectId]
  );
  res.json(rows);
});

router.get('/tasks/:taskId/labels', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.* FROM labels l JOIN task_labels tl ON tl.label_id = l.id WHERE tl.task_id = $1`,
    [req.params.taskId]
  );
  res.json(rows);
});

router.post('/tasks/:taskId/labels', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { labelId } = req.body;
  await pool.query('INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.taskId, labelId]);
  res.json({ message: 'Label added' });
});

router.delete('/tasks/:taskId/labels/:labelId', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  await pool.query('DELETE FROM task_labels WHERE task_id = $1 AND label_id = $2', [req.params.taskId, req.params.labelId]);
  res.json({ message: 'Label removed' });
});

module.exports = router;
