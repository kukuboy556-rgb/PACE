const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/compliance/forms', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM compliance_forms WHERE is_active = true ORDER BY category, name'
  );
  res.json(rows);
});

router.post('/compliance/forms', authenticate, async (req, res) => {
  const { name, code, description, frequency, category, divisionPolicy } = req.body;
  if (!name || !code) return res.status(400).json({ error: 'Name and code are required' });
  const { rows } = await pool.query(
    `INSERT INTO compliance_forms (name, code, description, frequency, category, division_policy)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, code, description || null, frequency || 'Quarterly', category || 'School Form', divisionPolicy || null]
  );
  res.status(201).json(rows[0]);
});

router.get('/compliance/submissions', authenticate, async (req, res) => {
  const { formId, status, from, to } = req.query;
  let sql = `SELECT cs.*, cf.name AS form_name, cf.code AS form_code, cf.frequency,
             u.name AS submitter_name
             FROM compliance_submissions cs
             JOIN compliance_forms cf ON cf.id = cs.form_id
             LEFT JOIN users u ON u.id = cs.submitted_by
             WHERE 1=1`;
  const params = [];
  if (formId) { params.push(formId); sql += ` AND cs.form_id = $${params.length}`; }
  if (status) { params.push(status); sql += ` AND cs.status = $${params.length}`; }
  if (from) { params.push(from); sql += ` AND cs.due_date >= $${params.length}`; }
  if (to) { params.push(to); sql += ` AND cs.due_date <= $${params.length}`; }
  sql += ' ORDER BY cs.due_date DESC';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

router.post('/compliance/submissions', authenticate, async (req, res) => {
  const { formId, periodLabel, dueDate, notes } = req.body;
  if (!formId || !periodLabel || !dueDate) {
    return res.status(400).json({ error: 'formId, periodLabel, and dueDate are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO compliance_submissions (form_id, period_label, due_date, status, notes)
     VALUES ($1, $2, $3, 'Pending', $4) RETURNING *`,
    [formId, periodLabel, dueDate, notes || null]
  );
  res.status(201).json(rows[0]);
});

router.patch('/compliance/submissions/:id', authenticate, async (req, res) => {
  const { status, notes, fileUrl } = req.body;
  const setClauses = [];
  const params = [];
  if (status) { params.push(status); setClauses.push(`status = $${params.length}`); }
  if (notes !== undefined) { params.push(notes); setClauses.push(`notes = $${params.length}`); }
  if (fileUrl !== undefined) { params.push(fileUrl); setClauses.push(`file_url = $${params.length}`); }
  if (status === 'Submitted' || status === 'Acknowledged') {
    setClauses.push(`submitted_at = NOW()`);
    setClauses.push(`submitted_by = $${params.length + 1}`);
    params.push(req.user.userId);
  }
  if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  const { rows } = await pool.query(
    `UPDATE compliance_submissions SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Submission not found' });
  res.json(rows[0]);
});

router.post('/compliance/form-data', authenticate, async (req, res) => {
  const { formCode, periodLabel, data } = req.body;
  if (!formCode || !periodLabel || !data) {
    return res.status(400).json({ error: 'formCode, periodLabel, and data are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO school_form_data (form_code, period_label, data, submitted_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (form_code, period_label)
     DO UPDATE SET data = $3, updated_at = NOW(), submitted_by = $4
     RETURNING *`,
    [formCode, periodLabel, JSON.stringify(data), req.user.userId]
  );
  res.status(201).json(rows[0]);
});

router.get('/compliance/form-data', authenticate, async (req, res) => {
  const { formCode, periodLabel } = req.query;
  let sql = `SELECT sfd.*, u.name AS submitter_name
             FROM school_form_data sfd
             LEFT JOIN users u ON u.id = sfd.submitted_by
             WHERE 1=1`;
  const params = [];
  if (formCode) { params.push(formCode); sql += ` AND sfd.form_code = $${params.length}`; }
  if (periodLabel) { params.push(periodLabel); sql += ` AND sfd.period_label = $${params.length}`; }
  sql += ' ORDER BY sfd.updated_at DESC';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

module.exports = router;
