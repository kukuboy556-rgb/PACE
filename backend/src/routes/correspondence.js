const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/correspondence', authenticate, async (req, res) => {
  const { teamId, type, status, category, from, to } = req.query;
  let sql = `SELECT c.*, u.name AS created_by_name FROM correspondence c
             LEFT JOIN users u ON u.id = c.created_by WHERE 1=1`;
  const params = [];
  if (teamId) { params.push(teamId); sql += ` AND c.team_id = $${params.length}`; }
  if (type) { params.push(type); sql += ` AND c.type = $${params.length}`; }
  if (status) { params.push(status); sql += ` AND c.status = $${params.length}`; }
  if (category) { params.push(category); sql += ` AND c.category = $${params.length}`; }
  if (from) { params.push(from); sql += ` AND c.date >= $${params.length}`; }
  if (to) { params.push(to); sql += ` AND c.date <= $${params.length}`; }
  sql += ' ORDER BY c.date DESC, c.created_at DESC';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

router.post('/correspondence', authenticate, async (req, res) => {
  const { teamId, type, date, subject, recipientOrSender, referenceNumber, category, status, content, fileUrl } = req.body;
  if (!teamId || !type || !date || !subject || !recipientOrSender) {
    return res.status(400).json({ error: 'teamId, type, date, subject, and recipientOrSender are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO correspondence (team_id, type, date, subject, recipient_or_sender, reference_number, category, status, content, file_url, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [teamId, type, date, subject, recipientOrSender, referenceNumber || null, category || 'General', status || 'Draft', content || null, fileUrl || null, req.user.userId]
  );
  res.status(201).json(rows[0]);
});

router.patch('/correspondence/:id', authenticate, async (req, res) => {
  const { subject, recipientOrSender, referenceNumber, category, status, content, fileUrl, type, date } = req.body;
  const sets = []; const p = [];
  if (subject) { p.push(subject); sets.push(`subject = $${p.length}`); }
  if (recipientOrSender !== undefined) { p.push(recipientOrSender); sets.push(`recipient_or_sender = $${p.length}`); }
  if (referenceNumber !== undefined) { p.push(referenceNumber); sets.push(`reference_number = $${p.length}`); }
  if (category) { p.push(category); sets.push(`category = $${p.length}`); }
  if (status) { p.push(status); sets.push(`status = $${p.length}`); }
  if (content !== undefined) { p.push(content); sets.push(`content = $${p.length}`); }
  if (fileUrl !== undefined) { p.push(fileUrl); sets.push(`file_url = $${p.length}`); }
  if (type) { p.push(type); sets.push(`type = $${p.length}`); }
  if (date) { p.push(date); sets.push(`date = $${p.length}`); }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  p.push(req.params.id);
  const { rows } = await pool.query(`UPDATE correspondence SET ${sets.join(', ')} WHERE id = $${p.length} RETURNING *`, p);
  if (rows.length === 0) return res.status(404).json({ error: 'Correspondence not found' });
  res.json(rows[0]);
});

router.delete('/correspondence/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM correspondence WHERE id = $1', [req.params.id]);
  res.json({ message: 'Correspondence deleted' });
});

module.exports = router;
