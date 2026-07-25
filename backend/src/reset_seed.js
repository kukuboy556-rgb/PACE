require('dotenv').config();
const { pool } = require('./config/database');

async function run() {
  await pool.query("DELETE FROM team_members WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@pace.edu.ph')");
  await pool.query("DELETE FROM users WHERE email LIKE '%@pace.edu.ph'");
  console.log('Old users cleared');
  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash('admin123', 10);
  const { rows: users } = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES
     ('Admin PDO', 'admin@pace.edu.ph', $1),
     ('Coordinator DRRM', 'drrm@pace.edu.ph', $1),
     ('Coordinator SBFP', 'sbfp@pace.edu.ph', $1),
     ('Coordinator Infra', 'infra@pace.edu.ph', $1),
     ('School Head', 'head@pace.edu.ph', $1)
     RETURNING *`,
    [hash]
  );
  console.log(`Seeded ${users.length} users`);
  const { rows: teams } = await pool.query(
    `INSERT INTO teams (name, description) VALUES
     ('DRRM Team', 'Disaster Risk Reduction and Management'),
     ('SBFP Team', 'School-Based Feeding Program'),
     ('Infrastructure Team', 'School Infrastructure and Facilities')
     ON CONFLICT DO NOTHING RETURNING *`
  );
  console.log(`Seeded ${teams.length} teams`);
  for (const user of users) {
    if (user.email === 'admin@pace.edu.ph') {
      for (const team of teams) {
        await pool.query('INSERT INTO team_members (team_id, user_id, role_in_team) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [team.id, user.id, 'PDO']);
      }
    } else if (user.email === 'drrm@pace.edu.ph') {
      await pool.query('INSERT INTO team_members (team_id, user_id, role_in_team) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [teams.find(t => t.name === 'DRRM Team').id, user.id, 'Coordinator']);
    } else if (user.email === 'sbfp@pace.edu.ph') {
      await pool.query('INSERT INTO team_members (team_id, user_id, role_in_team) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [teams.find(t => t.name === 'SBFP Team').id, user.id, 'Coordinator']);
    } else if (user.email === 'infra@pace.edu.ph') {
      await pool.query('INSERT INTO team_members (team_id, user_id, role_in_team) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [teams.find(t => t.name === 'Infrastructure Team').id, user.id, 'Coordinator']);
    }
  }
  console.log('Team memberships added');
  console.log('\nLogin credentials:');
  console.log('  admin@pace.edu.ph / admin123 (PDO)');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
