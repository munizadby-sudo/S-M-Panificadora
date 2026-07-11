const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { apenasAdmin } = require('../middlewares/auth');
const { temPermissao } = require('../middlewares/permission');
const audit   = require('../services/auditService');

// GET /api/produtos
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        p.id,
        p.icone,
        p.nome,
        p.preco,
        p.custo,
        p.ativo,
        p.categoria_id,
        c.nome AS categoria
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.ativo = 1
      ORDER BY c.nome, p.nome
    `);
    console.log(`GET /api/produtos -> ${rows.length} produtos retornados`);
    try {
      console.log('GET /api/produtos sample:', JSON.stringify(rows.slice(0, 5).map(r => ({ id: r.id, nome: r.nome, categoria: r.categoria })), null, 2));
    } catch (err) { /* ignore stringify errors */ }
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/produtos
router.post('/', temPermissao('produtos'), async (req, res, next) => {
  try {
    const { icone, nome, categoria_id, preco, custo } = req.body;
    if (!nome?.trim())
      return res.status(400).json({ erro: 'Nome é obrigatório.' });
    if (preco === undefined || preco === null || isNaN(parseFloat(preco)))
      return res.status(400).json({ erro: 'Preço é obrigatório.' });

    console.log('POST /api/produtos payload:', JSON.stringify({ icone, nome, categoria_id, preco, custo }));
    const [r] = await db.execute(
      'INSERT INTO produtos (icone, nome, categoria_id, preco, custo) VALUES (?, ?, ?, ?, ?)',
      [icone?.trim() || '🛒', nome.trim(),
       categoria_id || null,
       parseFloat(preco),
       parseFloat(custo) || 0]
    );

    await audit.log(req.usuario, 'criar_produto', 'produtos', r.insertId,
      null, { nome, preco }, req.ip);

    console.log(`POST /api/produtos -> id=${r.insertId} nome="${nome}" categoria_id=${categoria_id}`);
    res.json({ id: r.insertId, mensagem: 'Produto cadastrado.' });
  } catch (e) { next(e); }
});

// PUT /api/produtos/:id
router.put('/:id', temPermissao('produtos'), async (req, res, next) => {
  try {
    const { icone, nome, categoria_id, preco, custo } = req.body;
    if (!nome?.trim())
      return res.status(400).json({ erro: 'Nome é obrigatório.' });

    // Captura estado anterior para audit
    const [[antes]] = await db.execute(
      'SELECT nome, preco, custo FROM produtos WHERE id = ?', [req.params.id]
    );

    await db.execute(
      'UPDATE produtos SET icone=?, nome=?, categoria_id=?, preco=?, custo=? WHERE id=?',
      [icone?.trim() || '🛒', nome.trim(),
       categoria_id || null,
       parseFloat(preco),
       parseFloat(custo) || 0,
       req.params.id]
    );

    await audit.log(req.usuario, 'editar_produto', 'produtos', parseInt(req.params.id),
      antes, { nome, preco, custo }, req.ip);

    console.log(`PUT /api/produtos/${req.params.id} -> nome="${nome}" preco=${preco} custo=${custo}`);
    res.json({ mensagem: 'Produto atualizado.' });
  } catch (e) { next(e); }
});

// DELETE /api/produtos/:id — soft delete
router.delete('/:id', apenasAdmin, async (req, res, next) => {
  try {
    await db.execute('UPDATE produtos SET ativo = 0 WHERE id = ?', [req.params.id]);
    await audit.log(req.usuario, 'desativar_produto', 'produtos',
      parseInt(req.params.id), null, null, req.ip);
    console.log(`DELETE /api/produtos/${req.params.id} -> desativado`);
    res.json({ mensagem: 'Produto desativado.' });
  } catch (e) { next(e); }
});

module.exports = router;
