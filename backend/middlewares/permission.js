/**
 * Middleware de permissão — verifica se o usuário tem acesso ao módulo.
 * Admin sempre tem acesso total.
 *
 * Uso: router.get('/', temPermissao('fluxo'), handler)
 *
 * FIX: JSON.parse sem try/catch causava crash do servidor
 * se permissoes chegasse como string malformada no token.
 * Agora falha de forma segura (nega acesso, não derruba o processo).
 */
function temPermissao(modulo) {
  return (req, res, next) => {
    if (!req.usuario)
      return res.status(401).json({ erro: 'Não autenticado.' });

    // Admin tem acesso total — verificação rápida antes de qualquer parse
    if (req.usuario.role === 'admin')
      return next();

    // FIX: parse defensivo — versão anterior lançava SyntaxError
    // se permissoes fosse string corrompida, derrubando o servidor inteiro.
    let perms = [];
    try {
      perms = Array.isArray(req.usuario.permissoes)
        ? req.usuario.permissoes
        : JSON.parse(req.usuario.permissoes || '[]');
    } catch {
      // Token com permissoes inválidas = nega tudo, não deixa passar
      return res.status(403).json({ erro: 'Permissões inválidas no token. Faça login novamente.' });
    }

    if (!perms.includes(modulo)) {
      return res.status(403).json({
        erro: `Sem permissão para acessar o módulo '${modulo}'.`
      });
    }

    next();
  };
}

module.exports = { temPermissao };
