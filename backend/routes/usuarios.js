const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const bcrypt  = require('bcryptjs');
const { apenasAdmin } = require('../middlewares/auth');
const { paginacao } = require('../middlewares/pagination');
const audit   = require('../services/auditService');

// GET /api/usuarios — apenas admin
router.get('/', paginacao(), apenasAdmin, async (req, res, next) => {
  try {
    const { page, limit, offset } = req.pagination;
    const [rows] = await db.execute(
      `SELECT id, nome, username, role, permissoes, ativo, criado_em
       FROM usuarios ORDER BY nome
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM usuarios');
    const pages = Math.ceil(total / limit);
    
    res.json({
      data: rows.map(u => ({
        ...u,
        permissoes: typeof u.permissoes === 'string'
          ? JSON.parse(u.permissoes) : u.permissoes
      })),
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

// POST /api/usuarios
router.post('/', apenasAdmin, async (req, res, next) => {
  try {
    const { nome, username, senha, role, permissoes } = req.body;
    if (!nome?.trim() || !username?.trim() || !senha)
      return res.status(400).json({ erro: 'Nome, usuário e senha são obrigatórios.' });

    const hash  = await bcrypt.hash(senha, 10);
    const perms = role === 'admin'
      ? JSON.stringify(['caixa','encomendas','estoque','fluxo','rel','produtos'])
      : JSON.stringify(Array.isArray(permissoes) ? permissoes : ['caixa']);

    const [r] = await db.execute(
      'INSERT INTO usuarios (nome, username, senha_hash, role, permissoes) VALUES (?, ?, ?, ?, ?)',
      [nome.trim(), username.trim().toLowerCase(), hash, role || 'operador', perms]
    );

    await audit.log(req.usuario, 'criar_usuario', 'usuarios', r.insertId,
      null, { nome, username, role }, req.ip);

    res.json({ id: r.insertId, mensagem: 'Usuário criado.' });
  } catch (e) { next(e); }
});

// PUT /api/usuarios/:id
router.put('/:id', apenasAdmin, async (req, res, next) => {
  try {
    const { nome, username, senha, role, permissoes, ativo } = req.body;
    if (!nome?.trim() || !username?.trim())
      return res.status(400).json({ erro: 'Nome e usuário são obrigatórios.' });

    const perms = role === 'admin'
      ? JSON.stringify(['caixa','encomendas','estoque','fluxo','rel','produtos'])
      : JSON.stringify(Array.isArray(permissoes) ? permissoes : ['caixa']);

    if (senha?.trim()) {
      const hash = await bcrypt.hash(senha, 10);
      await db.execute(
        'UPDATE usuarios SET nome=?, username=?, senha_hash=?, role=?, permissoes=?, ativo=? WHERE id=?',
        [nome.trim(), username.trim().toLowerCase(), hash, role, perms, ativo ? 1 : 0, req.params.id]
      );
    } else {
      await db.execute(
        'UPDATE usuarios SET nome=?, username=?, role=?, permissoes=?, ativo=? WHERE id=?',
        [nome.trim(), username.trim().toLowerCase(), role, perms, ativo ? 1 : 0, req.params.id]
      );
    }

    await audit.log(req.usuario, 'editar_usuario', 'usuarios', parseInt(req.params.id),
      null, { nome, role, ativo }, req.ip);

    res.json({ mensagem: 'Usuário atualizado.' });
  } catch (e) { next(e); }
});

// DELETE /api/usuarios/:id — soft delete
router.delete('/:id', apenasAdmin, async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.usuario.id)
      return res.status(400).json({ erro: 'Você não pode desativar seu próprio usuário.' });

    await db.execute('UPDATE usuarios SET ativo = 0 WHERE id = ?', [req.params.id]);

    await audit.log(req.usuario, 'desativar_usuario', 'usuarios',
      parseInt(req.params.id), null, null, req.ip);

    res.json({ mensagem: 'Usuário desativado.' });
  } catch (e) { next(e); }
});

module.exports = router;
