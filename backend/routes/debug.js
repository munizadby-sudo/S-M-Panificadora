const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Rota de debug pública — sem autenticação para facilitar diagnóstico local
router.get('/products', async (req, res, next) => {
  try {
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM produtos');
    const [rows] = await db.execute('SELECT id, nome, ativo, categoria_id, preco, criado_em FROM produtos ORDER BY id LIMIT 20');
    res.json({ total, sample: rows });
  } catch (err) { next(err); }
});

router.get('/estoque', async (req, res, next) => {
  try {
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM estoque');
    const [rows] = await db.execute('SELECT id, produto_id, data, periodo, inicial, produzido, vendido FROM estoque ORDER BY data DESC LIMIT 20');
    res.json({ total, sample: rows });
  } catch (err) { next(err); }
});

router.get('/ping', async (req, res) => {
  try {
    const [[{ now }]] = await db.execute("SELECT NOW() as now");
    res.json({ ok: true, server_time: now });
  } catch (err) { res.status(500).json({ ok: false, erro: err.message }); }
});

module.exports = router;
