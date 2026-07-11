const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { temPermissao }  = require('../middlewares/permission');
const { apenasAdmin }   = require('../middlewares/auth');
const { paginacao } = require('../middlewares/pagination');

// GET /api/fluxo?data=YYYY-MM-DD&page=1&limit=50
router.get('/', paginacao(), temPermissao('fluxo'), async (req, res, next) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const data = req.query.data || hoje;
    const { page, limit, offset } = req.pagination;

    const [rows] = await db.execute(
      `SELECT f.*, u.nome AS operador_nome
       FROM fluxo_caixa f
       LEFT JOIN usuarios u ON u.id = f.usuario_id
       WHERE f.data = ?
       ORDER BY f.criado_em DESC
       LIMIT ? OFFSET ?`,
      [data, limit, offset]
    );
    
    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM fluxo_caixa WHERE data = ?',
      [data]
    );
    
    const pages = Math.ceil(total / limit);
    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasPrevious: page > 1,
        hasNext: page < pages
      }
    });
  } catch (e) { next(e); }
});

// POST /api/fluxo
router.post('/', temPermissao('fluxo'), async (req, res, next) => {
  try {
    const { tipo, descricao, categoria, forma, valor, data } = req.body;

    if (!tipo || !descricao?.trim() || !valor || !data)
      return res.status(400).json({ erro: 'tipo, descricao, valor e data são obrigatórios.' });

    if (!['entrada', 'saida'].includes(tipo))
      return res.status(400).json({ erro: 'tipo deve ser "entrada" ou "saida".' });

    if (parseFloat(valor) <= 0)
      return res.status(400).json({ erro: 'Valor deve ser maior que zero.' });

    const [r] = await db.execute(
      `INSERT INTO fluxo_caixa
         (usuario_id, tipo, descricao, categoria, forma, valor, data, gerado_auto)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [req.usuario.id, tipo, descricao.trim(),
       categoria || '', forma || '',
       parseFloat(valor), data]
    );
    res.json({ id: r.insertId, mensagem: 'Lançamento registrado.' });
  } catch (e) { next(e); }
});

// DELETE /api/fluxo/:id — não permite deletar entradas automáticas
router.delete('/:id', temPermissao('fluxo'), async (req, res, next) => {
  try {
    const [[row]] = await db.execute(
      'SELECT gerado_auto FROM fluxo_caixa WHERE id = ?', [req.params.id]
    );
    if (!row) return res.status(404).json({ erro: 'Lançamento não encontrado.' });

    if (row.gerado_auto && req.usuario.role !== 'admin')
      return res.status(403).json({ erro: 'Entradas automáticas de venda não podem ser excluídas manualmente.' });

    await db.execute('DELETE FROM fluxo_caixa WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Lançamento removido.' });
  } catch (e) { next(e); }
});

module.exports = router;
