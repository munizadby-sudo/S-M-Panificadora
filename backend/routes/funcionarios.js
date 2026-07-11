const express = require('express');
const router = express.Router();
const { apenasAdmin } = require('../middlewares/auth');

// GET /api/funcionarios
router.get('/', async (req, res) => {
  try {
    res.json({ data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/funcionarios
router.post('/', apenasAdmin, async (req, res) => {
  try {
    res.status(201).json({ message: 'Funcionário criado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/funcionarios/:id
router.get('/:id', async (req, res) => {
  try {
    res.json({ data: null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/funcionarios/:id
router.put('/:id', apenasAdmin, async (req, res) => {
  try {
    res.json({ message: 'Funcionário atualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/funcionarios/:id
router.delete('/:id', apenasAdmin, async (req, res) => {
  try {
    res.json({ message: 'Funcionário deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
