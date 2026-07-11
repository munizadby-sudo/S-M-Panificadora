const express = require('express');
const router = express.Router();
const { apenasAdmin } = require('../middlewares/auth');

// GET /api/adiantamentos
router.get('/', async (req, res) => {
  try {
    res.json({ data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/adiantamentos
router.post('/', apenasAdmin, async (req, res) => {
  try {
    res.status(201).json({ message: 'Adiantamento criado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/adiantamentos/:id
router.get('/:id', async (req, res) => {
  try {
    res.json({ data: null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/adiantamentos/:id
router.put('/:id', apenasAdmin, async (req, res) => {
  try {
    res.json({ message: 'Adiantamento atualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/adiantamentos/:id
router.delete('/:id', apenasAdmin, async (req, res) => {
  try {
    res.json({ message: 'Adiantamento deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
