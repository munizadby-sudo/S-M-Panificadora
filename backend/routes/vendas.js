const express  = require('express');
const router   = express.Router();
const db       = require('../database/db');
const { autenticar, apenasAdmin } = require('../middlewares/auth');
const { temPermissao }  = require('../middlewares/permission');
const vendaService = require('../services/vendaService');

// GET /api/vendas?data_ini=YYYY-MM-DD&data_fim=YYYY-MM-DD
router.get('/', temPermissao('rel'), async (req, res, next) => {
  try {
    const { data_ini, data_fim } = req.query;
    const hoje    = new Date().toISOString().split('T')[0];
    const dataIni = data_ini || hoje;
    const dataFim = data_fim || dataIni;

    const [vendas] = await db.execute(`
      SELECT v.*, u.nome AS operador_nome
      FROM vendas v
      LEFT JOIN usuarios u ON u.id = v.usuario_id
      WHERE DATE(v.criado_em) BETWEEN ? AND ?
      ORDER BY v.criado_em DESC
    `, [dataIni, dataFim]);

    // Carrega itens de todas as vendas em uma única query
    if (vendas.length) {
      const ids = vendas.map(v => v.id);
      const placeholders = ids.map(() => '?').join(',');
      const [itens] = await db.execute(
        `SELECT * FROM venda_itens WHERE venda_id IN (${placeholders})`,
        ids
      );
      // Map para O(1) no agrupamento
      const itensPorVenda = new Map();
      itens.forEach(i => {
        if (!itensPorVenda.has(i.venda_id)) itensPorVenda.set(i.venda_id, []);
        itensPorVenda.get(i.venda_id).push(i);
      });
      vendas.forEach(v => { v.itens = itensPorVenda.get(v.id) || []; });
    }

    res.json(vendas);
  } catch (e) { next(e); }
});

// POST /api/vendas
router.post('/', temPermissao('caixa'), async (req, res, next) => {
  try {
    const result = await vendaService.criarVenda(req.body, req.usuario, req.ip);
    res.json(result);
  } catch (e) { next(e); }
});

// DELETE /api/vendas/:id  — soft delete com motivo
router.delete('/:id', apenasAdmin, async (req, res, next) => {
  try {
    const motivo = req.body?.motivo;
    const result = await vendaService.cancelarVenda(
      parseInt(req.params.id), motivo, req.usuario, req.ip
    );
    res.json(result);
  } catch (e) { next(e); }
});

module.exports = router;
