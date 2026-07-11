const express = require('express');
const router  = express.Router();
const { temPermissao } = require('../middlewares/permission');
const turnoService = require('../services/caixaTurnoService');
const audit = require('../services/auditService');

// GET /api/caixa-turno/status — turno aberto agora (ou null)
router.get('/status', temPermissao('caixa'), async (req, res, next) => {
  try {
    const turno = await turnoService.turnoAberto();
    res.json({ aberto: !!turno, turno });
  } catch (e) { next(e); }
});

// POST /api/caixa-turno/abrir
router.post('/abrir', temPermissao('caixa'), async (req, res, next) => {
  try {
    const resultado = await turnoService.abrirTurno(req.body, req.usuario);
    await audit.log(req.usuario, 'abrir_caixa', 'caixa_turnos', resultado.id,
      null, resultado, req.ip);
    res.json(resultado);
  } catch (e) { next(e); }
});

// POST /api/caixa-turno/fechar
router.post('/fechar', temPermissao('caixa'), async (req, res, next) => {
  try {
    const resultado = await turnoService.fecharTurno(req.body, req.usuario);
    await audit.log(req.usuario, 'fechar_caixa', 'caixa_turnos', resultado.id,
      null, resultado, req.ip);
    res.json(resultado);
  } catch (e) { next(e); }
});

module.exports = router;
