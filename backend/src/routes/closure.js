const express = require('express');
const { pool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/projects/:projectId/closure', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { lessonsLearned, outcomeIndicator } = req.body;
  if (!lessonsLearned || !outcomeIndicator) {
    return res.status(400).json({ error: 'Lessons learned and outcome indicator are required' });
  }

  const { rows: existing } = await pool.query('SELECT id FROM closure_reports WHERE project_id = $1', [req.params.projectId]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Closure report already exists for this project' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO closure_reports (project_id, lessons_learned, outcome_indicator, submitted_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.projectId, lessonsLearned, outcomeIndicator, req.user.userId]
    );
    await client.query('UPDATE projects SET status = $1 WHERE id = $2', ['Closed', req.params.projectId]);
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Closure submission failed:', err);
    res.status(500).json({ error: 'Failed to submit closure report' });
  } finally {
    client.release();
  }
});

router.get('/projects/:projectId/closure', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT cr.*, u.name as submitted_by_name FROM closure_reports cr
     JOIN users u ON u.id = cr.submitted_by
     WHERE cr.project_id = $1`,
    [req.params.projectId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'No closure report found' });
  res.json(rows[0]);
});

router.patch('/projects/:projectId/closure/reopen', authenticate, requireRole('PDO'), async (req, res) => {
  await pool.query(
    `UPDATE closure_reports SET reopened_at = NOW(), reopened_by = $1 WHERE project_id = $2`,
    [req.user.userId, req.params.projectId]
  );
  await pool.query('UPDATE projects SET status = $1 WHERE id = $2', ['Active', req.params.projectId]);
  res.json({ message: 'Project reopened' });
});

module.exports = router;
