const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/projects/:projectId/views', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM saved_views WHERE project_id = $1 ORDER BY created_at',
    [req.params.projectId]
  );
  res.json(rows);
});

router.post('/projects/:projectId/views', authenticate, async (req, res) => {
  const { name, filters } = req.body;
  if (!name) return res.status(400).json({ error: 'View name is required' });
  const { rows } = await pool.query(
    'INSERT INTO saved_views (project_id, name, filters, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
    [req.params.projectId, name, JSON.stringify(filters || {}), req.user.id]
  );
  res.status(201).json(rows[0]);
});

router.delete('/views/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM saved_views WHERE id = $1 AND created_by = $2', [req.params.id, req.user.id]);
  res.json({ message: 'View deleted' });
});

module.exports = router;
