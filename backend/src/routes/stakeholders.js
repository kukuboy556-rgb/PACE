const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/stakeholders', authenticate, async (req, res) => {
  const { teamId, type } = req.query;
  let sql = `SELECT s.*, t.name AS team_name FROM stakeholders s
             JOIN teams t ON t.id = s.team_id WHERE s.is_active = true`;
  const params = [];
  if (teamId) { params.push(teamId); sql += ` AND s.team_id = $${params.length}`; }
  if (type) { params.push(type); sql += ` AND s.type = $${params.length}`; }
  sql += ' ORDER BY s.name';
  const { rows } = await pool.query(sql, params);
  const withEngagements = await Promise.all(rows.map(async (s) => {
    const { rows: engagements } = await pool.query(
      'SELECT COUNT(*)::int AS count, MAX(engagement_date) AS last FROM engagement_logs WHERE stakeholder_id = $1',
      [s.id]
    );
    return { ...s, engagementCount: engagements[0].count, lastEngagement: engagements[0].last };
  }));
  res.json(withEngagements);
});

router.post('/stakeholders', authenticate, async (req, res) => {
  const { teamId, name, organization, type, contactPerson, contactNumber, email, address, notes } = req.body;
  if (!teamId || !name) return res.status(400).json({ error: 'teamId and name are required' });
  const { rows } = await pool.query(
    `INSERT INTO stakeholders (team_id, name, organization, type, contact_person, contact_number, email, address, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [teamId, name, organization || null, type || 'Community', contactPerson || null, contactNumber || null, email || null, address || null, notes || null]
  );
  res.status(201).json(rows[0]);
});

router.patch('/stakeholders/:id', authenticate, async (req, res) => {
  const { name, organization, type, contactPerson, contactNumber, email, address, notes, isActive } = req.body;
  const sets = []; const p = [];
  if (name) { p.push(name); sets.push(`name = $${p.length}`); }
  if (organization !== undefined) { p.push(organization); sets.push(`organization = $${p.length}`); }
  if (type) { p.push(type); sets.push(`type = $${p.length}`); }
  if (contactPerson !== undefined) { p.push(contactPerson); sets.push(`contact_person = $${p.length}`); }
  if (contactNumber !== undefined) { p.push(contactNumber); sets.push(`contact_number = $${p.length}`); }
  if (email !== undefined) { p.push(email); sets.push(`email = $${p.length}`); }
  if (address !== undefined) { p.push(address); sets.push(`address = $${p.length}`); }
  if (notes !== undefined) { p.push(notes); sets.push(`notes = $${p.length}`); }
  if (isActive !== undefined) { p.push(isActive); sets.push(`is_active = $${p.length}`); }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  p.push(req.params.id);
  const { rows } = await pool.query(`UPDATE stakeholders SET ${sets.join(', ')} WHERE id = $${p.length} RETURNING *`, p);
  if (rows.length === 0) return res.status(404).json({ error: 'Stakeholder not found' });
  res.json(rows[0]);
});

router.delete('/stakeholders/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM stakeholders WHERE id = $1', [req.params.id]);
  res.json({ message: 'Stakeholder deleted' });
});

router.get('/engagement-logs', authenticate, async (req, res) => {
  const { stakeholderId } = req.query;
  let sql = `SELECT el.*, u.name AS conducted_by_name FROM engagement_logs el
             LEFT JOIN users u ON u.id = el.conducted_by WHERE 1=1`;
  const params = [];
  if (stakeholderId) { params.push(stakeholderId); sql += ` AND el.stakeholder_id = $${params.length}`; }
  sql += ' ORDER BY el.engagement_date DESC';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

router.post('/engagement-logs', authenticate, async (req, res) => {
  const { stakeholderId, engagementDate, engagementType, notes, outcome } = req.body;
  if (!stakeholderId || !engagementDate || !engagementType || !notes) {
    return res.status(400).json({ error: 'stakeholderId, engagementDate, engagementType, and notes are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO engagement_logs (stakeholder_id, engagement_date, engagement_type, notes, outcome, conducted_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [stakeholderId, engagementDate, engagementType, notes, outcome || null, req.user.userId]
  );
  res.status(201).json(rows[0]);
});

module.exports = router;
