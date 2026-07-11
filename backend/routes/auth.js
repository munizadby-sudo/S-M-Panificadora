const express  = require('express');
const router   = express.Router();
const db       = require('../database/db');
const { gerarToken, verificarSenha } = require('../middlewares/auth');
const audit    = require('../services/auditService');

// ATENÇÃO: loginLimiter removido daqui.
// Ele já é aplicado em server.js antes de montar este router:
//   app.use('/api/auth', loginLimiter, require('./routes/auth'))
//
// Aplicar duas vezes causaria contagem dupla: cada tentativa de
// login consumia 2 slots do limite em vez de 1.

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, senha } = req.body;

    if (!username?.trim() || !senha)
      return res.status(400).json({ erro: 'Informe usuário e senha.' });

    const [rows] = await db.execute(
      'SELECT * FROM usuarios WHERE username = ? AND ativo = 1',
      [username.trim()]
    );

    // Mesma mensagem para user inválido e senha errada — evita enumeração de usuários
    if (!rows.length) {
      await audit.log(null, 'login_falhou', 'usuarios', null,
        null, { username: username.trim() }, req.ip);
      return res.status(401).json({ erro: 'Usuário ou senha incorretos.' });
    }

    const usuario = rows[0];
    const ok = await verificarSenha(senha, usuario.senha_hash);

    if (!ok) {
      await audit.log(usuario, 'login_falhou', 'usuarios', usuario.id,
        null, null, req.ip);
      return res.status(401).json({ erro: 'Usuário ou senha incorretos.' });
    }

    // FIX: JSON.parse defensivo — idêntico ao fix do permission.js.
    // Se permissoes chegar corrompida do banco, não derruba o servidor.
    let permissoes = [];
    try {
      permissoes = typeof usuario.permissoes === 'string'
        ? JSON.parse(usuario.permissoes)
        : (usuario.permissoes ?? []);
    } catch {
      permissoes = [];
    }

    const token = gerarToken({ ...usuario, permissoes });

    await audit.log(usuario, 'login', 'usuarios', usuario.id,
      null, null, req.ip);

    res.json({
      token,
      usuario: {
        id:         usuario.id,
        nome:       usuario.nome,
        username:   usuario.username,
        role:       usuario.role,
        permissoes,
      }
    });
  } catch (e) { next(e); }
});

module.exports = router;