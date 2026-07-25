const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/tasks/:taskId/comments', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.name as user_name FROM task_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.task_id = $1 ORDER BY c.created_at ASC`,
    [req.params.taskId]
  );
  res.json(rows);
});

router.post('/tasks/:taskId/comments', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  const { rows } = await pool.query(
    `INSERT INTO task_comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.taskId, req.user.userId, content]
  );
  const { rows: [withUser] } = await pool.query(
    `SELECT c.*, u.name as user_name FROM task_comments c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
    [rows[0].id]
  );
  res.status(201).json(withUser);
});

module.exports = router;
