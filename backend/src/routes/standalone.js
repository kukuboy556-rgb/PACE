const express = require('express');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const VALID_COLLECTIONS = ['ppas', 'coordination', 'sptTasks', 'sdoLogs', 'comms', 'advocacy'];

router.get('/standalone/:collection', authenticate, async (req, res) => {
  const { collection } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const { rows } = await pool.query(
    'SELECT item_id, data FROM standalone_items WHERE user_id = $1 AND collection = $2 ORDER BY created_at ASC',
    [req.user.userId, collection]
  );
  const items = rows.map(r => ({ id: r.item_id, ...r.data }));
  res.json(items);
});

router.post('/standalone/:collection', authenticate, async (req, res) => {
  const { collection } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const { itemId, ...data } = req.body;
  if (!itemId) return res.status(400).json({ error: 'itemId is required' });

  const { rows } = await pool.query(
    `INSERT INTO standalone_items (user_id, collection, item_id, data)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, collection, item_id) DO UPDATE SET data = $4, updated_at = NOW()
     RETURNING id, item_id, data, created_at, updated_at`,
    [req.user.userId, collection, itemId, JSON.stringify(data)]
  );
  res.status(201).json({ id: rows[0].item_id, ...rows[0].data });
});

router.patch('/standalone/:collection/:itemId', authenticate, async (req, res) => {
  const { collection, itemId } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const { rows } = await pool.query(
    `UPDATE standalone_items SET data = data || $1, updated_at = NOW()
     WHERE user_id = $2 AND collection = $3 AND item_id = $4
     RETURNING item_id, data`,
    [JSON.stringify(req.body), req.user.userId, collection, itemId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
  res.json({ id: rows[0].item_id, ...rows[0].data });
});

router.delete('/standalone/:collection/:itemId', authenticate, async (req, res) => {
  const { collection, itemId } = req.params;
  if (!VALID_COLLECTIONS.includes(collection)) {
    return res.status(400).json({ error: 'Invalid collection' });
  }
  const { rowCount } = await pool.query(
    'DELETE FROM standalone_items WHERE user_id = $1 AND collection = $2 AND item_id = $3',
    [req.user.userId, collection, itemId]
  );
  if (rowCount === 0) return res.status(404).json({ error: 'Item not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
