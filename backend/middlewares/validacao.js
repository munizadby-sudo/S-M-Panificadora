/**
 * Middleware para normalizar permissões
 * Valida e processa permissões do usuário
 */
const normalizarPermissoes = (req, res, next) => {
  const usuario = req.usuario || req.user;

  if (!usuario) {
    return next();
  }

  if (usuario.permissoes) {
    if (typeof usuario.permissoes === 'string') {
      try {
        usuario.permissoes = JSON.parse(usuario.permissoes);
      } catch {
        usuario.permissoes = [];
      }
    }

    if (!Array.isArray(usuario.permissoes)) {
      usuario.permissoes = [];
    }
  } else {
    usuario.permissoes = [];
  }

  next();
};

module.exports = {
  normalizarPermissoes
};
