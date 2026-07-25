const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/projects/:projectId/report', authenticate, async (req, res) => {
  const project = await pool.query(
    `SELECT p.*, t.name as team_name, t.id as team_id FROM projects p
     JOIN teams t ON t.id = p.team_id WHERE p.id = $1`,
    [req.params.projectId]
  );
  if (project.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

  const tasks = await pool.query(
    `SELECT t.*, u.name as assignee_name FROM tasks t
     LEFT JOIN users u ON u.id = t.assignee_id
     WHERE t.project_id = $1 ORDER BY t.created_at`,
    [req.params.projectId]
  );

  const budgets = await pool.query(
    'SELECT * FROM budgets WHERE project_id = $1 ORDER BY source',
    [req.params.projectId]
  );

  const closure = await pool.query(
    `SELECT cr.*, u.name as submitted_by_name FROM closure_reports cr
     JOIN users u ON u.id = cr.submitted_by WHERE cr.project_id = $1`,
    [req.params.projectId]
  );

  const beneficiaries = await pool.query(
    'SELECT * FROM beneficiaries WHERE project_id = $1 ORDER BY period DESC',
    [req.params.projectId]
  );

  res.json({
    project: project.rows[0],
    tasks: tasks.rows,
    budgets: budgets.rows,
    closure: closure.rows[0] || null,
    beneficiaries: beneficiaries.rows,
    generatedAt: new Date().toISOString(),
  });
});

module.exports = router;
