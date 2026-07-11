const db    = require('../database/db');
const audit = require('./auditService');

// ─────────────────────────────────────────────────────────────
//  Correções em relação à versão anterior:
//
//  1. dataLocalISO() removida — timezone agora é resolvido
//     pelo pool (timezone: '-03:00' no db.js). Usar new Date()
//     direto aqui criava dependência do timezone do SO.
//
//  2. cancelarVenda() → usa a data ORIGINAL da venda para
//     reverter o estoque, não a data atual. Se uma venda foi
//     feita ontem à noite e cancelada hoje de manhã, o estoque
//     que precisa ser revertido é o de ontem, não o de hoje.
//
//  3. cancelarVenda() → período usa hora da venda original,
//     não hora atual. Mesmo motivo: a venda foi feita no turno
//     da tarde de ontem; o cancelamento de hoje de manhã não
//     pode reverter o estoque do turno da manhã de hoje.
//
//  4. Validação de total no criarVenda() — impede que o
//     frontend envie total negativo ou zerado.
// ─────────────────────────────────────────────────────────────

/**
 * Retorna 'YYYY-MM-DD' no horário de Brasília.
 * Como o pool já usa timezone: '-03:00', o banco interpreta
 * corretamente — aqui só precisamos da string da data local.
 */
function dataHoje() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Recife' });
  // sv-SE usa formato YYYY-MM-DD nativamente, sem biblioteca.
}

/**
 * Extrai 'YYYY-MM-DD' de um objeto Date ou string ISO do banco.
 */
function dataDeTimestamp(ts) {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.toLocaleDateString('sv-SE', { timeZone: 'America/Recife' });
}



// ─────────────────────────────────────────────────────────────
/**
 * Cria uma venda completa dentro de uma transação única:
 * - Registra venda + itens
 * - Debita estoque (APENAS aqui, nunca no carrinho)
 * - Lança entrada automática no fluxo de caixa
 * - Incrementa sequência de pedido de forma atômica
 */
