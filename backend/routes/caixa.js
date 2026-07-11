const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { temPermissao } = require('../middlewares/permission');

// GET /api/caixa/status — verifica se o caixa está aberto hoje
router.get('/status', temPermissao('caixa'), async (req, res, next) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const [[abertura]] = await db.execute(
      `SELECT * FROM caixa_movimentos
       WHERE tipo = 'abertura' AND DATE(criado_em) = ?
       ORDER BY criado_em DESC LIMIT 1`,
      [hoje]
    );
    const [[fechamento]] = await db.execute(
      `SELECT * FROM caixa_movimentos
       WHERE tipo = 'fechamento' AND DATE(criado_em) = ?
       ORDER BY criado_em DESC LIMIT 1`,
      [hoje]
    );
    res.json({
      aberto:   !!abertura && !fechamento,
      abertura: abertura || null,
      fechamento: fechamento || null
    });
  } catch (e) { next(e); }
});

// POST /api/caixa/abrir
router.post('/abrir', temPermissao('caixa'), async (req, res, next) => {
  try {
    const { valor_inicial, observacoes } = req.body;
    const [r] = await db.execute(
      `INSERT INTO caixa_movimentos (tipo, usuario_id, valor_inicial, observacoes)
       VALUES ('abertura', ?, ?, ?)`,
      [req.usuario.id, parseFloat(valor_inicial) || 0, observacoes || '']
    );
    res.json({ id: r.insertId, mensagem: 'Caixa aberto.' });
  } catch (e) { next(e); }
});

// POST /api/caixa/fechar
router.post('/fechar', temPermissao('caixa'), async (req, res, next) => {
  try {
    const { valor_final, observacoes } = req.body;
    const hoje = new Date().toISOString().split('T')[0];

    // Total de vendas do dia
    const [[totalVendas]] = await db.execute(
      `SELECT COALESCE(SUM(total), 0) AS total
       FROM vendas
       WHERE status = 'ativa' AND DATE(criado_em) = ?`,
      [hoje]
    );

    // Total de sangrias (saídas manuais do fluxo)
    const [[totalSangrias]] = await db.execute(
      `SELECT COALESCE(SUM(valor), 0) AS total
       FROM fluxo_caixa
       WHERE tipo = 'saida' AND gerado_auto = 0 AND data = ?`,
      [hoje]
    );

    const [[abertura]] = await db.execute(
      `SELECT valor_inicial FROM caixa_movimentos
       WHERE tipo = 'abertura' AND DATE(criado_em) = ?
       ORDER BY criado_em DESC LIMIT 1`,
      [hoje]
    );

    const esperado  = (abertura?.valor_inicial || 0) + totalVendas.total - totalSangrias.total;
    const contado   = parseFloat(valor_final) || 0;
    const diferenca = contado - esperado;

    const [r] = await db.execute(
      `INSERT INTO caixa_movimentos
         (tipo, usuario_id, valor_inicial, valor_final, total_vendas, total_sangrias, diferenca, observacoes)
       VALUES ('fechamento', ?, ?, ?, ?, ?, ?, ?)`,
      [req.usuario.id,
       abertura?.valor_inicial || 0,
       contado,
       totalVendas.total,
       totalSangrias.total,
       diferenca,
       observacoes || '']
    );

    res.json({
      id: r.insertId,
      total_vendas:    totalVendas.total,
      total_sangrias:  totalSangrias.total,
      valor_esperado:  esperado,
      valor_contado:   contado,
      diferenca,
      mensagem: 'Caixa fechado.'
    });
  } catch (e) { next(e); }
});

// GET /api/caixa/historico
router.get('/historico', async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT cm.*, u.nome AS operador_nome
       FROM caixa_movimentos cm
       LEFT JOIN usuarios u ON u.id = cm.usuario_id
       ORDER BY cm.criado_em DESC
       LIMIT 30`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

module.exports = router;
