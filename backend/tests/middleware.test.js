const { normalizarPermissoes } = require('../middlewares/validacao');

describe('normalizarPermissoes', () => {
  test('deve normalizar permissões recebidas em req.usuario', () => {
    const req = { usuario: { permissoes: '["caixa","estoque"]' } };
    const res = {};
    const next = jest.fn();

    normalizarPermissoes(req, res, next);

    expect(req.usuario.permissoes).toEqual(['caixa', 'estoque']);
    expect(next).toHaveBeenCalled();
  });
});
