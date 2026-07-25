const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/calendar', authenticate, async (req, res) => {
  const { from, to } = req.query;
  const { rows: memberships } = await pool.query(
    'SELECT team_id, role_in_team FROM team_members WHERE user_id = $1',
    [req.user.userId]
  );

  const isPDO = memberships.some(m => m.role_in_team === 'PDO');
  const teamIds = memberships.map(m => m.team_id);
  const now = new Date();

  let query = `SELECT t.id as task_id, t.title as task_title, t.due_date, t.status,
    p.id as project_id, p.title as project_title, p.program_type,
    tm.name as team_name, tm.id as team_id,
    u.name as assignee_name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    JOIN teams tm ON tm.id = p.team_id
    LEFT JOIN users u ON u.id = t.assignee_id
    WHERE t.due_date IS NOT NULL`;

  const params = [];

  if (!isPDO && teamIds.length > 0) {
    query += ` AND p.team_id = ANY($${params.length + 1}::uuid[])`;
    params.push(teamIds);
  } else if (!isPDO) {
    return res.json([]);
  }

  if (from) { query += ` AND t.due_date >= $${params.length + 1}`; params.push(from); }
  if (to) { query += ` AND t.due_date <= $${params.length + 1}`; params.push(to); }

  query += ' ORDER BY t.due_date ASC';

  const { rows } = await pool.query(query, params);
  const enriched = rows.map(r => {
    const due = r.due_date ? new Date(r.due_date) : null;
    const diff = due ? Math.ceil((due - now) / (1000 * 60 * 60 * 24)) : null;
    let flag = 'on-track';
    if (r.status === 'Done') flag = 'done';
    else if (diff !== null && diff < 0) flag = 'overdue';
    else if (diff !== null && diff <= 3) flag = 'due-soon';
    return { ...r, flag };
  });

  res.json(enriched);
});

module.exports = router;
