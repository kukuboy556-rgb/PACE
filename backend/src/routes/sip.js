const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/sip/goals', authenticate, async (req, res) => {
  const { teamId } = req.query;
  let sql = `SELECT sg.*, t.name AS team_name FROM sip_goals sg
             JOIN teams t ON t.id = sg.team_id WHERE 1=1`;
  const params = [];
  if (teamId) { params.push(teamId); sql += ` AND sg.team_id = $${params.length}`; }
  sql += ' ORDER BY sg.created_at DESC';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

router.post('/sip/goals', authenticate, async (req, res) => {
  const { teamId, schoolYear, goal, priorityArea, targetMetric, baselineValue, targetValue, targetDate } = req.body;
  if (!teamId || !schoolYear || !goal || !priorityArea) {
    return res.status(400).json({ error: 'teamId, schoolYear, goal, and priorityArea are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO sip_goals (team_id, school_year, goal, priority_area, target_metric, baseline_value, target_value, target_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [teamId, schoolYear, goal, priorityArea, targetMetric || null, baselineValue || null, targetValue || null, targetDate || null]
  );
  res.status(201).json(rows[0]);
});

router.get('/sip/goals/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT sg.*, t.name AS team_name FROM sip_goals sg
     JOIN teams t ON t.id = sg.team_id WHERE sg.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
  const { rows: activities } = await pool.query(
    'SELECT * FROM aip_activities WHERE goal_id = $1 ORDER BY quarter, created_at',
    [req.params.id]
  );
  const withBudget = await Promise.all(activities.map(async (a) => {
    const { rows: budgets } = await pool.query(
      'SELECT * FROM sip_budget_lines WHERE activity_id = $1',
      [a.id]
    );
    return { ...a, budgets };
  }));
  res.json({ ...rows[0], activities: withBudget });
});

router.patch('/sip/goals/:id', authenticate, async (req, res) => {
  const { goal, priorityArea, targetMetric, baselineValue, targetValue, targetDate } = req.body;
  const { rows } = await pool.query(
    `UPDATE sip_goals SET
      goal = COALESCE($1, goal),
      priority_area = COALESCE($2, priority_area),
      target_metric = COALESCE($3, target_metric),
      baseline_value = COALESCE($4, baseline_value),
      target_value = COALESCE($5, target_value),
      target_date = COALESCE($6, target_date)
     WHERE id = $7 RETURNING *`,
    [goal, priorityArea, targetMetric, baselineValue, targetValue, targetDate, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Goal not found' });
  res.json(rows[0]);
});

router.delete('/sip/goals/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM sip_goals WHERE id = $1', [req.params.id]);
  res.json({ message: 'Goal deleted' });
});

router.post('/sip/activities', authenticate, async (req, res) => {
  const { goalId, activity, quarter, responsiblePerson, targetCompletion } = req.body;
  if (!goalId || !activity || !quarter) {
    return res.status(400).json({ error: 'goalId, activity, and quarter are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO aip_activities (goal_id, activity, quarter, responsible_person, target_completion)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [goalId, activity, quarter, responsiblePerson || null, targetCompletion || null]
  );
  res.status(201).json(rows[0]);
});

router.patch('/sip/activities/:id', authenticate, async (req, res) => {
  const { status, actualCompletion, remarks, activity, responsiblePerson, targetCompletion } = req.body;
  const setClauses = [];
  const params = [];
  if (activity) { params.push(activity); setClauses.push(`activity = $${params.length}`); }
  if (status) { params.push(status); setClauses.push(`status = $${params.length}`); }
  if (actualCompletion !== undefined) { params.push(actualCompletion); setClauses.push(`actual_completion = $${params.length}`); }
  if (remarks !== undefined) { params.push(remarks); setClauses.push(`remarks = $${params.length}`); }
  if (responsiblePerson !== undefined) { params.push(responsiblePerson); setClauses.push(`responsible_person = $${params.length}`); }
  if (targetCompletion !== undefined) { params.push(targetCompletion); setClauses.push(`target_completion = $${params.length}`); }
  if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE aip_activities SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Activity not found' });
  res.json(rows[0]);
});

router.post('/sip/budget-lines', authenticate, async (req, res) => {
  const { activityId, fundSource, allocated, obligated, disbursed, notes } = req.body;
  if (!activityId || !fundSource) {
    return res.status(400).json({ error: 'activityId and fundSource are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO sip_budget_lines (activity_id, fund_source, allocated, obligated, disbursed, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [activityId, fundSource, allocated || 0, obligated || 0, disbursed || 0, notes || null]
  );
  res.status(201).json(rows[0]);
});

router.patch('/sip/budget-lines/:id', authenticate, async (req, res) => {
  const { allocated, obligated, disbursed, notes } = req.body;
  const setClauses = [];
  const params = [];
  if (allocated !== undefined) { params.push(allocated); setClauses.push(`allocated = $${params.length}`); }
  if (obligated !== undefined) { params.push(obligated); setClauses.push(`obligated = $${params.length}`); }
  if (disbursed !== undefined) { params.push(disbursed); setClauses.push(`disbursed = $${params.length}`); }
  if (notes !== undefined) { params.push(notes); setClauses.push(`notes = $${params.length}`); }
  if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE sip_budget_lines SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Budget line not found' });
  res.json(rows[0]);
});

router.get('/sip/physical-financial', authenticate, async (req, res) => {
  const { teamId, schoolYear } = req.query;
  let sql = `SELECT * FROM physical_financial_status WHERE 1=1`;
  const params = [];
  if (teamId) { params.push(teamId); sql += ` AND team_id = $${params.length}`; }
  if (schoolYear) { params.push(schoolYear); sql += ` AND school_year = $${params.length}`; }
  sql += ' ORDER BY month, fund_source';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

router.post('/sip/physical-financial', authenticate, async (req, res) => {
  const { teamId, schoolYear, month, fundSource, physicalAccomplishment, financialObligation, financialDisbursement } = req.body;
  if (!teamId || !schoolYear || !month || !fundSource) {
    return res.status(400).json({ error: 'teamId, schoolYear, month, and fundSource are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO physical_financial_status (team_id, school_year, month, fund_source, physical_accomplishment, financial_obligation, financial_disbursement)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (team_id, school_year, month, fund_source)
     DO UPDATE SET
       physical_accomplishment = EXCLUDED.physical_accomplishment,
       financial_obligation = EXCLUDED.financial_obligation,
       financial_disbursement = EXCLUDED.financial_disbursement
     RETURNING *`,
    [teamId, schoolYear, month, fundSource, physicalAccomplishment || 0, financialObligation || 0, financialDisbursement || 0]
  );
  res.status(201).json(rows[0]);
});

router.get('/sip/summary', authenticate, async (req, res) => {
  const { teamId, schoolYear } = req.query;
  if (!teamId || !schoolYear) {
    return res.status(400).json({ error: 'teamId and schoolYear are required' });
  }
  const { rows: goals } = await pool.query(
    'SELECT * FROM sip_goals WHERE team_id = $1 AND school_year = $2',
    [teamId, schoolYear]
  );
  const goalIds = goals.map(g => g.id);
  if (goalIds.length === 0) return res.json({ goals: [], totalAllocated: 0, totalDisbursed: 0, utilizationRate: 0 });

  const { rows: budgetRows } = await pool.query(
    `SELECT SUM(allocated) AS total_allocated, SUM(disbursed) AS total_disbursed
     FROM sip_budget_lines WHERE activity_id = ANY($1::uuid[])`,
    [goalIds]
  );
  const totalAllocated = parseFloat(budgetRows[0]?.total_allocated || 0);
  const totalDisbursed = parseFloat(budgetRows[0]?.total_disbursed || 0);

  const { rows: pfRows } = await pool.query(
    `SELECT fund_source, SUM(physical_accomplishment) AS total_physical,
            SUM(financial_obligation) AS total_obligation, SUM(financial_disbursement) AS total_disbursement
     FROM physical_financial_status
     WHERE team_id = $1 AND school_year = $2
     GROUP BY fund_source`,
    [teamId, schoolYear]
  );

  res.json({
    goals: goals.length,
    totalAllocated,
    totalDisbursed,
    utilizationRate: totalAllocated > 0 ? Math.round((totalDisbursed / totalAllocated) * 100) : 0,
    physicalFinancial: pfRows,
  });
});

module.exports = router;
