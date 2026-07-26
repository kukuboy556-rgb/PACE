const express = require('express');
const { pool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const { rows: memberships } = await pool.query(
    'SELECT team_id, role_in_team FROM team_members WHERE user_id = $1',
    [req.user.userId]
  );

  const isPDO = memberships.some(m => m.role_in_team === 'PDO');

  let teams;
  if (isPDO) {
    const result = await pool.query('SELECT * FROM teams ORDER BY created_at DESC');
    teams = result.rows;
  } else {
    const ids = memberships.map(m => m.team_id);
    if (ids.length === 0) return res.json([]);
    const result = await pool.query(
      `SELECT * FROM teams WHERE id = ANY($1::uuid[]) ORDER BY created_at DESC`,
      [ids]
    );
    teams = result.rows;
  }

  const teamsWithMembers = await Promise.all(
    teams.map(async (team) => {
      const { rows: members } = await pool.query(
        `SELECT tm.role_in_team, u.id, u.name, u.email FROM team_members tm
         JOIN users u ON u.id = tm.user_id
         WHERE tm.team_id = $1`,
        [team.id]
      );
      return { ...team, members };
    })
  );

  res.json(teamsWithMembers);
});

router.post('/', authenticate, requireRole('PDO'), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Team name is required' });

  const { rows } = await pool.query(
    'INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING *',
    [name, description || null]
  );
  res.status(201).json(rows[0]);
});

router.get('/:id', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM teams WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Team not found' });

  const { rows: members } = await pool.query(
    `SELECT tm.role_in_team, u.id, u.name, u.email FROM team_members tm
     JOIN users u ON u.id = tm.user_id
     WHERE tm.team_id = $1`,
    [req.params.id]
  );

  res.json({ ...rows[0], members });
});

router.patch('/:id', authenticate, requireRole('PDO'), async (req, res) => {
  const { name, description } = req.body;
  const { rows } = await pool.query(
    `UPDATE teams SET name = COALESCE($1, name), description = COALESCE($2, description)
     WHERE id = $3 RETURNING *`,
    [name, description, req.params.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Team not found' });
  res.json(rows[0]);
});

router.post('/:id/members', authenticate, requireRole('PDO'), async (req, res) => {
  const { userId, roleInTeam } = req.body;
  if (!userId || !roleInTeam) {
    return res.status(400).json({ error: 'userId and roleInTeam are required' });
  }

  const { rows: existing } = await pool.query(
    'SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2',
    [req.params.id, userId]
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: 'User is already a member of this team' });
  }

  const { rows } = await pool.query(
    'INSERT INTO team_members (team_id, user_id, role_in_team) VALUES ($1, $2, $3) RETURNING *',
    [req.params.id, userId, roleInTeam]
  );
  res.status(201).json(rows[0]);
});

router.delete('/:id/members/:userId', authenticate, requireRole('PDO'), async (req, res) => {
  await pool.query(
    'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
    [req.params.id, req.params.userId]
  );
  res.json({ message: 'Member removed' });
});

router.get('/:teamId/projects', authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM projects WHERE team_id = $1 ORDER BY created_at DESC',
    [req.params.teamId]
  );
  res.json(rows);
});

router.post('/:teamId/projects', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { title, programType, startDate, targetEndDate } = req.body;
  if (!title || !programType) {
    return res.status(400).json({ error: 'Title and program type are required' });
  }
  const { rows } = await pool.query(
    `INSERT INTO projects (team_id, title, program_type, start_date, target_end_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.params.teamId, title, programType, startDate || null, targetEndDate || null]
  );
  res.status(201).json(rows[0]);
});

router.get('/:teamId/labels', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM labels WHERE team_id = $1 ORDER BY name', [req.params.teamId]);
  res.json(rows);
});

router.post('/:teamId/labels', authenticate, requireRole('PDO', 'Coordinator'), async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Label name is required' });
  const { rows } = await pool.query(
    'INSERT INTO labels (team_id, name, color) VALUES ($1, $2, $3) RETURNING *',
    [req.params.teamId, name, color || '#3b82f6']
  );
  res.status(201).json(rows[0]);
});

module.exports = router;
