/**
 * Handler global de erros do Express.
 * Deve ser o ÚLTIMO middleware registrado no server.js.
 *
 * Correções em relação à versão anterior:
 * 1. Stack trace nunca vai para o cliente — apenas para o console
 * 2. Erros JWT tratados aqui também (caso cheguem sem passar pelo autenticar)
 * 3. Log inclui usuário logado quando disponível (melhor rastreabilidade)
 * 4. Erros 500 não expõem mensagem interna ao cliente em produção
 */
function errorHandler(err, req, res, next) {
  const ts      = new Date().toISOString();
  const usuario = req.usuario?.username || 'anônimo';

  // ── Log interno (servidor) ────────────────────────────────
  console.error(`[${ts}] ${req.method} ${req.path} | user: ${usuario} | ${err.message}`);

  // Stack trace APENAS no console, NUNCA no response — em nenhum ambiente.
  // Em desenvolvimento é útil ver no terminal; no cliente nunca.
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // ── Erros de autenticação / JWT ───────────────────────────
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ erro: 'Token inválido. Faça login novamente.' });

  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });

  // ── Erros do MySQL ────────────────────────────────────────
  if (err.code === 'ER_DUP_ENTRY')
    return res.status(409).json({ erro: 'Registro duplicado. Verifique os dados.' });

  if (err.code === 'ER_NO_REFERENCED_ROW_2')
    return res.status(400).json({ erro: 'Referência inválida nos dados enviados.' });

  if (err.code === 'ER_LOCK_DEADLOCK')
    return res.status(409).json({ erro: 'Conflito de acesso simultâneo. Tente novamente.' });

  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST')
    return res.status(503).json({ erro: 'Serviço temporariamente indisponível.' });

  // ── Upload (multer) ───────────────────────────────────────
  if (err.name === 'MulterError')
    return res.status(400).json({ erro: `Erro no upload: ${err.message}` });

  // ── Validação ─────────────────────────────────────────────
  if (err.name === 'ValidationError')
    return res.status(400).json({ erro: err.message });

  // ── Genérico ──────────────────────────────────────────────
  const status = err.status || 500;

  // FIX: em produção, erros 500 nunca expõem a mensagem interna.
  // A versão anterior usava err.message para status < 500 — correto —
  // mas para 500+ também deixava vazar se err.status não estivesse set.
  const isProd = process.env.NODE_ENV === 'production';
  const msg = status < 500
    ? err.message
    : (isProd ? 'Erro interno do servidor.' : err.message);

  res.status(status).json({ erro: msg });
}

module.exports = errorHandler;
