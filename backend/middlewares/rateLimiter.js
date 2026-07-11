const rateLimit = require('express-rate-limit');

// ── Login — proteção contra brute force ───────────────────────
// FIX: max reduzido de 10 → 5.
// 10 tentativas em 15 minutos ainda permite testar senhas comuns
// (admin123, 123456, senha, padaria123...). 5 é o equilíbrio certo:
// um operador legítimo que esqueceu a senha vai errar no máximo 3x
// antes de pedir ajuda — e não será bloqueado prematuramente.
const loginLimiter = rateLimit({
  windowMs:              15 * 60 * 1000, // 15 minutos
  max:                   5,              // máx 5 tentativas por IP
  message:               { erro: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
  standardHeaders:       true,
  legacyHeaders:         false,
  skipSuccessfulRequests: true,          // login bem-sucedido não conta
});

// ── API geral — proteção contra abuso / scraping ──────────────
// Aplicar em app.use('/api', apiLimiter) no server.js se necessário.
// 300 req/min é generoso para uso humano normal de um PDV,
// mas bloqueia scripts automatizados.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max:      300,
  message:  { erro: 'Muitas requisições. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: (req) => {
    // Não limita arquivos estáticos (já servidos antes do middleware)
    // Não limita o health check se você tiver um
    return req.path === '/api/health';
  },
});

module.exports = { loginLimiter, apiLimiter };
