const db = require('../database/db');

// ─────────────────────────────────────────────────────────────
//  caixaTurnoService.js
//
//  Regras de negócio:
//  1. Só pode existir 1 turno ABERTO por período (manha/tarde) por dia
//  2. Vendas são bloqueadas se não houver turno aberto para o período atual
//  3. Ao fechar, o sistema calcula o "esperado" somando as vendas do
//     turno (por forma de pagamento) e compara com o "contado" informado
//     pelo operador. A diferença mostra sobra ou falta de caixa.
// ─────────────────────────────────────────────────────────────

function periodoAtual() {
  const hora = new Date().toLocaleTimeString('pt-BR', {
    timeZone: 'America/Recife', hour: '2-digit', hour12: false
  });
  return parseInt(hora) < 14 ? 'manha' : 'tarde';
}

function dataHoje() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Recife' });
}

/**
 * Retorna o turno aberto no momento (ou null se não houver).
 * Usado pelo middleware de bloqueio de vendas.
 */
async function turnoAberto() {
  const hoje    = dataHoje();
  const periodo = periodoAtual();

  const [[turno]] = await db.execute(
    `SELECT * FROM caixa_turnos
      WHERE data = ? AND periodo = ? AND status = 'aberto'
      LIMIT 1`,
    [hoje, periodo]
  );
  return turno || null;
}

/**
 * Abre um novo turno de caixa.
 * Bloqueia se já existir um turno aberto para o mesmo período/dia.
 */
async function abrirTurno(dados, usuario) {
  const { fundo_especie, fundo_moedas } = dados;
  const hoje    = dataHoje();
  const periodo = periodoAtual();

  const existente = await turnoAberto();
  if (existente) {
    throw Object.assign(
      new Error(`Já existe um caixa aberto para o turno da ${periodo === 'manha' ? 'manhã' : 'tarde'} de hoje.`),
      { status: 409 }
    );
  }

  const [r] = await db.execute(
    `INSERT INTO caixa_turnos
       (data, periodo, status, aberto_por, fundo_especie, fundo_moedas)
     VALUES (?, ?, 'aberto', ?, ?, ?)`,
    [hoje, periodo, usuario.id, fundo_especie ?? 0, fundo_moedas ?? 0]
  );

  return { id: r.insertId, data: hoje, periodo, status: 'aberto' };
}

/**
 * Fecha o turno aberto, calculando o esperado a partir das vendas
 * registradas no fluxo_caixa durante o turno, e comparando com o
 * valor contado fisicamente pelo operador.
 */
async function fecharTurno(dados, usuario) {
  const { contado_dinheiro, contado_pix, contado_cartao, contado_moedas, observacao } = dados;

  const turno = await turnoAberto();
  if (!turno) {
    throw Object.assign(
      new Error('Não há caixa aberto para fechar neste turno.'), { status: 400 }
    );
  }

  // ── Calcula o ESPERADO somando vendas do turno por forma de pagamento ──
  // Considera apenas vendas com status 'ativa' (cancelamentos já saem do fluxo)
  // dentro da janela de tempo do turno (aberto_em até agora).
  const [esperado] = await db.execute(
    `SELECT
        forma,
        COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) AS total
       FROM fluxo_caixa
      WHERE data = ?
        AND criado_em >= ?
        AND categoria IN ('vendas', 'estorno')
      GROUP BY forma`,
    [turno.data, turno.aberto_em]
  );

  const esperadoPorForma = { dinheiro: 0, pix: 0, cartao: 0 };
  esperado.forEach(e => {
    if (esperadoPorForma.hasOwnProperty(e.forma)) {
      esperadoPorForma[e.forma] = parseFloat(e.total);
    }
  });

  // Dinheiro esperado inclui o fundo de abertura (precisa estar na gaveta)
  const esperadoDinheiroComFundo =
    esperadoPorForma.dinheiro + parseFloat(turno.fundo_especie) + parseFloat(turno.fundo_moedas);

  const contDinheiro = parseFloat(contado_dinheiro ?? 0);
  const contPix      = parseFloat(contado_pix ?? 0);
  const contCartao   = parseFloat(contado_cartao ?? 0);
  const contMoedas   = parseFloat(contado_moedas ?? 0);

  const diferencaDinheiro = (contDinheiro + contMoedas) - esperadoDinheiroComFundo;
  const diferencaPix      = contPix    - esperadoPorForma.pix;
  const diferencaCartao   = contCartao - esperadoPorForma.cartao;
  const diferencaTotal    = diferencaDinheiro + diferencaPix + diferencaCartao;

  await db.execute(
    `UPDATE caixa_turnos SET
       status              = 'fechado',
       fechado_por         = ?,
       fechado_em          = NOW(),
       esperado_dinheiro   = ?,
       esperado_pix        = ?,
       esperado_cartao     = ?,
       contado_dinheiro    = ?,
       contado_pix         = ?,
       contado_cartao      = ?,
       contado_moedas      = ?,
       diferenca_dinheiro  = ?,
       diferenca_pix       = ?,
       diferenca_cartao    = ?,
       diferenca_total     = ?,
       observacao          = ?
     WHERE id = ?`,
    [
      usuario.id,
      esperadoDinheiroComFundo, esperadoPorForma.pix, esperadoPorForma.cartao,
      contDinheiro, contPix, contCartao, contMoedas,
      diferencaDinheiro, diferencaPix, diferencaCartao, diferencaTotal,
      observacao ?? null,
      turno.id
    ]
  );

  return {
    id: turno.id,
    periodo: turno.periodo,
    esperado: {
      dinheiro: esperadoDinheiroComFundo,
      pix: esperadoPorForma.pix,
      cartao: esperadoPorForma.cartao,
    },
    contado: {
      dinheiro: contDinheiro + contMoedas,
      pix: contPix,
      cartao: contCartao,
    },
    diferenca: {
      dinheiro: diferencaDinheiro,
      pix: diferencaPix,
      cartao: diferencaCartao,
      total: diferencaTotal,
    },
    status_resumo: diferencaTotal === 0 ? 'bateu certo' : (diferencaTotal > 0 ? 'sobra' : 'falta'),
  };
}

module.exports = { turnoAberto, abrirTurno, fecharTurno, periodoAtual, dataHoje };
