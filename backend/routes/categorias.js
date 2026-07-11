const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { apenasAdmin } = require('../middlewares/auth');

// GET /api/categorias
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM categorias WHERE ativo = 1 ORDER BY nome'
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/categorias
router.post('/', async (req, res, next) => {
  try {
    const nome = req.body.nome?.trim();
    if (!nome) return res.status(400).json({ erro: 'Nome obrigatório.' });
    const [r] = await db.execute(
      'INSERT INTO categorias (nome) VALUES (?)', [nome]
    );
    res.json({ id: r.insertId, nome });
  } catch (e) { next(e); }
});

// DELETE /api/categorias/:id — soft delete
router.delete('/:id', apenasAdmin, async (req, res, next) => {
  try {
    await db.execute('UPDATE categorias SET ativo = 0 WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Categoria desativada.' });
  } catch (e) { next(e); }
});

module.exports = router;
