const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { apenasAdmin }  = require('../middlewares/auth');
const { temPermissao } = require('../middlewares/permission');
const { paginacao } = require('../middlewares/pagination');

// GET /api/encomendas?status=pendente&page=1&limit=25
router.get('/', paginacao(), temPermissao('encomendas'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const { page, limit, offset } = req.pagination;
    let sql    = 'SELECT * FROM encomendas';
    const params = [];
    if (status && status !== 'todos') {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY data_entrega ASC, criado_em DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [encs] = await db.execute(sql, params);

    // Contar total para paginação
    let countSql = 'SELECT COUNT(*) as total FROM encomendas';
    if (status && status !== 'todos') {
      countSql += ' WHERE status = ?';
    }
    const [[{ total }]] = await db.execute(countSql, status && status !== 'todos' ? [status] : []);

    if (encs.length) {
      const ids = encs.map(e => e.id);
      const placeholders = ids.map(() => '?').join(',');
      const [itens] = await db.execute(
        `SELECT * FROM encomenda_itens WHERE encomenda_id IN (${placeholders})`, ids
      );
      const porEncomenda = new Map();
      itens.forEach(i => {
        if (!porEncomenda.has(i.encomenda_id)) porEncomenda.set(i.encomenda_id, []);
        porEncomenda.get(i.encomenda_id).push(i);
      });
      encs.forEach(e => { e.itens = porEncomenda.get(e.id) || []; });
    }

    const pages = Math.ceil(total / limit);
    res.json({
      data: encs,
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

// POST /api/encomendas
router.post('/', temPermissao('encomendas'), async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { cliente, telefone, data_entrega, sinal, observacoes, itens } = req.body;
    if (!cliente?.trim())
      return res.status(400).json({ erro: 'Nome do cliente é obrigatório.' });

    const total = (itens || []).reduce(
      (s, i) => s + (parseFloat(i.preco) || 0) * (parseInt(i.quantidade) || 1), 0
    );

    // Número de encomenda atômico
    const [[seq]] = await conn.execute(
      "SELECT valor FROM sequencias WHERE chave = 'encomenda' FOR UPDATE"
    );
    const numero = seq.valor;
    await conn.execute(
      "UPDATE sequencias SET valor = valor + 1 WHERE chave = 'encomenda'"
    );

    const [r] = await conn.execute(
      `INSERT INTO encomendas
         (numero, cliente, telefone, data_entrega, sinal, observacoes, total, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [numero, cliente.trim(), telefone || '',
       data_entrega || null, parseFloat(sinal) || 0,
       observacoes || '', total, req.usuario.id]
    );
    const encId = r.insertId;

    for (const it of (itens || [])) {
      if (!it.nome?.trim()) continue;
      await conn.execute(
        'INSERT INTO encomenda_itens (encomenda_id, nome, quantidade, preco) VALUES (?, ?, ?, ?)',
        [encId, it.nome.trim(), parseInt(it.quantidade) || 1, parseFloat(it.preco) || 0]
      );
    }

    await conn.commit();
    res.json({ id: encId, numero, mensagem: 'Encomenda criada.' });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally { conn.release(); }
});

// PUT /api/encomendas/:id
router.put('/:id', temPermissao('encomendas'), async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { cliente, telefone, data_entrega, sinal, observacoes, status, itens } = req.body;
    const total = (itens || []).reduce(
      (s, i) => s + (parseFloat(i.preco) || 0) * (parseInt(i.quantidade) || 1), 0
    );

    await conn.execute(
      `UPDATE encomendas
         SET cliente=?, telefone=?, data_entrega=?, sinal=?, observacoes=?, status=?, total=?
       WHERE id=?`,
      [cliente, telefone || '', data_entrega || null,
       parseFloat(sinal) || 0, observacoes || '',
       status || 'pendente', total, req.params.id]
    );

    if (Array.isArray(itens)) {
      await conn.execute(
        'DELETE FROM encomenda_itens WHERE encomenda_id = ?', [req.params.id]
      );
      for (const it of itens) {
        if (!it.nome?.trim()) continue;
        await conn.execute(
          'INSERT INTO encomenda_itens (encomenda_id, nome, quantidade, preco) VALUES (?, ?, ?, ?)',
          [req.params.id, it.nome.trim(), parseInt(it.quantidade) || 1, parseFloat(it.preco) || 0]
        );
      }
    }

    await conn.commit();
    res.json({ mensagem: 'Encomenda atualizada.' });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally { conn.release(); }
});

// PATCH /api/encomendas/:id/status
router.patch('/:id/status', temPermissao('encomendas'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const validos = ['pendente', 'pronto', 'entregue'];
    if (!validos.includes(status))
      return res.status(400).json({ erro: 'Status inválido.' });

    await db.execute(
      'UPDATE encomendas SET status = ? WHERE id = ?', [status, req.params.id]
    );
    res.json({ mensagem: 'Status atualizado.' });
  } catch (e) { next(e); }
});

// DELETE /api/encomendas/:id
router.delete('/:id', apenasAdmin, async (req, res, next) => {
  try {
    await db.execute('DELETE FROM encomendas WHERE id = ?', [req.params.id]);
    res.json({ mensagem: 'Encomenda removida.' });
  } catch (e) { next(e); }
});

module.exports = router;
