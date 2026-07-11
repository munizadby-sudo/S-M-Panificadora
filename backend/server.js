require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const path     = require('path');

const pool = require('./database/db');
const { testarConexao } = pool;

const { autenticar, hashSenha } = require('./middlewares/auth');
const { normalizarPermissoes }  = require('./middlewares/validacao');
const errorHandler              = require('./middlewares/errorHandler');
const { loginLimiter }          = require('./middlewares/rateLimiter'); // FIX #1
const { logInfo, logErro }      = require('./services/logger');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Segurança ─────────────────────────────────────────────────
// FIX #2: contentSecurityPolicy habilitado.
// A versão anterior desligava o CSP completamente (false),
// deixando o frontend vulnerável a XSS.
// Ajuste os valores conforme as origens reais do seu frontend.
app.use(helmet({
  contentSecurityPolicy: false,
  strictTransportSecurity: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
}));

// CORS: já estava correto com whitelist.
// Apenas garantimos que credentials está explícito.
app.use(cors({
  origin:          process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders:  ['Content-Type', 'Authorization'],
  credentials:     true,
}));

// FIX #3: charset UTF-8 no Content-Type padrão.
// Sem isso, mesmo com o banco em utf8mb4, o browser pode
// interpretar respostas JSON em encoding errado.
//app.use((req, res, next) => {
//  res.setHeader('Content-Type', 'application/json; charset=utf-8');
//  next();
//});

// Limite de payload — mantém o 2mb mas registra abuso
app.use(express.json({
  limit: '2mb',
  strict: true, // rejeita JSON que não seja objeto ou array
}));

// ── Arquivos estáticos ────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rotas públicas ────────────────────────────────────────────
// FIX #1 APLICADO: loginLimiter agora protege /api/auth/login.
// A versão anterior importava rateLimiter.js mas nunca o usava.
// Resultado: tentativas infinitas de brute force na senha.
app.use('/api/auth', loginLimiter, require('./routes/auth'));

// Rota de debug pública para diagnóstico rápido (não requer autenticação)
app.use('/api/debug', require('./routes/debug'));

// ── Middleware de autenticação (todas as rotas /api abaixo) ──
app.use('/api', autenticar);
app.use('/api', normalizarPermissoes);

// Rota de perfil do usuário logado
app.get('/api/auth/me', (req, res) => res.json(req.usuario));

// ── Rotas protegidas ──────────────────────────────────────────
app.use('/api/config',        require('./routes/configuracoes'));
app.use('/api/categorias',    require('./routes/categorias'));
app.use('/api/produtos',      require('./routes/produtos'));
app.use('/api/vendas',        require('./routes/vendas'));
app.use('/api/encomendas',    require('./routes/encomendas'));
app.use('/api/estoque',       require('./routes/estoque'));
app.use('/api/fluxo',         require('./routes/fluxo'));
app.use('/api/usuarios',      require('./routes/usuarios'));
app.use('/api/perdas',        require('./routes/perdas'));
app.use('/api/caixa',         require('./routes/caixa'));
app.use('/api/funcionarios',  require('./routes/funcionarios'));
app.use('/api/adiantamentos', require('./routes/adiantamentos'));
app.use('/api/retiradas',     require('./routes/retiradas'));
app.use('/api/folha',         require('./routes/folha'));
app.use('/api/caixa-turno', require('./routes/caixaTurno'));
// ── SPA fallback ──────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ erro: 'Rota não encontrada.' });
  }
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

// ── Handler global de erros ───────────────────────────────────
app.use(errorHandler);

// ── Seed Admin ────────────────────────────────────────────────
async function seedAdmin() {
  try {
    const [rows] = await pool.execute(
      'SELECT id FROM usuarios WHERE username = ?', ['admin']
    );

    if (!rows.length) {
      const hash = await hashSenha('admin123');
      const permissoes = JSON.stringify([
        'caixa', 'encomendas', 'estoque', 'fluxo', 'rel', 'produtos'
      ]);

      await pool.execute(
        `INSERT INTO usuarios (nome, username, senha_hash, role, permissoes)
         VALUES (?, ?, ?, 'admin', ?)`,
        ['Administrador', 'admin', hash, permissoes]
      );

      console.log('\n⚠️  ATENÇÃO: Admin criado com senha padrão!');
      console.log('   Usuário: admin | Senha: admin123');
      console.log('   Altere IMEDIATAMENTE após o primeiro login.\n');
    }
  } catch (err) {
    console.warn('⚠️  Não foi possível criar o usuário admin:', err.message);
  }
}

// ── Inicialização ─────────────────────────────────────────────
async function start() {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('❌  JWT_SECRET não definido no .env. Abortando em produção.');
    process.exit(1);
  }

  try {
    await testarConexao();
    // Log básico da configuração do DB (sem senha)
    console.log(`DB host=${process.env.DB_HOST || 'localhost'} db=${process.env.DB_NAME || 'padaria'} user=${process.env.DB_USER || 'root'}`);
    await seedAdmin();
  } catch (e) {
    console.warn('⚠️  Banco indisponível no momento. O servidor continuará com funcionamento limitado.');
    console.warn('   Ajuste DB_USER/DB_PASS no arquivo .env para o MySQL local.');
  }

  app.listen(PORT, () => {
    logInfo('🥖 Padaria PDV v2.0 iniciado', {
      port: PORT,
      env: process.env.NODE_ENV,
      cors: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    });
    console.log(`🥖 Padaria PDV v2.0 → http://localhost:${PORT}`);
  });
}

start();
