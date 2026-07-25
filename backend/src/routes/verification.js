const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/tasks/:taskId/verify', authenticate, async (req, res) => {
  const { result, comment } = req.body;
  if (!result || !['Verified', 'Discrepancy'].includes(result)) {
    return res.status(400).json({ error: 'Result must be "Verified" or "Discrepancy"' });
  }

  const { rows } = await pool.query(
    `INSERT INTO verification_logs (task_id, verified_by, result, comment)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.taskId, req.user.userId, result, comment || null]
  );
  res.status(201).json(rows[0]);
});

router.get('/verification-logs', authenticate, async (req, res) => {
  const { teamId, from, to } = req.query;
  let query = `SELECT vl.*, u.name as verified_by_name, t.title as task_title, p.title as project_title
    FROM verification_logs vl
    JOIN tasks t ON t.id = vl.task_id
    JOIN projects p ON p.id = t.project_id
    JOIN users u ON u.id = vl.verified_by
    WHERE 1=1`;
  const params = [];

  if (teamId) {
    query += ` AND p.team_id = $${params.length + 1}`;
    params.push(teamId);
  }
  if (from) {
    query += ` AND vl.verified_at >= $${params.length + 1}`;
    params.push(from);
  }
  if (to) {
    query += ` AND vl.verified_at <= $${params.length + 1}`;
    params.push(to);
  }

  query += ' ORDER BY vl.verified_at DESC';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

module.exports = router;
