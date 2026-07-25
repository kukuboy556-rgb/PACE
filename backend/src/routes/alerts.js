const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/alerts', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM alerts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [req.user.userId]
  );
  res.json(rows);
});

router.get('/alerts/unread-count', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT COUNT(*) as count FROM alerts WHERE user_id = $1 AND is_read = false',
    [req.user.userId]
  );
  res.json({ count: parseInt(rows[0].count) });
});

router.patch('/alerts/:id/read', authenticate, async (req, res) => {
  await pool.query(
    'UPDATE alerts SET is_read = true WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.userId]
  );
  res.json({ message: 'Marked as read' });
});

router.patch('/alerts/read-all', authenticate, async (req, res) => {
  await pool.query(
    'UPDATE alerts SET is_read = true WHERE user_id = $1',
    [req.user.userId]
  );
  res.json({ message: 'All marked as read' });
});

module.exports = router;
