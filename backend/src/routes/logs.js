const express = require('express');
const { pool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/teams/:teamId/logs', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT cl.*, u.name as created_by_name FROM coordination_logs cl
     JOIN users u ON u.id = cl.created_by
     WHERE cl.team_id = $1
     ORDER BY cl.huddle_date DESC`,
    [req.params.teamId]
  );
  res.json(rows);
});

router.post('/teams/:teamId/logs', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { huddleDate, notes } = req.body;
  if (!huddleDate || !notes) {
    return res.status(400).json({ error: 'Huddle date and notes are required' });
  }

  const { rows } = await pool.query(
    `INSERT INTO coordination_logs (team_id, huddle_date, notes, created_by)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [req.params.teamId, huddleDate, notes, req.user.userId]
  );
  res.status(201).json(rows[0]);
});

module.exports = router;
