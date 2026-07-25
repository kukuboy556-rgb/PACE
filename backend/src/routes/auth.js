const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { userId: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const { rows: teams } = await pool.query(
    `SELECT t.id, t.name, tm.role_in_team FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = $1`,
    [user.id]
  );

  const isPDO = teams.some(t => t.role_in_team === 'PDO');

  res.json({
    user: { id: user.id, name: user.name, email: user.email, isPDO },
    teams,
  });
});

router.post('/register', authenticate, requireRole('PDO'), async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [name, email, hash]
  );
  res.status(201).json(rows[0]);
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [req.user.userId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

  const { rows: teams } = await pool.query(
    `SELECT t.id, t.name, tm.role_in_team FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = $1`,
    [req.user.userId]
  );

  const isPDO = teams.some(t => t.role_in_team === 'PDO');

  res.json({ user: { ...rows[0], isPDO }, teams });
});

router.post('/reset-password', async (req, res) => {
  const { email, newPassword, resetToken } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  if (resetToken !== process.env.RESET_SECRET) {
    return res.status(403).json({ error: 'Invalid reset token' });
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
  res.json({ message: 'Password reset successful' });
});

router.get('/users', authenticate, requireRole('PDO'), async (_req, res) => {
  const { rows } = await pool.query('SELECT id, name, email, created_at FROM users ORDER BY name');
  res.json(rows);
});

module.exports = router;
