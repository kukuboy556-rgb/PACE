const express = require('express');
const { generateAlerts } = require('../services/alertGenerator');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/alerts/generate', authenticate, requireRole('PDO'), async (_req, res) => {
  try {
    const result = await generateAlerts();
    res.json(result);
  } catch (err) {
    console.error('Alert generation failed:', err);
    res.status(500).json({ error: 'Failed to generate alerts' });
  }
});

module.exports = router;
