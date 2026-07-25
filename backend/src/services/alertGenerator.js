const { pool } = require('../config/database');

async function generateAlerts() {
  const now = new Date();
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const overdueTasks = await pool.query(
    `SELECT t.id, t.title, t.due_date, p.id as project_id, p.title as project_title,
            p.team_id, tm.user_id
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     JOIN team_members tm ON tm.team_id = p.team_id
     WHERE t.status != 'Done' AND t.due_date < $1
     AND NOT EXISTS (
       SELECT 1 FROM alerts a
       WHERE a.title = 'Task Overdue' AND a.link LIKE '%' || t.id || '%'
       AND a.created_at > NOW() - INTERVAL '7 days'
     )
     GROUP BY t.id, p.id, tm.user_id`,
    [now.toISOString().split('T')[0]]
  );

  for (const task of overdueTasks.rows) {
    await pool.query(
      `INSERT INTO alerts (user_id, title, message, type, link)
       VALUES ($1, 'Task Overdue', $2, 'overdue', $3)`,
      [task.user_id,
       `"${task.title}" was due ${new Date(task.due_date).toLocaleDateString()}`,
       `/teams/${task.team_id}/projects/${task.project_id}`]
    );
  }

  const soonTasks = await pool.query(
    `SELECT t.id, t.title, t.due_date, p.id as project_id, p.title as project_title,
            p.team_id, tm.user_id
     FROM tasks t
     JOIN projects p ON p.id = t.project_id
     JOIN team_members tm ON tm.team_id = p.team_id
     WHERE t.status != 'Done' AND t.due_date BETWEEN $1 AND $2
     AND NOT EXISTS (
       SELECT 1 FROM alerts a
       WHERE a.title = 'Task Due Soon' AND a.link LIKE '%' || t.id || '%'
       AND a.created_at > NOW() - INTERVAL '3 days'
     )
     GROUP BY t.id, p.id, tm.user_id`,
    [now.toISOString().split('T')[0], threeDays.toISOString().split('T')[0]]
  );

  for (const task of soonTasks.rows) {
    await pool.query(
      `INSERT INTO alerts (user_id, title, message, type, link)
       VALUES ($1, 'Task Due Soon', $2, 'deadline', $3)`,
      [task.user_id,
       `"${task.title}" is due in 3 days`,
       `/teams/${task.team_id}/projects/${task.project_id}`]
    );
  }

  const unclosedProjects = await pool.query(
    `SELECT p.id, p.title, p.team_id, tm.user_id FROM projects p
     JOIN team_members tm ON tm.team_id = p.team_id
     WHERE p.status = 'Active' AND p.target_end_date < $1
     AND NOT EXISTS (SELECT 1 FROM closure_reports cr WHERE cr.project_id = p.id)
     AND NOT EXISTS (
       SELECT 1 FROM alerts a
       WHERE a.title = 'Closure Report Required' AND a.link LIKE '%' || p.id || '%'
       AND a.created_at > NOW() - INTERVAL '14 days'
     )
     GROUP BY p.id, tm.user_id`,
    [now.toISOString().split('T')[0]]
  );

  for (const proj of unclosedProjects.rows) {
    await pool.query(
      `INSERT INTO alerts (user_id, title, message, type, link)
       VALUES ($1, 'Closure Report Required', $2, 'closure', $3)`,
      [proj.user_id,
       `"${proj.title}" target end date has passed and no closure report was submitted`,
       `/teams/${proj.team_id}/projects/${proj.id}`]
    );
  }

  return {
    overdue: overdueTasks.rows.length,
    soon: soonTasks.rows.length,
    unclosed: unclosedProjects.rows.length,
  };
}

module.exports = { generateAlerts };
