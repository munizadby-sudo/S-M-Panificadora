const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { temPermissao } = require('../middlewares/permission');

// GET /api/perdas?data=YYYY-MM-DD
router.get('/', temPermissao('estoque'), async (req, res, next) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const data = req.query.data || hoje;

    const [rows] = await db.execute(`
      SELECT p.*, pr.nome AS produto_nome, pr.icone
      FROM perdas p
      LEFT JOIN produtos pr ON pr.id = p.produto_id
      WHERE p.data = ?
      ORDER BY p.criado_em DESC
    `, [data]);

    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/perdas
router.post('/', temPermissao('estoque'), async (req, res, next) => {
  try {
    const { produto_id, quantidade, motivo, data, periodo, obs } = req.body;
    if (!produto_id || !quantidade || !motivo || !data)
      return res.status(400).json({ erro: 'produto_id, quantidade, motivo e data são obrigatórios.' });

    const validos = ['queimado', 'vencido', 'danificado', 'sobra'];
    if (!validos.includes(motivo))
      return res.status(400).json({ erro: `Motivo inválido. Use: ${validos.join(', ')}` });

    // Busca custo do produto para calcular custo da perda
    const [[prod]] = await db.execute(
      'SELECT custo FROM produtos WHERE id = ?', [produto_id]
    );
    const custoTotal = (prod?.custo || 0) * (parseInt(quantidade) || 1);

    const [r] = await db.execute(
      `INSERT INTO perdas
         (produto_id, quantidade, motivo, data, periodo, usuario_id, obs, custo_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [produto_id, parseInt(quantidade), motivo,
       data, periodo || 'manha',
       req.usuario.id, obs || '', custoTotal]
    );

    res.json({ id: r.insertId, custo_total: custoTotal, mensagem: 'Perda registrada.' });
  } catch (e) { next(e); }
});

// DELETE /api/perdas/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await db.execute('DELETE FROM perdas WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Registro removido.' });
  } catch (e) { next(e); }
});

module.exports = router;
