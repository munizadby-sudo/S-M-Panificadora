const express = require('express');
const router = express.Router();
const { apenasAdmin } = require('../middlewares/auth');

// GET /api/retiradas
router.get('/', async (req, res) => {
  try {
    res.json({ data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/retiradas
router.post('/', apenasAdmin, async (req, res) => {
  try {
    res.status(201).json({ message: 'Retirada criada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/retiradas/:id
router.get('/:id', async (req, res) => {
  try {
    res.json({ data: null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/retiradas/:id
router.put('/:id', apenasAdmin, async (req, res) => {
  try {
    res.json({ message: 'Retirada atualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/retiradas/:id
router.delete('/:id', apenasAdmin, async (req, res) => {
  try {
    res.json({ message: 'Retirada deletada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