async function criarVenda(dados, usuario, ip) {
  const { subtotal, desconto, total, forma_pagamento, valor_recebido, troco, itens } = dados;

  if (!itens?.length)
    throw Object.assign(new Error('Carrinho vazio.'), { status: 400 });

  // Validação básica de total — evita venda com valor inválido
  if (!total || isNaN(total) || parseFloat(total) <= 0)
    throw Object.assign(new Error('Total da venda inválido.'), { status: 400 });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ── Número de pedido atômico (FOR UPDATE evita race condition) ──
    const [[seq]] = await conn.execute(
      "SELECT valor FROM sequencias WHERE chave = 'pedido' FOR UPDATE"
    );
    const numero = seq.valor;
    await conn.execute(
      "UPDATE sequencias SET valor = valor + 1 WHERE chave = 'pedido'"
    );

    // ── Registra venda ──
    const [r] = await conn.execute(
      `INSERT INTO vendas
         (numero, usuario_id, subtotal, desconto, total, forma_pagamento,
          valor_recebido, troco, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ativa')`,
      [numero, usuario.id, subtotal, desconto ?? 0, total,
       forma_pagamento, valor_recebido ?? total, troco ?? 0]
    );
    const vendaId = r.insertId;

    // ── Registra itens + debita estoque ──
    const hoje    = dataHoje();

    for (const item of itens) {
      const quantidade = parseInt(item.quantidade) || 0;
      if (quantidade <= 0)
        throw Object.assign(new Error('Quantidade inválida no carrinho.'), { status: 400 });

      if (!item.produto_id)
        throw Object.assign(
          new Error(`Produto sem vínculo de estoque: ${item.nome}.`), { status: 400 }
        );

      const [[estoque]] = await conn.execute(
        `SELECT inicial, produzido, vendido
           FROM estoque
          WHERE produto_id = ? AND data = ?
          FOR UPDATE`,
        [item.produto_id, hoje]
      );

      if (!estoque)
        throw Object.assign(
          new Error(`Estoque não lançado para ${item.nome} (${periodo} de ${hoje}).`),
          { status: 400 }
        );

      const disponivel =
        parseInt(estoque.inicial) + parseInt(estoque.produzido) - parseInt(estoque.vendido);

      if (disponivel < quantidade)
        throw Object.assign(
          new Error(`Estoque insuficiente para ${item.nome}. Disponível: ${disponivel}, solicitado: ${quantidade}.`),
          { status: 400 }
        );

      await conn.execute(
        `INSERT INTO venda_itens
           (venda_id, produto_id, nome, icone, preco_unit, quantidade, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [vendaId, item.produto_id, item.nome,
         item.icone ?? '', item.preco_unit, quantidade,
         item.preco_unit * quantidade]
      );

      await conn.execute(
        `UPDATE estoque SET vendido = vendido + ?
         WHERE produto_id = ? AND data = ?`,
        [quantidade, item.produto_id, hoje]
      );
    }

    // ── Lança entrada automática no fluxo de caixa ──
    await conn.execute(
      `INSERT INTO fluxo_caixa
         (usuario_id, tipo, descricao, categoria, forma, valor, data, gerado_auto)
       VALUES (?, 'entrada', ?, 'vendas', ?, ?, ?, 1)`,
      [usuario.id,
       `Venda #${String(numero).padStart(4, '0')}`,
       forma_pagamento, total, hoje]
    );

    await conn.commit();

    await audit.log(usuario, 'criar_venda', 'vendas', vendaId,
      null, { numero, total, forma_pagamento }, ip);

    return {
      id: vendaId,
      numero,
      data: hoje,
      forma_pagamento,
      subtotal,
      desconto: desconto ?? 0,
      total,
      valor_recebido: valor_recebido ?? total,
      troco: troco ?? 0,
      itens,
      operador: usuario?.nome || usuario?.username || 'Operador'
    };

  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────
/**
 * Cancela uma venda (soft delete):
 * - Muda status para 'cancelada'
 * - Cria estorno no fluxo de caixa
 * - Reverte estoque na DATA e PERÍODO ORIGINAIS da venda
 *
 * FIX: versão anterior usava data e período do momento do
 * cancelamento. Se a venda foi feita ontem no turno da tarde
 * e o cancelamento ocorre hoje de manhã, o estoque revertido
 * era o errado (hoje/manha em vez de ontem/tarde).
 */
async function cancelarVenda(vendaId, motivo, usuario, ip) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[venda]] = await conn.execute(
      'SELECT * FROM vendas WHERE id = ?', [vendaId]
    );
    if (!venda)
      throw Object.assign(new Error('Venda não encontrada.'), { status: 404 });
    if (venda.status === 'cancelada')
      throw Object.assign(new Error('Venda já está cancelada.'), { status: 400 });

    // ── Data e período ORIGINAIS da venda ──────────────────
    // Usando criado_em da venda, não a hora atual.
    const dataVenda   = dataDeTimestamp(venda.criado_em);

    // ── Soft delete na venda ──
    await conn.execute(
      `UPDATE vendas
         SET status = 'cancelada',
             cancelado_por  = ?,
             cancelado_em   = NOW(),
             motivo_cancel  = ?
       WHERE id = ?`,
      [usuario.id, motivo ?? 'Cancelamento manual', vendaId]
    );

    // ── Estorno no fluxo de caixa (lançado na data atual) ──
    const hoje = dataHoje();
    await conn.execute(
      `INSERT INTO fluxo_caixa
         (usuario_id, tipo, descricao, categoria, forma, valor, data, gerado_auto)
       VALUES (?, 'saida', ?, 'estorno', ?, ?, ?, 1)`,
      [usuario.id,
       `Estorno Venda #${String(venda.numero).padStart(4, '0')}`,
       venda.forma_pagamento, venda.total, hoje]
    );

    // ── Reverte estoque na data/período ORIGINAIS ──────────
    const [itens] = await conn.execute(
      'SELECT * FROM venda_itens WHERE venda_id = ?', [vendaId]
    );

    for (const item of itens) {
      if (item.produto_id) {
        await conn.execute(
          `UPDATE estoque
             SET vendido = GREATEST(0, vendido - ?)
           WHERE produto_id = ? AND data = ?`,
          [item.quantidade, item.produto_id, dataVenda]
        );
      }
    }

    await conn.commit();

    await audit.log(usuario, 'cancelar_venda', 'vendas', vendaId,
      { status: 'ativa' }, { status: 'cancelada', motivo }, ip);

    return { mensagem: 'Venda cancelada. Estoque e fluxo de caixa revertidos.' };

  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = { criarVenda, cancelarVenda };