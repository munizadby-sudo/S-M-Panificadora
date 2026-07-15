const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { temPermissao } = require('../middlewares/permission');
const { paginacao } = require('../middlewares/pagination');

// Copia o saldo final de ontem como inicial de hoje
async function copiarEstoqueOntem(data) {
  const ontem = new Date(data);
  ontem.setDate(ontem.getDate() - 1);
  const dataOntem = ontem.toISOString().split('T')[0];

  const [ontemRows] = await db.execute(`
    SELECT produto_id,
           GREATEST(0, inicial + produzido - vendido) AS saldo_final,
           minimo
      FROM estoque
     WHERE data = ?
  `, [dataOntem]);

  if (!ontemRows.length) return 0;

  for (const row of ontemRows) {
    await db.execute(`
      INSERT IGNORE INTO estoque
        (produto_id, data, periodo, inicial, produzido, vendido, minimo)
      VALUES (?, ?, 'unico', ?, 0, 0, ?)
    `, [row.produto_id, data, row.saldo_final, row.minimo]);
  }

  return ontemRows.length;
}

// GET /api/estoque?data=YYYY-MM-DD
router.get('/', paginacao(25, 500), temPermissao('estoque'), async (req, res, next) => {
  try {
    const hoje  = new Date().toISOString().split('T')[0];
    const data  = req.query.data || hoje;
    const { page, limit, offset } = req.pagination;

    // Se não há registro para hoje, copia de ontem
    const [[{ total_hoje }]] = await db.execute(
      'SELECT COUNT(*) AS total_hoje FROM estoque WHERE data = ?', [data]
    );

    if (total_hoje === 0) {
      const copiados = await copiarEstoqueOntem(data);
      if (copiados > 0)
        console.log(`✅ Estoque copiado de ontem: ${copiados} produtos → ${data}`);
    }

    const [rows] = await db.execute(`
      SELECT
        p.id          AS produto_id,
        p.icone,
        p.nome,
        c.nome        AS categoria,
        COALESCE(e.inicial,   0) AS inicial,
        COALESCE(e.produzido, 0) AS produzido,
        COALESCE(e.vendido,   0) AS vendido,
        COALESCE(e.minimo,    5) AS minimo,
        e.id          AS estoque_id,
        e.data
      FROM produtos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      LEFT JOIN estoque e ON e.produto_id = p.id AND e.data = ?
      WHERE p.ativo = 1
      ORDER BY c.nome, p.nome
      LIMIT ? OFFSET ?
    `, [data, limit, offset]);

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) AS total FROM produtos WHERE ativo = 1'
    );

    res.json({
      data: rows,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit),
        hasPrevious: page > 1,
        hasNext: page < Math.ceil(total / limit)
      }
    });
  } catch (e) { next(e); }
});

// POST /api/estoque/salvar-lote
router.post('/salvar-lote', temPermissao('estoque'), async (req, res, next) => {
  const { itens } = req.body;
  if (!Array.isArray(itens) || !itens.length)
    return res.status(400).json({ erro: 'Informe um array de itens.' });

  try {
    for (const it of itens) {
      const { produto_id, data, inicial, produzido, vendido, minimo } = it;
      if (!produto_id || !data)
        return res.status(400).json({ erro: 'produto_id e data são obrigatórios.' });

      await db.execute(`
        INSERT INTO estoque (produto_id, data, periodo, inicial, produzido, vendido, minimo)
        VALUES (?, ?, 'unico', ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          inicial   = VALUES(inicial),
          produzido = VALUES(produzido),
          vendido   = VALUES(vendido),
          minimo    = VALUES(minimo)
      `, [produto_id, data,
          parseInt(inicial)   || 0,
          parseInt(produzido) || 0,
          parseInt(vendido)   || 0,
          parseInt(minimo)    || 5]);
    }
    res.json({ mensagem: `${itens.length} itens salvos.` });
  } catch (e) { next(e); }
});

// POST /api/estoque — salva um item
router.post('/', temPermissao('estoque'), async (req, res, next) => {
  try {
    const { produto_id, data, inicial, produzido, vendido, minimo } = req.body;
    if (!produto_id || !data)
      return res.status(400).json({ erro: 'produto_id e data são obrigatórios.' });

    await db.execute(`
      INSERT INTO estoque (produto_id, data, periodo, inicial, produzido, vendido, minimo)
      VALUES (?, ?, 'unico', ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        inicial   = VALUES(inicial),
        produzido = VALUES(produzido),
        vendido   = VALUES(vendido),
        minimo    = VALUES(minimo)
    `, [produto_id, data,
        parseInt(inicial)   || 0,
        parseInt(produzido) || 0,
        parseInt(vendido)   || 0,
        parseInt(minimo)    || 5]);

    res.json({ mensagem: 'Estoque salvo.' });
  } catch (e) { next(e); }
});

module.exports = router;