const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const storage = require('../config/storage');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
const MAX_SIZE = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed: jpg, png, pdf, docx, xlsx'));
    }
  },
});

const router = express.Router();

router.post('/tasks/:taskId/documents', authenticate, requireRole('PDO', 'Coordinator'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File is required' });

  const { rows: task } = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [req.params.taskId]);
  if (task.length === 0) return res.status(404).json({ error: 'Task not found' });

  const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(req.file.originalname);

  try {
    const { url } = await storage.upload(uniqueName, req.file.buffer, req.file.mimetype);

    const { rows } = await pool.query(
      `INSERT INTO documents (task_id, project_id, file_url, doc_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.taskId, task[0].project_id, url, path.extname(req.file.originalname).slice(1), req.user.userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

router.get('/projects/:projectId/documents', authenticate, async (req, res) => {
  const { taskId } = req.query;
  let query = `SELECT d.*, u.name as uploader_name, t.title as task_title
    FROM documents d
    JOIN users u ON u.id = d.uploaded_by
    LEFT JOIN tasks t ON t.id = d.task_id
    WHERE d.project_id = $1`;
  const params = [req.params.projectId];

  if (taskId) {
    query += ' AND d.task_id = $2';
    params.push(taskId);
  }

  query += ' ORDER BY d.uploaded_at DESC';
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

module.exports = router;
