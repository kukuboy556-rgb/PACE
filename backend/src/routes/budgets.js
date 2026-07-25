const express = require('express');
const { pool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/projects/:projectId/budgets', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM budgets WHERE project_id = $1 ORDER BY source',
    [req.params.projectId]
  );
  res.json(rows);
});

router.post('/projects/:projectId/budgets', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { source, amountAllocated, amountSpent, liquidationStatus, notes } = req.body;
  if (!source) return res.status(400).json({ error: 'Source is required' });

  const { rows } = await pool.query(
    `INSERT INTO budgets (project_id, source, amount_allocated, amount_spent, liquidation_status, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [req.params.projectId, source, amountAllocated || 0, amountSpent || 0, liquidationStatus || 'For Liquidation', notes || null]
  );
  res.status(201).json(rows[0]);
});

router.patch('/budgets/:id', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { source, amountAllocated, amountSpent, liquidationStatus, notes } = req.body;
  const { rows } = await pool.query(
    `UPDATE budgets SET
      source = COALESCE($1, source),
      amount_allocated = COALESCE($2, amount_allocated),
      amount_spent = COALESCE($3, amount_spent),
      liquidation_status = COALESCE($4, liquidation_status),
      notes = COALESCE($5, notes),
      updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [source, amountAllocated, amountSpent, liquidationStatus, notes, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Budget not found' });
  res.json(rows[0]);
});

router.get('/projects/:projectId/beneficiaries', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM beneficiaries WHERE project_id = $1 ORDER BY period DESC',
    [req.params.projectId]
  );
  res.json(rows);
});

router.post('/projects/:projectId/beneficiaries', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { metric, count, period, notes } = req.body;
  if (!metric || count === undefined || !period) {
    return res.status(400).json({ error: 'Metric, count, and period are required' });
  }

  const { rows } = await pool.query(
    `INSERT INTO beneficiaries (project_id, metric, count, period, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.params.projectId, metric, count, period, notes || null]
  );
  res.status(201).json(rows[0]);
});

module.exports = router;
