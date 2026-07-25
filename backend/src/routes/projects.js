const express = require('express');
const { pool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/:teamId/projects', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM projects WHERE team_id = $1 ORDER BY created_at DESC',
    [req.params.teamId]
  );
  res.json(rows);
});

router.post('/:teamId/projects', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { title, programType, startDate, targetEndDate } = req.body;
  if (!title || !programType) {
    return res.status(400).json({ error: 'Title and program type are required' });
  }

  const { rows } = await pool.query(
    `INSERT INTO projects (team_id, title, program_type, start_date, target_end_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.params.teamId, title, programType, startDate || null, targetEndDate || null]
  );
  res.status(201).json(rows[0]);
});

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

module.exports = router;
