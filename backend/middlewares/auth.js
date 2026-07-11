const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// FIX: Nunca usar secret padrão em produção.
// A versão anterior tinha fallback silencioso — em produção,
// se .env não fosse configurado, o secret viraria código-fonte
// público e qualquer um poderia forjar tokens de admin.
const SECRET = process.env.JWT_SECRET;
if (!SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌  JWT_SECRET não definido. Abortando.');
  process.exit(1);
}
const SECRET_EFETIVO = SECRET || 'dev_secret_nao_usar_em_producao';

// Expiração configurável via .env (padrão 12h)
// Exemplos no .env: JWT_EXPIRES=8h  JWT_EXPIRES=1d  JWT_EXPIRES=30m
const EXPIRES_IN = process.env.JWT_EXPIRES || '12h';

// ── Gera token ────────────────────────────────────────────────
function gerarToken(usuario) {
  return jwt.sign(
    {
      id:         usuario.id,
      nome:       usuario.nome,
      username:   usuario.username,
      role:       usuario.role,
      permissoes: usuario.permissoes,
    },
    SECRET_EFETIVO,
    { expiresIn: EXPIRES_IN }
  );
}

// ── Middleware: verifica JWT em todas as rotas /api protegidas ─
function autenticar(req, res, next) {
  const header = req.headers['authorization'];
  if (!header)
    return res.status(401).json({ erro: 'Token não informado.' });

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer')
    return res.status(401).json({ erro: 'Formato inválido. Use: Bearer <token>' });

  try {
    req.usuario = jwt.verify(parts[1], SECRET_EFETIVO);
    next();
  } catch (err) {
    // Distingue token expirado de token adulterado —
    // mensagem diferente ajuda a depurar sem vazar informação interna.
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
    }
    return res.status(401).json({ erro: 'Token inválido. Faça login novamente.' });
  }
}

// ── Middleware: apenas admin ───────────────────────────────────
function apenasAdmin(req, res, next) {
  if (req.usuario?.role !== 'admin')
    return res.status(403).json({ erro: 'Acesso restrito ao administrador.' });
  next();
}

// ── Helpers ───────────────────────────────────────────────────
const hashSenha      = (senha) => bcrypt.hash(senha, 10);
const verificarSenha = (raw, hash) => bcrypt.compare(raw, hash);

module.exports = { gerarToken, autenticar, apenasAdmin, hashSenha, verificarSenha };
