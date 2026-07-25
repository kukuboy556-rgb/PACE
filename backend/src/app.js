const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const documentRoutes = require('./routes/documents');
const logRoutes = require('./routes/logs');
const closureRoutes = require('./routes/closure');
const verificationRoutes = require('./routes/verification');
const dashboardRoutes = require('./routes/dashboard');
const commentRoutes = require('./routes/comments');
const budgetRoutes = require('./routes/budgets');
const alertRoutes = require('./routes/alerts');
const alertGenRoutes = require('./routes/alerts-gen');
const calendarRoutes = require('./routes/calendar');
const reportRoutes = require('./routes/reports');
const labelRoutes = require('./routes/labels');
const viewRoutes = require('./routes/views');
const complianceRoutes = require('./routes/compliance');
const sipRoutes = require('./routes/sip');
const stakeholderRoutes = require('./routes/stakeholders');
const correspondenceRoutes = require('./routes/correspondence');
const standaloneRoutes = require('./routes/standalone');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', documentRoutes);
app.use('/api', logRoutes);
app.use('/api', closureRoutes);
app.use('/api', verificationRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', commentRoutes);
app.use('/api', budgetRoutes);
app.use('/api', alertRoutes);
app.use('/api', alertGenRoutes);
app.use('/api', calendarRoutes);
app.use('/api', reportRoutes);
app.use('/api', labelRoutes);
app.use('/api', viewRoutes);
app.use('/api', complianceRoutes);
app.use('/api', sipRoutes);
app.use('/api', stakeholderRoutes);
app.use('/api', correspondenceRoutes);
app.use('/api', standaloneRoutes);

app.use((err, req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
  }
  if (err.message?.startsWith('File type not allowed')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
