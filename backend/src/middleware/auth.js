const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

function authenticate(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (roles.includes('PDO')) {
      const { rows } = await pool.query(
        'SELECT role_in_team FROM team_members WHERE user_id = $1 AND role_in_team = $2 LIMIT 1',
        [req.user.userId, 'PDO']
      );
      if (rows.length > 0) {
        req.isPDO = true;
        return next();
      }
    }

    if (roles.includes('Coordinator') && req.params.teamId) {
      const { rows } = await pool.query(
        'SELECT role_in_team FROM team_members WHERE user_id = $1 AND team_id = $2 LIMIT 1',
        [req.user.userId, req.params.teamId]
      );
      if (rows.length > 0) {
        req.teamRole = rows[0].role_in_team;
        return next();
      }
    }

    if (roles.includes('Coordinator') && req.params.projectId) {
      const { rows } = await pool.query(
        `SELECT tm.role_in_team FROM team_members tm
         JOIN projects p ON p.team_id = tm.team_id
         WHERE tm.user_id = $1 AND p.id = $2 LIMIT 1`,
        [req.user.userId, req.params.projectId]
      );
      if (rows.length > 0) {
        req.teamRole = rows[0].role_in_team;
        return next();
      }
    }

    if (roles.includes('Coordinator') && req.params.taskId) {
      const { rows } = await pool.query(
        `SELECT tm.role_in_team FROM team_members tm
         JOIN projects p ON p.team_id = tm.team_id
         JOIN tasks t ON t.project_id = p.id
         WHERE tm.user_id = $1 AND t.id = $2 LIMIT 1`,
        [req.user.userId, req.params.taskId]
      );
      if (rows.length > 0) {
        req.teamRole = rows[0].role_in_team;
        return next();
      }
    }

    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

module.exports = { authenticate, requireRole };
