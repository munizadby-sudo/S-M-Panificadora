const express = require('express');
const router = express.Router();
const { apenasAdmin } = require('../middlewares/auth');

// GET /api/folha
router.get('/', async (req, res) => {
  try {
    res.json({ data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/folha
router.post('/', apenasAdmin, async (req, res) => {
  try {
    res.status(201).json({ message: 'Folha de pagamento criada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/folha/:id
router.get('/:id', async (req, res) => {
  try {
    res.json({ data: null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/folha/:id
router.put('/:id', apenasAdmin, async (req, res) => {
  try {
    res.json({ message: 'Folha de pagamento atualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/folha/:id
router.delete('/:id', apenasAdmin, async (req, res) => {
  try {
    res.json({ message: 'Folha de pagamento deletada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
