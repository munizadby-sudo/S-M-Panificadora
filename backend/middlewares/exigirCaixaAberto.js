const turnoService = require('../services/caixaTurnoService');

// ─────────────────────────────────────────────────────────────
//  exigirCaixaAberto
//
//  Bloqueia POST /api/vendas se não houver turno de caixa aberto
//  para o período atual (manhã/tarde). Evita venda sem abertura
//  e força o fechamento do dia anterior antes de operar.
//
//  Uso: router.post('/', temPermissao('caixa'), exigirCaixaAberto, handler)
// ─────────────────────────────────────────────────────────────
async function exigirCaixaAberto(req, res, next) {
  try {
    const turno = await turnoService.turnoAberto();

    if (!turno) {
      const periodo = turnoService.periodoAtual();
      return res.status(403).json({
        erro: `Nenhum caixa aberto para o turno da ${periodo === 'manha' ? 'manhã' : 'tarde'}. Abra o caixa antes de registrar vendas.`,
        codigo: 'CAIXA_FECHADO'
      });
    }

    req.turnoCaixa = turno;
    next();
  } catch (e) { next(e); }
}

module.exports = { exigirCaixaAberto };
