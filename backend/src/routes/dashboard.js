const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard/pdo', authenticate, async (_req, res) => {

  const teams = await pool.query('SELECT * FROM teams ORDER BY name');
  const dashboard = await Promise.all(
    teams.rows.map(async (team) => {
      const projects = await pool.query(
        'SELECT * FROM projects WHERE team_id = $1 ORDER BY created_at DESC',
        [team.id]
      );

      const activeProjects = projects.rows.filter(p => p.status === 'Active').length;
      const closedProjects = projects.rows.filter(p => p.status === 'Closed').length;

      const tasks = await pool.query(
        `SELECT t.* FROM tasks t
         JOIN projects p ON p.id = t.project_id
         WHERE p.team_id = $1`,
        [team.id]
      );

      const totalTasks = tasks.rows.length;
      const doneTasks = tasks.rows.filter(t => t.status === 'Done').length;
      const overdueTasks = tasks.rows.filter(t =>
        t.status !== 'Done' && t.due_date && new Date(t.due_date) < new Date()
      ).length;

      const members = await pool.query(
        `SELECT u.id, u.name, u.email, tm.role_in_team FROM team_members tm
         JOIN users u ON u.id = tm.user_id
         WHERE tm.team_id = $1`,
        [team.id]
      );

      return {
        team: { id: team.id, name: team.name, description: team.description },
        stats: {
          activeProjects,
          closedProjects,
          totalTasks,
          doneTasks,
          overdueTasks,
          memberCount: members.rows.length,
        },
        members: members.rows,
        recentProjects: projects.rows.slice(0, 5),
      };
    })
  );

  const totals = dashboard.reduce((acc, t) => ({
    activeProjects: acc.activeProjects + t.stats.activeProjects,
    closedProjects: acc.closedProjects + t.stats.closedProjects,
    totalTasks: acc.totalTasks + t.stats.totalTasks,
    doneTasks: acc.doneTasks + t.stats.doneTasks,
    overdueTasks: acc.overdueTasks + t.stats.overdueTasks,
  }), { activeProjects: 0, closedProjects: 0, totalTasks: 0, doneTasks: 0, overdueTasks: 0 });

  res.json({ teams: dashboard, totals });
});

module.exports = router;
