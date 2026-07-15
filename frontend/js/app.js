// ============================================================
//  app.js — Orquestrador principal do PDV v2.0
//  CORREÇÕES APLICADAS:
//  - Estoque NÃO é debitado no carrinho, apenas ao finalizar venda
//  - Map() usado para lookups O(1) em vez de array.find() O(n)
//  - Re-render parcial do grid (apenas card afetado)
//  - Vendas canceladas via soft delete com motivo
// ============================================================

// ── Estado global ─────────────────────────────────────────────
let produtos      = [];
let prodMap       = new Map();   // id → produto (O(1) lookup)
let catMap        = new Map();   // nome → id
let cats          = [];
let vendas        = [];
let encomendas    = [];
let estoqueCache  = new Map();   // `${data}_${prodId}_${periodo}` → objeto
let fluxoCache    = [];

let carrinho      = {};          // prodId → { ...produto, quantidade }
let pgto          = 'dinheiro';
let catAtual      = 'Todos';

const TODOS_TABS = ['caixa','encomendas','estoque','fluxo','rel','produtos'];

function listaResposta(resp) {
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.data)) return resp.data;
  if (Array.isArray(resp?.rows)) return resp.rows;
  return [];
}

function obterConfigLoja() {
  try {
    return JSON.parse(sessionStorage.getItem('pdv_config') || '{}') || {};
  } catch {
    return {};
  }
}

function abrirCupomNaoFiscal(venda, itens, janela = null) {
  const cfg = obterConfigLoja();
  const nomeLoja = cfg.nome_loja || 'Padaria Dourada';
  const slogan = cfg.slogan || 'Sistema de Gestão PDV';
  const dataHora = new Date().toLocaleString('pt-BR');
  const totalItens = itens.reduce((s, item) => s + (parseInt(item.quantidade) || 0), 0);
  const desconto = parseFloat(venda.desconto || 0);
  const total = parseFloat(venda.total || 0);
  const subtotal = parseFloat(venda.subtotal || 0);
  const recebido = parseFloat(venda.valor_recebido || total);
  const troco = parseFloat(venda.troco || 0);

  const linhas = itens.map(item => `
    <tr>
      <td class="item-nome">${item.nome}</td>
      <td class="item-qtd">${item.quantidade}</td>
      <td class="item-preco">${fmtR(item.preco_unit)}</td>
      <td class="item-sub">${fmtR(item.preco_unit * item.quantidade)}</td>
    </tr>`).join('');

  const html = `
    <html>
    <head>
      <title>Cupom ${String(venda.numero).padStart(4, '0')}</title>
      <style>
        @page { margin: 6mm; }
        body {
          margin: 0;
          font-family: Consolas, 'Courier New', monospace;
          background: #fff;
          color: #111;
          font-size: 13px;
          line-height: 1.45;
        }
        .cupom {
          width: 72mm;
          margin: 0 auto;
          padding: 4mm 0;
        }
        .center { text-align: center; }
        .bold { font-weight: 700; }
        .nome-loja { font-size: 17px; letter-spacing: 0.3px; }
        .small { font-size: 13px; }
        .micro { font-size: 12px; }
        .line { border-top: 1px dashed #111; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 3px 0; vertical-align: top; }
        .item-qtd, .item-preco, .item-sub { text-align: right; white-space: nowrap; }
        .item-nome { width: 46%; }
        .item-qtd { width: 10%; }
        .item-preco { width: 20%; }
        .item-sub { width: 24%; }
        .totais td { padding: 3px 0; font-size: 13px; }
        .totais .bold { font-size: 14px; }
        .right { text-align: right; }
        .muted { color: #333; }
      </style>
    </head>
    <body>
      <div class="cupom">
        <div class="center bold nome-loja">${nomeLoja}</div>
        <div class="center micro">${slogan}</div>
        <div class="center micro">CUPOM NÃO FISCAL</div>
        <div class="line"></div>
        <div class="small">Pedido Nº ${String(venda.numero).padStart(4, '0')}</div>
        <div class="small">Data: ${dataHora}</div>
        <div class="small">Operador: ${venda.operador || operador?.nome || '-'}</div>
        <div class="line"></div>
        <table>
          <thead>
            <tr>
              <th class="item-nome">Produto</th>
              <th class="item-qtd">Qtd</th>
              <th class="item-preco">Vr. Unt.</th>
              <th class="item-sub">Sub.</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
        <div class="line"></div>
        <table class="totais">
          <tr><td>Subtotal</td><td class="right">${fmtR(subtotal)}</td></tr>
          ${desconto > 0 ? `<tr><td>Desconto</td><td class="right">-${fmtR(desconto)}</td></tr>` : ''}
          <tr><td class="bold">Total do pedido</td><td class="right bold">${fmtR(total)}</td></tr>
          <tr><td>Forma de pagamento</td><td class="right">${(venda.forma_pagamento || '').toUpperCase()}</td></tr>
          ${venda.forma_pagamento === 'dinheiro' ? `<tr><td>Recebido</td><td class="right">${fmtR(recebido)}</td></tr><tr><td>Troco</td><td class="right">${fmtR(troco)}</td></tr>` : ''}
          <tr><td>Total de itens</td><td class="right">${totalItens}</td></tr>
        </table>
        <div class="line"></div>
        <div class="center micro muted">Este ticket não é documento fiscal</div>
        <div class="center micro muted">Obrigado pela preferência</div>
      </div>
      <script>
        window.onload = function() {
          window.focus();
          window.print();
          setTimeout(function() { window.close(); }, 250);
        };
      </script>
    </body>
    </html>`;

  const popup = janela || window.open('', '_blank', 'width=420,height=700');
  if (!popup) {
    showToast('Permita pop-ups para imprimir o cupom.', 'err');
    return;
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

// ── Boot ─────────────────────────────────────────────────────
async function inicializar() {
  const ok = await boot();
  if (!ok) return;

  aplicarPermissoes();
  await carregarConfig();
  await carregarDados();

  document.getElementById('operador-info').textContent = '👤 ' + operador.nome;
  if (temPermissao('rel')) setRelHoje();

  const hj = hoje();
  const elFluxoData = document.getElementById('fluxo-data-filtro');
  if (elFluxoData) elFluxoData.value = hj;

  relogio();
  setInterval(relogio, 30000);
   verificarCaixaAberto();
}

// ── Config ────────────────────────────────────────────────────
async function carregarConfig() {
  try {
    const cfg = await API.getConfig();
    sessionStorage.setItem('pdv_config', JSON.stringify(cfg));
    if (cfg.nome_loja) {
      document.getElementById('topbar-nome').textContent = cfg.nome_loja;
      document.title = cfg.nome_loja;
    }
    if (cfg.slogan) document.getElementById('topbar-slogan').textContent = cfg.slogan;
    aplicarLogo(cfg.logo_path);
  } catch { /* silencioso, usa defaults */ }
}

function aplicarLogo(logoPath) {
  const img   = document.getElementById('topbar-logo-img');
  const emoji = document.getElementById('topbar-logo-emoji');
  if (!img || !emoji) return;
  if (logoPath) {
    img.src            = API_BASE + logoPath;
    img.style.display  = 'block';
    emoji.style.display = 'none';
  } else {
    img.style.display  = 'none';
    emoji.style.display = 'inline';
  }
}

// ── Dados ─────────────────────────────────────────────────────
async function carregarDados() {
  try {
    const [produtosRaw, catsRaw] = await Promise.all([
      API.getProdutos(),
      API.getCats()
    ]);

    produtos = listaResposta(produtosRaw);
    // Indexa em Map para O(1)
    prodMap = new Map(produtos.map(p => [p.id, p]));

    const catsLista = listaResposta(catsRaw);
    cats = catsLista.map(c => c.nome);
    catMap = new Map(catsLista.map(c => [c.nome, c.id]));

    // Busca o estoque real ANTES do primeiro render — sem isso os cards
    // ficam sem número de estoque até a primeira venda ser feita.
    await carregarEstoqueBackground();

    renderCats();
    renderGrid();
    renderItens();
    renderRodape();
    renderCatSelects();
  } catch (e) {
    showToast('Erro ao carregar dados: ' + e.message, 'err');
  }
}

// ── Permissões ────────────────────────────────────────────────
function aplicarPermissoes() {
  const permissoes = Array.isArray(operador?.permissoes) ? operador.permissoes : [];

  TODOS_TABS.forEach(tab => {
    const btn = document.querySelector(`.tab-nav [data-tab="${tab}"]`);
    if (btn) btn.style.display = temPermissao(tab) || tab === 'caixa' ? '' : 'none';
  });
  const btnAdmin  = document.querySelector('.tab-nav [data-tab="admin"]');
  const btnConfig = document.querySelector('.tab-nav [data-tab="config"]');
  if (btnAdmin)  btnAdmin.style.display  = operador.role === 'admin' ? '' : 'none';
  if (btnConfig) btnConfig.style.display = operador.role === 'admin' ? '' : 'none';

  const primeira = operador.role === 'admin'
    ? 'caixa'
    : (permissoes[0] || 'caixa');
  showTab(primeira);
}

// ── Tabs ──────────────────────────────────────────────────────
const ALL_TABS = ['caixa','encomendas','estoque','fluxo','rel','produtos','admin','config'];

function showTab(tab) {
  ALL_TABS.forEach(t => {
    document.getElementById('tela-' + t)?.classList.toggle('active', t === tab);
    document.querySelector(`.tab-nav [data-tab="${t}"]`)?.classList.toggle('active', t === tab);
  });
  if (tab === 'rel')        renderRel();
  if (tab === 'produtos')   { renderCatSelects(); renderTabProd(); }
  if (tab === 'encomendas') carregarEncomendas();
  if (tab === 'estoque')    carregarEstoque();
  if (tab === 'fluxo')      carregarFluxo();
  if (tab === 'admin')      carregarUsuarios();
  if (tab === 'config')     carregarConfigAdmin();
   if (tab === 'caixa')      verificarCaixaAberto();
}

// ═══════════════════════════════════════════════════════════════
//  CAIXA
// ═══════════════════════════════════════════════════════════════
let produtosFiltradosAtual = [];   // lista exibida no grid após filtro de categoria/busca
let gridSelecionado        = 0;    // índice do produto "em destaque" para navegação por teclado

function renderCats() {
  document.getElementById('cats').innerHTML = ['Todos', ...cats].map(c =>
    `<button class="cat-tab${c === catAtual ? ' active' : ''}" onclick="setCat('${c}')">${c}</button>`
  ).join('');
}

function setCat(c) { catAtual = c; gridSelecionado = 0; renderCats(); renderGrid(); }

/** Chamada pelo input de busca: reseta a seleção do grid a cada digitação. */
function aoDigitarBusca() { gridSelecionado = 0; renderGrid(); }

function renderGrid() {
  const el    = document.getElementById('grid');
  const busca = document.getElementById('busca').value.toLowerCase();
  let pr = [...produtos];
  if (catAtual !== 'Todos') pr = pr.filter(p => p.categoria === catAtual);
  if (busca) pr = pr.filter(p => p.nome.toLowerCase().includes(busca) || (p.categoria || '').toLowerCase().includes(busca));

  produtosFiltradosAtual = pr;
  if (gridSelecionado >= pr.length) gridSelecionado = pr.length - 1;
  if (gridSelecionado < 0) gridSelecionado = 0;

  if (!pr.length) { el.innerHTML = '<p class="prod-sem">Nenhum produto.</p>'; return; }

  el.innerHTML = pr.map((p, idx) => {
    const key  = `${hoje()}_${p.id}`;
    const est  = estoqueCache.get(key);
    const atual = est ? (est.inicial + est.produzido - est.vendido) : -1;
    const baixo  = atual >= 0 && atual <= (est?.minimo ?? 5);
    const semEst = atual === 0;
    const sel    = idx === gridSelecionado;

    return `<button class="prod-btn${semEst ? ' sem-estoque' : ''}${sel ? ' teclado-sel' : ''}"
              id="prod-card-${p.id}"
              onclick="gridSelecionado=${idx};addItem(${p.id})">
      <span class="prod-icon">${p.icone || '🛒'}</span>
      <span class="prod-nome">${p.nome}</span>
      <span class="prod-preco">${fmtR(p.preco)}</span>
      ${atual >= 0
        ? `<span class="prod-estq" style="color:${semEst ? '#e87a7a' : baixo ? 'var(--gold2)' : 'var(--green2)'};">
             ${semEst ? 'Sem estq' : baixo ? 'Baixo:' + atual : 'Est:' + atual}
           </span>`
        : ''}
    </button>`;
  }).join('');
}

/** Move o destaque do grid (navegação por teclado) e rola até ele ficar visível. */
function moverSelecaoGrid(delta) {
  if (!produtosFiltradosAtual.length) return;
  gridSelecionado = (gridSelecionado + delta + produtosFiltradosAtual.length) % produtosFiltradosAtual.length;
  renderGrid();
  const ativo = produtosFiltradosAtual[gridSelecionado];
  document.getElementById('prod-card-' + ativo.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/** Adiciona o produto atualmente destacado no grid (via Enter). */
function adicionarSelecaoGrid() {
  const ativo = produtosFiltradosAtual[gridSelecionado];
  if (ativo) addItem(ativo.id);
}

/** Atualiza apenas o card de um produto específico, sem re-render total */
function atualizarCardProduto(id) {
  const p    = prodMap.get(id);
  const card = document.getElementById('prod-card-' + id);
  if (!p || !card) return;

  const key  = `${hoje()}_${id}`;
  const est  = estoqueCache.get(key);
  const atual = est ? (est.inicial + est.produzido - est.vendido) : -1;
  const baixo  = atual >= 0 && atual <= (est?.minimo ?? 5);
  const semEst = atual === 0;

  card.className = 'prod-btn' + (semEst ? ' sem-estoque' : '');
  const estqEl = card.querySelector('.prod-estq');
  if (estqEl) {
    estqEl.style.color = semEst ? '#e87a7a' : baixo ? 'var(--gold2)' : 'var(--green2)';
    estqEl.textContent = semEst ? 'Sem estq' : baixo ? 'Baixo:' + atual : 'Est:' + atual;
  }
}

/**
 * CORREÇÃO CRÍTICA: addItem NÃO debita estoque.
 * O estoque só é debitado no backend ao finalizar a venda.
 */
function addItem(id) {
  const pr = prodMap.get(id);
  if (!pr) return;

  if (!carrinho[id]) carrinho[id] = { ...pr, quantidade: 0 };
  carrinho[id].quantidade++;

  renderItens();
  renderRodape();
  showToast('+' + (pr.icone || '') + ' ' + pr.nome);
}

function renderItens() {
  const keys = Object.keys(carrinho);
  const badge = document.getElementById('badge');
  if (badge) badge.textContent = keys.reduce((s, k) => s + carrinho[k].quantidade, 0);

  document.getElementById('itens').innerHTML = !keys.length
    ? '<p class="vazio">Nenhum item.<br>Selecione ao lado.</p>'
    : keys.map(k => {
        const it = carrinho[k];
        return `<div class="item-venda">
          <span style="font-size:15px;">${it.icone || '🛒'}</span>
          <span class="nome">${it.nome}</span>
          <div class="qtd-ctrl">
            <button class="qtd-btn" onclick="adj(${k}, -1)">−</button>
            <span class="item-qtd">${it.quantidade}</span>
            <button class="qtd-btn" onclick="adj(${k}, 1)">+</button>
          </div>
          <span class="item-preco">${fmtR(it.preco * it.quantidade)}</span>
          <button class="del-btn" onclick="delItem(${k})">✕</button>
        </div>`;
      }).join('');
}

function adj(k, d) {
  if (!carrinho[k]) return;
  carrinho[k].quantidade += d;
  if (carrinho[k].quantidade <= 0) delete carrinho[k];
  renderItens();
  renderRodape();
}

function delItem(k) {
  delete carrinho[k];
  renderItens();
  renderRodape();
}

function limpar() {
  carrinho = {};
  renderItens();
  renderRodape();
}

function setPgto(p) {
  pgto = p;
  ['dinheiro', 'cartao', 'credito', 'pix'].forEach(x => {
    document.getElementById('btn-' + x)?.classList.toggle('sel', x === p);
  });
  renderRodape();
}

let totalAtualCaixa = 0; // guarda o TOTAL calculado por último, para o troco poder ser atualizado sem re-renderizar tudo

function renderRodape() {
  const keys = Object.keys(carrinho);
  const sub  = keys.reduce((s, k) => s + carrinho[k].preco * carrinho[k].quantidade, 0);
  const total = sub;
  totalAtualCaixa = total;

  const recEl = document.getElementById('recebido-val');
  const rec   = recEl ? parseFloat(recEl.value) || 0 : 0;
  const troco = pgto === 'dinheiro' ? Math.max(0, rec - total) : 0;
  const ehDinheiro = pgto === 'dinheiro';

  document.getElementById('totais').innerHTML = `
    <div class="tot-total"><span class="l">TOTAL</span><span class="v">${fmtR(total)}</span></div>
    <div class="recebido-row" style="margin-top:6px;${ehDinheiro ? '' : 'opacity:0.35;'}">
      <label>Recebido R$</label>
      <input class="inp-small" type="number" id="recebido-val" min="0" step="0.01"
             value="${rec || ''}" oninput="atualizarTroco()" style="width:72px;"
             ${ehDinheiro ? '' : 'disabled tabindex="-1"'}>
    </div>
    <div class="troco-info" id="troco-info" style="${ehDinheiro && rec > 0 ? '' : 'visibility:hidden;'}">Troco: ${fmtR(troco)}</div>`;
}

/**
 * Atualiza SÓ o texto do troco, sem tocar no <input> "Recebido".
 * Chamada pelo oninput do próprio campo — assim o campo nunca é destruído
 * enquanto você digita, e o cursor/foco nunca se perdem.
 */
function atualizarTroco() {
  const recEl   = document.getElementById('recebido-val');
  const trocoEl = document.getElementById('troco-info');
  if (!recEl || !trocoEl) return;
  const rec   = parseFloat(recEl.value) || 0;
  const troco = pgto === 'dinheiro' ? Math.max(0, rec - totalAtualCaixa) : 0;
  if (rec > 0 && pgto === 'dinheiro') {
    trocoEl.style.visibility = 'visible';
    trocoEl.textContent = 'Troco: ' + fmtR(troco);
  } else {
    trocoEl.style.visibility = 'hidden';
  }
}

async function cobrar() {
  const keys = Object.keys(carrinho);
  if (!keys.length) { showToast('Carrinho vazio!', 'err'); return; }

  if (!(await caixaEstaAberto())) {
    showToast('❌ Caixa fechado. Abra o caixa antes de cobrar.', 'err');
    return;
  }

  const janelaCupom = window.open('', '_blank', 'width=420,height=700');
  if (!janelaCupom) {
    showToast('Permita pop-ups para imprimir o cupom.', 'err');
    return;
  }
  janelaCupom.document.write('<p style="font-family:Arial,sans-serif;padding:18px;">Gerando cupom...</p>');

  const itens = keys.map(k => ({
    produto_id: carrinho[k].id,
    nome:       carrinho[k].nome,
    icone:      carrinho[k].icone,
    preco_unit: carrinho[k].preco,
    quantidade: carrinho[k].quantidade
  }));

  const sub   = keys.reduce((s, k) => s + carrinho[k].preco * carrinho[k].quantidade, 0);
  const desc  = 0;
  const total = sub;
  const recEl = document.getElementById('recebido-val');
  const rec   = pgto === 'dinheiro' ? (recEl ? parseFloat(recEl.value) || 0 : total) : total;
  const troco = pgto === 'dinheiro' ? Math.max(0, rec - total) : 0;

  const btn = document.querySelector('.btn-cobrar');
  if (btn) { btn.disabled = true; btn.textContent = 'Registrando...'; }

  try {
    const r = await API.addVenda({
      subtotal: sub, desconto: desc, total,
      forma_pagamento: pgto,
      valor_recebido: rec, troco, itens
    });

    carrinho = {};

    renderItens();
    renderRodape();

    abrirCupomNaoFiscal({
      ...r,
      forma_pagamento: pgto,
      subtotal: sub,
      desconto: desc,
      total,
      valor_recebido: rec,
      troco
    }, itens, janelaCupom);

    // Recarrega estoque real do servidor após venda (único lugar que reflete a dedução)
    await carregarEstoqueBackground();
    renderGrid();

    showToast(`✅ Venda #${String(r.numero).padStart(4, '0')} registrada!`);
  } catch (e) {
    try { janelaCupom.close(); } catch {}
    showToast('Erro: ' + e.message, 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'COBRAR▶ registrar venda'; }
  }
}

// Recarrega estoque em background sem bloquear UI
async function carregarEstoqueBackground() {
  try {
    const data = hoje();
    const rows = listaResposta(await API.getEstoque(data, periodoEst));
    rows.forEach(r => {
      const dataNormalizada = dataISO(r.data || data);
      const item = {
        ...r,
        produto_id: r.produto_id,
        data: dataNormalizada,
        periodo: r.periodo || periodoEst,
        inicial: parseInt(r.inicial) || 0,
        produzido: parseInt(r.produzido) || 0,
        vendido: parseInt(r.vendido) || 0,
        minimo: parseInt(r.minimo) || 5
      };
      estoqueCache.set(`${item.data}_${item.produto_id}`, item);
    });
  } catch { /* silencioso */ }
}

// ═══════════════════════════════════════════════════════════════
//  RELATÓRIO
// ═══════════════════════════════════════════════════════════════
function setRelHoje() {
  if (!temPermissao('rel')) return;
  const hj = hoje();
  const ini = document.getElementById('rel-data-ini');
  const fim = document.getElementById('rel-data-fim');
  if (ini) ini.value = hj;
  if (fim) fim.value = hj;
  renderRel();
}

async function renderRel() {
  if (!temPermissao('rel')) return;
  const ini = document.getElementById('rel-data-ini')?.value;
  const fim = document.getElementById('rel-data-fim')?.value;
  if (!ini || !fim) return;
  try {
    vendas = await API.getVendas(ini, fim);
    _drawRel();
  } catch (e) { showToast('Erro ao carregar vendas: ' + e.message, 'err'); }
}

function _drawRel() {
  // Apenas vendas ativas nos KPIs
  const ativas    = vendas.filter(v => v.status !== 'cancelada');
  const total     = ativas.reduce((s, v) => s + parseFloat(v.total), 0);
  const totalDesc = ativas.reduce((s, v) => s + parseFloat(v.desconto || 0), 0);
  const nItens    = ativas.reduce((s, v) => s + (v.itens || []).reduce((a, i) => a + i.quantidade, 0), 0);
  const tMedia    = ativas.length ? total / ativas.length : 0;

  document.getElementById('rel-kpis').innerHTML = `
    <div class="kpi-card verde"><div class="kpi-icon">💰</div><div class="kpi-label">Receita Total</div>
      <div class="kpi-value">${fmtR(total)}</div><div class="kpi-sub">${ativas.length} vendas</div></div>
    <div class="kpi-card ouro"><div class="kpi-icon">🛒</div><div class="kpi-label">Itens Vendidos</div>
      <div class="kpi-value">${nItens}</div><div class="kpi-sub">no período</div></div>
    <div class="kpi-card azul"><div class="kpi-icon">📊</div><div class="kpi-label">Ticket Médio</div>
      <div class="kpi-value">${fmtR(tMedia)}</div><div class="kpi-sub">por venda</div></div>
    <div class="kpi-card roxo"><div class="kpi-icon">🏷</div><div class="kpi-label">Descontos</div>
      <div class="kpi-value">${fmtR(totalDesc)}</div><div class="kpi-sub">total</div></div>`;

  // Por forma de pagamento
  const pgtos = {};
  ativas.forEach(v => {
    pgtos[v.forma_pagamento] = (pgtos[v.forma_pagamento] || 0) + parseFloat(v.total);
  });
  const pgtoLabels = { dinheiro: '💵 Dinheiro', cartao: '💳 Débito', credito: '💳 Crédito', pix: '📱 Pix' };
  const maxP = Math.max(...Object.values(pgtos), 1);
  document.getElementById('pgto-bars').innerHTML = Object.entries(pgtos).map(([k, v]) => `
    <div class="pgto-bar-row">
      <span class="pgto-bar-label">${pgtoLabels[k] || k}</span>
      <div class="pgto-bar-track"><div class="pgto-bar-fill" style="width:${(v / maxP * 100).toFixed(1)}%;background:var(--gold);"></div></div>
      <span class="pgto-bar-val">${fmtR(v)}</span>
    </div>`).join('') || '<p style="font-size:12px;color:var(--muted);">Sem dados.</p>';

  // Por hora
  const horas = {};
  ativas.forEach(v => {
    const h = new Date(v.criado_em).getHours();
    horas[h] = (horas[h] || 0) + parseFloat(v.total);
  });
  const maxH = Math.max(...Object.values(horas), 1);
  document.getElementById('hourly-chart').innerHTML = Array.from({ length: 14 }, (_, i) => i + 6).map(h => `
    <div class="hourly-bar">
      <div class="hourly-bar-fill" style="height:${((horas[h] || 0) / maxH * 70).toFixed(1)}px;"></div>
      <span class="hourly-bar-label">${h}h</span>
    </div>`).join('');

  // Top produtos (usando Map para agrupar)
  const contagemMap = new Map();
  ativas.forEach(v => (v.itens || []).forEach(i => {
    if (!contagemMap.has(i.nome)) contagemMap.set(i.nome, { qtd: 0, total: 0, icone: i.icone || '🛒' });
    const d = contagemMap.get(i.nome);
    d.qtd   += parseInt(i.quantidade);
    d.total += parseFloat(i.subtotal || i.preco_unit * i.quantidade);
  }));
  const top = [...contagemMap.entries()].sort((a, b) => b[1].qtd - a[1].qtd).slice(0, 5);
  document.getElementById('top-prods').innerHTML = top.map(([nome, d], i) => `
    <div class="top-prod-row">
      <span class="top-prod-rank">${i + 1}</span>
      <span class="top-prod-icon">${d.icone}</span>
      <span class="top-prod-name">${nome}</span>
      <span class="top-prod-qtd">${d.qtd}x</span>
      <span class="top-prod-val">${fmtR(d.total)}</span>
    </div>`).join('') || '<p style="font-size:12px;color:var(--muted);">Sem dados.</p>';

  // Tabela detalhada
  const tbody = document.getElementById('rel-body');
  const vazio = document.getElementById('rel-vazio');
  if (vazio) vazio.style.display = vendas.length ? 'none' : 'block';
  tbody.innerHTML = vendas.map((v, i) => `<tr class="${v.status === 'cancelada' ? 'venda-cancelada' : ''}">
    <td>${i + 1}</td>
    <td style="white-space:nowrap;">${new Date(v.criado_em).toLocaleString('pt-BR')}</td>
    <td>${v.operador_nome || '-'}</td>
    <td>${(v.itens || []).length} itens</td>
    <td style="color:#e87a7a;">${parseFloat(v.desconto || 0) > 0 ? '-' + fmtR(v.desconto) : '-'}</td>
    <td style="color:${v.status === 'cancelada' ? '#e87a7a' : 'var(--gold2)'};font-weight:600;">
      ${v.status === 'cancelada' ? '❌ ' : ''}${fmtR(parseFloat(v.total))}
    </td>
    <td><span class="badge-pgto ${v.forma_pagamento}">${v.forma_pagamento}</span></td>
    <td>${operador.role === 'admin' && v.status !== 'cancelada'
      ? `<button class="btn-icon" onclick="cancelarVenda(${v.id})">🗑</button>` : ''}</td>
  </tr>`).join('');
}

async function cancelarVenda(id) {
  const motivo = prompt('Motivo do cancelamento (obrigatório):');
  if (!motivo?.trim()) { showToast('Informe o motivo.', 'err'); return; }
  try {
    await API.cancelarVenda(id, motivo);
    renderRel();
    showToast('Venda cancelada. Estoque e caixa revertidos.');
  } catch (e) { showToast(e.message, 'err'); }
}

function exportarCSV() {
  const rows = [
    ['#', 'Data', 'Operador', 'Total', 'Pgto', 'Status'],
    ...vendas.map((v, i) => [
      i + 1,
      new Date(v.criado_em).toLocaleString('pt-BR'),
      v.operador_nome,
      v.total,
      v.forma_pagamento,
      v.status
    ])
  ];
  baixarCSV('vendas.csv', rows);
}

// ═══════════════════════════════════════════════════════════════
//  ESTOQUE
// ═══════════════════════════════════════════════════════════════
async function carregarEstoque() {
  try {
    const data = hoje();
    const rows = listaResposta(await API.getEstoque(data));
    estoqueCache = new Map();
    rows.forEach(r => {
      const dataNormalizada = dataISO(r.data || data);
      const item = {
        ...r,
        produto_id: r.produto_id,
        data: dataNormalizada,
        inicial: parseInt(r.inicial) || 0,
        produzido: parseInt(r.produzido) || 0,
        vendido: parseInt(r.vendido) || 0,
        minimo: parseInt(r.minimo) || 5
      };
      estoqueCache.set(`${item.data}_${item.produto_id}`, item);
    });
    renderEstoque();
  } catch (e) { showToast('Erro estoque: ' + e.message, 'err'); }
}

function renderEstoque() {
  const busca = (document.getElementById('busca-est')?.value || '').toLowerCase();
  let pr = [...produtos];
  if (busca) pr = pr.filter(p => p.nome.toLowerCase().includes(busca));

  const d = hoje();
  let totalEst = 0, baixos = 0, zerados = 0, produzidoTotal = 0;

  document.getElementById('est-body').innerHTML = pr.map(p => {
    const key = `${d}_${p.id}`;
    const e   = estoqueCache.get(key) || { inicial: 0, produzido: 0, vendido: 0, minimo: 5 };
    const atual = e.inicial + e.produzido - e.vendido;
    totalEst += atual;
    if (atual <= e.minimo && atual > 0) baixos++;
    if (atual === 0) zerados++;
    produzidoTotal += e.produzido;
    const ativo = p.ativo !== 0;

    const status = atual === 0
      ? '<span style="color:#e87a7a;font-weight:600;">ZERADO</span>'
      : atual <= e.minimo
        ? '<span style="color:var(--gold2);">⚠ Baixo</span>'
        : '<span style="color:var(--green2);">✓ OK</span>';

    return `<tr>
      <td style="font-size:20px;">${p.icone || '🛒'}</td>
      <td>${p.nome}${ativo ? '' : ' <span style="font-size:10px;color:var(--muted);">(inativo)</span>'}</td>
      <td><span class="cat-badge">${p.categoria || '-'}</span></td>
      <td><input class="est-inp" type="number" min="0" value="${e.inicial}"
          onchange="updEst(${p.id},'inicial',this.value)"></td>
      <td><input class="est-inp" type="number" min="0" value="${e.produzido}"
          onchange="updEst(${p.id},'produzido',this.value)"></td>
      <td style="color:var(--muted);">${e.vendido}</td>
      <td style="font-weight:600;color:${atual <= 0 ? '#e87a7a' : atual <= e.minimo ? 'var(--gold2)' : 'var(--green2)'};">${atual}</td>
      <td><input class="est-inp" type="number" min="0" value="${e.minimo}"
          onchange="updEst(${p.id},'minimo',this.value)"></td>
      <td>${status}</td>
    </tr>`;
  }).join('');

  document.getElementById('est-kpis').innerHTML = `
    <div class="est-kpi"><span class="lbl">Total em Estoque</span><span class="val">${totalEst}</span><span class="sub">unidades</span></div>
    <div class="est-kpi"><span class="lbl">Produzido Hoje</span><span class="val">${produzidoTotal}</span><span class="sub">unidades</span></div>
    <div class="est-kpi"><span class="lbl">Abaixo do Mínimo</span><span class="val" style="color:var(--gold2);">${baixos}</span><span class="sub">produtos</span></div>
    <div class="est-kpi"><span class="lbl">Zerados</span><span class="val" style="color:#e87a7a;">${zerados}</span><span class="sub">produtos</span></div>`;
}

function updEst(prodId, campo, valor) {
  const key = `${dataISO(hoje())}_${prodId}`;
  if (!estoqueCache.has(key)) {
    estoqueCache.set(key, {
      produto_id: prodId, data: dataISO(hoje()),
      inicial: 0, produzido: 0, vendido: 0, minimo: 5
    });
  }
  estoqueCache.get(key)[campo] = parseInt(valor) || 0;
}

async function salvarEstoque() {
  try {
    const itens = [...estoqueCache.values()]
      .map(item => ({
        ...item,
        produto_id: item.produto_id ?? item.id,
        data: dataISO(item.data || hoje()),
        periodo: 'unico',
        inicial: parseInt(item.inicial) || 0,
        produzido: parseInt(item.produzido) || 0,
        vendido: parseInt(item.vendido) || 0,
        minimo: parseInt(item.minimo) || 5
      }))
      .filter(item => item.produto_id && item.data);
    if (!itens.length) return showToast('Nada para salvar.', 'err');
    await API.saveEstoqueLote(itens);
    showToast('Estoque salvo!');
    renderGrid();
  } catch (e) { showToast('Erro: ' + e.message, 'err'); }
}

function zerarEstoquePeriodo() {
  if (!confirm('Zerar todos os valores do período?')) return;
  const d = dataISO(hoje());
  produtos.forEach(p => {
    estoqueCache.set(`${d}_${p.id}`, {
      produto_id: p.id, data: d,
      inicial: 0, produzido: 0, vendido: 0, minimo: 5
    });
  });
  renderEstoque();
}

// ═══════════════════════════════════════════════════════════════
//  FLUXO DE CAIXA
// ═══════════════════════════════════════════════════════════════
let tipoFluxo = 'entrada';

function setTipoFluxo(t) {
  tipoFluxo = t;
  document.getElementById('tipo-entrada').className = 'tipo-btn' + (t === 'entrada' ? ' ativo-entrada' : '');
  document.getElementById('tipo-saida').className   = 'tipo-btn' + (t === 'saida' ? ' ativo-saida' : '');
  document.getElementById('btn-lancar').className   = 'btn-lancar ' + (t === 'entrada' ? 'entrada' : 'saida');
}

async function carregarFluxo() {
  const dt = document.getElementById('fluxo-data-filtro')?.value || hoje();
  try {
    fluxoCache = listaResposta(await API.getFluxo(dt));
    renderFluxo();
  } catch (e) { showToast('Erro fluxo: ' + e.message, 'err'); }
}

function renderFluxo() {
  const lista = Array.isArray(fluxoCache) ? fluxoCache : [];
  const entradas = lista.filter(f => f.tipo === 'entrada').reduce((s, f) => s + parseFloat(f.valor || 0), 0);
  const saidas   = lista.filter(f => f.tipo === 'saida').reduce((s, f) => s + parseFloat(f.valor || 0), 0);
  const saldo    = entradas - saidas;

  document.getElementById('fluxo-kpis').innerHTML = `
    <div class="est-kpi"><span class="lbl">Entradas</span><span class="val" style="color:var(--green2);">${fmtR(entradas)}</span></div>
    <div class="est-kpi"><span class="lbl">Saídas</span><span class="val" style="color:#e87a7a;">${fmtR(saidas)}</span></div>
    <div class="est-kpi"><span class="lbl">Saldo do Dia</span><span class="val" style="color:${saldo >= 0 ? 'var(--green2)' : '#e87a7a'};">${fmtR(saldo)}</span></div>`;

  const vazio = document.getElementById('fluxo-vazio');
  if (vazio) vazio.style.display = lista.length ? 'none' : 'block';

  const body = document.getElementById('fluxo-body');
  if (!body) return;
  body.innerHTML = lista.map(f => `<tr>
    <td>${new Date(f.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
    <td><span style="color:${f.tipo === 'entrada' ? 'var(--green2)' : '#e87a7a'};font-weight:600;">
      ${f.tipo === 'entrada' ? '⬆ Entrada' : '⬇ Saída'}</span></td>
    <td>${f.descricao}${f.gerado_auto ? ' <span style="font-size:10px;color:var(--muted);">[auto]</span>' : ''}</td>
    <td>${f.categoria || '-'}</td>
    <td>${f.forma || '-'}</td>
    <td style="color:${f.tipo === 'entrada' ? 'var(--green2)' : '#e87a7a'};font-weight:600;">
      ${f.tipo === 'saida' ? '-' : ''}${fmtR(parseFloat(f.valor || 0))}</td>
    <td>${!f.gerado_auto ? `<button class="btn-icon" onclick="delFluxo(${f.id})">🗑</button>` : ''}</td>
  </tr>`).join('');
}

async function lancarFluxo() {
  const desc  = document.getElementById('fluxo-desc')?.value.trim();
  const cat   = document.getElementById('fluxo-cat')?.value;
  const forma = document.getElementById('fluxo-forma')?.value;
  const val   = parseFloat(document.getElementById('fluxo-val')?.value);
  const data  = document.getElementById('fluxo-data-filtro')?.value || hoje();

  if (!desc || isNaN(val) || val <= 0) {
    showToast('Preencha descrição e valor.', 'err');
    return;
  }
  try {
    await API.addFluxo({ tipo: tipoFluxo, descricao: desc, categoria: cat, forma, valor: val, data });
    if (document.getElementById('fluxo-desc')) document.getElementById('fluxo-desc').value = '';
    if (document.getElementById('fluxo-val'))  document.getElementById('fluxo-val').value  = '';
    await carregarFluxo();
    showToast('Lançamento registrado!');
  } catch (e) { showToast(e.message, 'err'); }
}

async function delFluxo(id) {
  if (!confirm('Excluir lançamento?')) return;
  try { await API.delFluxo(id); await carregarFluxo(); showToast('Excluído.'); }
  catch (e) { showToast(e.message, 'err'); }
}

function exportarFluxoCSV() {
  const rows = [
    ['Hora', 'Tipo', 'Descrição', 'Categoria', 'Forma', 'Valor'],
    ...fluxoCache.map(f => [
      new Date(f.criado_em).toLocaleTimeString('pt-BR'),
      f.tipo, f.descricao, f.categoria, f.forma, f.valor
    ])
  ];
  baixarCSV('fluxo.csv', rows);
}

// ═══════════════════════════════════════════════════════════════
//  ENCOMENDAS
// ═══════════════════════════════════════════════════════════════
let filtroEnc = 'todos';

function setFiltroEnc(f) {
  filtroEnc = f;
  document.querySelectorAll('.enc-filtro').forEach(b => {
    b.classList.toggle('active',
      (f === 'todos' && b.textContent.includes('Todas')) ||
      b.textContent.toLowerCase().includes(f)
    );
  });
  renderEncomendas();
}

async function carregarEncomendas() {
  try {
    encomendas = listaResposta(await API.getEncomendas());
    renderEncomendas();
  } catch (e) { showToast('Erro encomendas: ' + e.message, 'err'); }
}

function renderEncomendas() {
  let encs = [...encomendas];
  if (filtroEnc !== 'todos') encs = encs.filter(e => e.status === filtroEnc);

  const vazio = document.getElementById('enc-vazio');
  if (vazio) vazio.style.display = encs.length ? 'none' : 'block';

  document.getElementById('enc-grid').innerHTML = encs.map(e => `
    <div class="enc-card">
      <div class="enc-card-head">
        <span class="enc-num">📦 #${String(e.numero).padStart(4, '0')}</span>
        <span class="enc-status ${e.status}">${{ pendente: '⏳ Pendente', pronto: '✅ Pronta', entregue: '📬 Entregue' }[e.status]}</span>
      </div>
      <div class="enc-cliente">👤 ${e.cliente}</div>
      ${e.telefone ? `<div class="enc-info">📞 ${e.telefone}</div>` : ''}
      ${e.data_entrega ? `<div class="enc-info">📅 ${new Date(e.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}</div>` : ''}
      ${e.observacoes ? `<div class="enc-obs">${e.observacoes}</div>` : ''}
      <div class="enc-itens-lista">${(e.itens || []).map(i => `<span>${i.nome} × ${i.quantidade}</span>`).join('')}</div>
      <div class="enc-footer">
        <span style="color:var(--gold2);font-weight:600;">${fmtR(parseFloat(e.total || 0))}</span>
        ${parseFloat(e.sinal || 0) > 0 ? `<span style="font-size:11px;color:var(--muted);">Sinal: ${fmtR(parseFloat(e.sinal))}</span>` : ''}
        <div style="display:flex;gap:6px;margin-left:auto;">
          ${e.status !== 'entregue' ? `<button class="btn-sec" style="font-size:10px;padding:3px 8px;" onclick="avancarStatusEnc(${e.id},'${e.status}')">Avançar</button>` : ''}
          <button class="btn-icon" onclick="abrirEditEnc(${e.id})">✏️</button>
          ${operador.role === 'admin' ? `<button class="btn-icon" onclick="delEnc(${e.id})">🗑</button>` : ''}
        </div>
      </div>
    </div>`).join('');
}

async function avancarStatusEnc(id, status) {
  const next = status === 'pendente' ? 'pronto' : status === 'pronto' ? 'entregue' : null;
  if (!next) return;
  try { await API.setStatusEnc(id, next); await carregarEncomendas(); showToast('Status atualizado!'); }
  catch (e) { showToast(e.message, 'err'); }
}

async function delEnc(id) {
  if (!confirm('Excluir encomenda?')) return;
  try { await API.delEncomenda(id); await carregarEncomendas(); showToast('Excluída.'); }
  catch (e) { showToast(e.message, 'err'); }
}

function abrirModalEnc() {
  document.getElementById('enc-titulo').textContent = '📦 Nova Encomenda';
  document.getElementById('enc-edit-id').value = '';
  ['enc-cliente', 'enc-fone', 'enc-obs', 'enc-data', 'enc-sinal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('enc-itens-modal').innerHTML = '';
  document.getElementById('modal-enc').classList.add('open');
}

function abrirEditEnc(id) {
  const e = encomendas.find(x => x.id === id);
  if (!e) return;
  document.getElementById('enc-titulo').textContent = '✏️ Editar Encomenda';
  document.getElementById('enc-edit-id').value       = id;
  document.getElementById('enc-cliente').value       = e.cliente;
  document.getElementById('enc-fone').value          = e.telefone || '';
  document.getElementById('enc-data').value          = e.data_entrega?.split('T')[0] || '';
  document.getElementById('enc-sinal').value         = e.sinal || '';
  document.getElementById('enc-obs').value           = e.observacoes || '';
  document.getElementById('enc-itens-modal').innerHTML = '';
  (e.itens || []).forEach(i => addLinhaEnc(i.nome, i.quantidade, i.preco));
  document.getElementById('modal-enc').classList.add('open');
}

function addLinhaEnc(nome = '', qtd = 1, preco = 0) {
  const div = document.createElement('div');
  div.className = 'enc-item-row';
  div.innerHTML = `
    <input class="cad-input" type="text" placeholder="Item" value="${nome}" style="flex:1;font-size:12px;padding:6px 9px;">
    <input class="cad-input qtd-inp"   type="number" min="1" value="${qtd}" placeholder="Qtd">
    <input class="cad-input preco-inp" type="number" min="0" step="0.01" value="${preco || ''}" placeholder="R$">
    <button class="btn-rm" onclick="this.parentElement.remove()">✕</button>`;
  document.getElementById('enc-itens-modal').appendChild(div);
}

function abrirSeletorProd() {
  document.getElementById('busca-seletor').value = '';
  renderSeletor();
  document.getElementById('modal-seletor').classList.add('open');
}

function renderSeletor() {
  const busca = document.getElementById('busca-seletor')?.value.toLowerCase();
  let pr = [...produtos];
  if (busca) pr = pr.filter(p => p.nome.toLowerCase().includes(busca));
  document.getElementById('seletor-grid').innerHTML = pr.map(p => `
    <button onclick="selecionarProdEnc(${p.id})" style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;">
      <span style="font-size:22px;">${p.icone || '🛒'}</span>
      <span style="font-size:10px;color:var(--cream);text-align:center;">${p.nome}</span>
      <span style="font-size:11px;color:var(--gold2);font-weight:600;">${fmtR(p.preco)}</span>
    </button>`).join('');
}

function selecionarProdEnc(id) {
  const p = prodMap.get(id);
  if (!p) return;
  addLinhaEnc(p.nome, 1, p.preco);
  fecharModal('modal-seletor');
}

async function salvarEncomenda() {
  const cliente = document.getElementById('enc-cliente')?.value.trim();
  if (!cliente) { showToast('Digite o cliente.', 'err'); return; }

  const rows  = [...document.getElementById('enc-itens-modal').querySelectorAll('.enc-item-row')];
  const itens = rows.map(r => {
    const ins = r.querySelectorAll('input');
    return { nome: ins[0].value.trim(), quantidade: parseInt(ins[1].value) || 1, preco: parseFloat(ins[2].value) || 0 };
  }).filter(i => i.nome);

  const eid = document.getElementById('enc-edit-id')?.value;
  const payload = {
    cliente,
    telefone:     document.getElementById('enc-fone')?.value.trim(),
    data_entrega: document.getElementById('enc-data')?.value,
    sinal:        parseFloat(document.getElementById('enc-sinal')?.value) || 0,
    observacoes:  document.getElementById('enc-obs')?.value.trim(),
    itens,
    status: 'pendente'
  };

  try {
    if (eid) await API.editEncomenda(eid, payload);
    else     await API.addEncomenda(payload);
    fecharModal('modal-enc');
    await carregarEncomendas();
    showToast('Encomenda salva!');
  } catch (e) { showToast(e.message, 'err'); }
}

// ═══════════════════════════════════════════════════════════════
//  PRODUTOS
// ═══════════════════════════════════════════════════════════════
function renderCatSelects() {
  ['p-cat', 'edit-cat'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    // Pega ids reais das categorias
    el.innerHTML = [...catMap.entries()].map(([nome, cid]) =>
      `<option value="${cid}">${nome}</option>`
    ).join('');
  });
}

async function adicionarCat() {
  const val = document.getElementById('nova-cat')?.value.trim();
  if (!val) { showToast('Digite o nome.', 'err'); return; }
  try {
    const nova = await API.addCat(val);
    cats.push(nova.nome);
    catMap.set(nova.nome, nova.id);
    document.getElementById('nova-cat').value = '';
    renderCatSelects();
    renderCats();
    renderGrid();
    showToast('Categoria adicionada!');
  } catch (e) { showToast(e.message, 'err'); }
}

async function cadastrarProduto() {
  const icone = document.getElementById('p-icone')?.value.trim() || '🛒';
  const nome  = document.getElementById('p-nome')?.value.trim();
  const catId = document.getElementById('p-cat')?.value;
  const preco = parseFloat(document.getElementById('p-preco')?.value);
  const custo = parseFloat(document.getElementById('p-custo')?.value) || 0;

  if (!nome)                     { showToast('Digite o nome.', 'err'); return; }
  if (isNaN(preco) || preco < 0) { showToast('Preço inválido.', 'err'); return; }

  try {
    const r = await API.addProduto({ icone, nome, categoria_id: catId || null, preco, custo });
    // Recarrega lista completa para manter Map atualizado
    const lista = listaResposta(await API.getProdutos());
    produtos = lista;
    prodMap  = new Map(produtos.map(p => [p.id, p]));
    cats     = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];

    ['p-icone', 'p-nome', 'p-preco', 'p-custo'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    renderTabProd();
    renderGrid();
    renderCats();
    showToast('Produto cadastrado!');
  } catch (e) { showToast(e.message, 'err'); }
}

function renderTabProd() {
  const busca = (document.getElementById('busca-cad')?.value || '').toLowerCase();
  let pr = [...produtos];
  if (busca) pr = pr.filter(p => p.nome.toLowerCase().includes(busca) || (p.categoria || '').toLowerCase().includes(busca));

  const tbody = document.getElementById('prod-body');
  const vazio = document.getElementById('prod-vazio');
  if (!pr.length) { if (tbody) tbody.innerHTML = ''; if (vazio) vazio.style.display = 'block'; return; }
  if (vazio) vazio.style.display = 'none';

  tbody.innerHTML = pr.map(p => {
    const margem = p.preco > 0 && p.custo > 0
      ? ((p.preco - p.custo) / p.preco * 100).toFixed(0) + '%'
      : '-';
    return `<tr>
      <td style="font-size:20px;">${p.icone || '🛒'}</td>
      <td>${p.nome}</td>
      <td><span class="cat-badge">${p.categoria || '-'}</span></td>
      <td style="color:var(--gold2);font-weight:600;">${fmtR(p.preco)}</td>
      <td style="color:var(--muted);font-size:11px;">${p.custo > 0 ? fmtR(p.custo) : '-'}</td>
      <td style="color:var(--green2);font-size:11px;">${margem}</td>
      <td>
        <button class="btn-icon" onclick="abrirModalProd(${p.id})">✏️</button>
        <button class="btn-icon" onclick="excluirProd(${p.id})">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function abrirModalProd(id) {
  const p = prodMap.get(id);
  if (!p) return;
  renderCatSelects();
  document.getElementById('edit-id').value    = id;
  document.getElementById('edit-icone').value = p.icone || '';
  document.getElementById('edit-nome').value  = p.nome;
  document.getElementById('edit-preco').value = p.preco;
  document.getElementById('edit-custo').value = p.custo || 0;
  document.getElementById('edit-cat').value   = p.categoria_id || '';
  document.getElementById('modal-prod').classList.add('open');
}

async function salvarEdicaoProd() {
  const id    = parseInt(document.getElementById('edit-id')?.value);
  const icone = document.getElementById('edit-icone')?.value.trim() || '🛒';
  const nome  = document.getElementById('edit-nome')?.value.trim();
  const preco = parseFloat(document.getElementById('edit-preco')?.value);
  const custo = parseFloat(document.getElementById('edit-custo')?.value) || 0;
  const catId = document.getElementById('edit-cat')?.value;

  if (!nome || isNaN(preco)) { showToast('Preencha tudo.', 'err'); return; }

  try {
    await API.editProduto(id, { icone, nome, categoria_id: catId || null, preco, custo });

    // Atualiza Map local
    const p = prodMap.get(id);
    if (p) {
      Object.assign(p, { icone, nome, preco, custo, categoria_id: catId });
      // Atualiza nome da categoria
      const catNome = [...catMap.entries()].find(([, cid]) => String(cid) === String(catId))?.[0];
      if (catNome) p.categoria = catNome;
    }

    fecharModal('modal-prod');
    renderTabProd();
    renderGrid();
    showToast('Produto atualizado!');
  } catch (e) { showToast(e.message, 'err'); }
}

async function excluirProd(id) {
  const p = prodMap.get(id);
  if (!confirm(`Desativar "${p?.nome}"?`)) return;
  try {
    await API.delProduto(id);
    produtos = produtos.filter(x => x.id !== id);
    prodMap.delete(id);
    renderTabProd();
    renderGrid();
    showToast('Produto desativado.');
  } catch (e) { showToast(e.message, 'err'); }
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN — USUÁRIOS
// ═══════════════════════════════════════════════════════════════
let usuariosCache = [];

async function carregarUsuarios() {
  try {
    const resp = await API.getUsuarios();
    usuariosCache = Array.isArray(resp) ? resp : (resp?.data || []);
    renderUsuarios();
  }
  catch (e) { showToast(e.message, 'err'); }
}

const TABS_LABELS = {
  caixa: '🛒 Caixa', encomendas: '📦 Encomendas', estoque: '📦 Estoque',
  fluxo: '💰 Fluxo', rel: '📊 Relatórios', produtos: '🗂 Produtos'
};

function renderUsuarios() {
  const rows = Array.isArray(usuariosCache) ? usuariosCache : [];
  const body = document.getElementById('users-body');
  if (!body) return;

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:18px;">Nenhum usuário encontrado.</td></tr>';
    return;
  }

  body.innerHTML = rows.map(u => `<tr>
    <td>${u.nome}</td>
    <td style="color:var(--muted);">${u.username}</td>
    <td><span class="cat-badge" style="${u.role === 'admin' ? 'background:rgba(200,133,58,0.2);color:var(--gold);' : ''}">${u.role}</span></td>
    <td style="font-size:11px;">${u.role === 'admin' ? 'Tudo' : (typeof u.permissoes === 'string' ? JSON.parse(u.permissoes) : u.permissoes || []).map(p => TABS_LABELS[p] || p).join(', ')}</td>
    <td><span style="color:${u.ativo ? 'var(--green2)' : '#e87a7a'};">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
    <td>
      <button class="btn-icon" onclick="abrirModalUser(${u.id})">✏️</button>
      ${u.id !== operador.id ? `<button class="btn-icon" onclick="delUser(${u.id})">🗑</button>` : ''}
    </td>
  </tr>`).join('');
}

function abrirNovoUser() {
  document.getElementById('user-edit-id').value = '';
  ['u-nome', 'u-user', 'u-senha'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('u-role').value = 'operador';
  TODOS_TABS.forEach(t => { const cb = document.getElementById('perm-' + t); if (cb) cb.checked = t === 'caixa'; });
  togglePermissoes();
  document.getElementById('modal-user').classList.add('open');
}

function abrirModalUser(id) {
  const u = usuariosCache.find(x => x.id === id);
  if (!u) return;
  document.getElementById('user-edit-id').value = id;
  document.getElementById('u-nome').value        = u.nome;
  document.getElementById('u-user').value        = u.username;
  document.getElementById('u-senha').value       = '';
  document.getElementById('u-role').value        = u.role;
  const perms = typeof u.permissoes === 'string' ? JSON.parse(u.permissoes) : u.permissoes || [];
  TODOS_TABS.forEach(t => { const cb = document.getElementById('perm-' + t); if (cb) cb.checked = perms.includes(t); });
  togglePermissoes();
  document.getElementById('modal-user').classList.add('open');
}

function togglePermissoes() {
  const isAdmin = document.getElementById('u-role')?.value === 'admin';
  const sec = document.getElementById('perms-section');
  if (sec) { sec.style.opacity = isAdmin ? '0.4' : '1'; sec.style.pointerEvents = isAdmin ? 'none' : 'auto'; }
}

async function salvarUser() {
  const eid      = document.getElementById('user-edit-id')?.value;
  const nome     = document.getElementById('u-nome')?.value.trim();
  const username = document.getElementById('u-user')?.value.trim();
  const senha    = document.getElementById('u-senha')?.value;
  const role     = document.getElementById('u-role')?.value;

  if (!nome || !username) { showToast('Preencha nome e usuário.', 'err'); return; }
  if (!eid && !senha)     { showToast('Informe a senha para novo usuário.', 'err'); return; }

  const perms  = TODOS_TABS.filter(t => document.getElementById('perm-' + t)?.checked);
  const payload = { nome, username, role, permissoes: perms, ativo: true };
  if (senha) payload.senha = senha;

  try {
    if (eid) await API.editUsuario(eid, payload);
    else     await API.addUsuario(payload);
    fecharModal('modal-user');
    await carregarUsuarios();
    showToast(eid ? 'Usuário atualizado!' : 'Usuário criado!');
  } catch (e) { showToast(e.message, 'err'); }
}

async function delUser(id) {
  if (!confirm('Desativar este usuário?')) return;
  try { await API.delUsuario(id); await carregarUsuarios(); showToast('Usuário desativado.'); }
  catch (e) { showToast(e.message, 'err'); }
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN — CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════
async function carregarConfigAdmin() {
  try {
    const cfg = await API.getConfig();
    if (document.getElementById('cfg-nome'))   document.getElementById('cfg-nome').value   = cfg.nome_loja || '';
    if (document.getElementById('cfg-slogan')) document.getElementById('cfg-slogan').value = cfg.slogan || '';
    if (cfg.logo_path) {
      const prev = document.getElementById('logo-preview');
      if (prev) { prev.src = API_BASE + cfg.logo_path; prev.style.display = 'block'; }
    }
  } catch { /* silencioso */ }
}

async function salvarConfig() {
  const nome   = document.getElementById('cfg-nome')?.value.trim();
  const slogan = document.getElementById('cfg-slogan')?.value.trim();
  try {
    await API.saveConfig({ nome_loja: nome, slogan });
    await carregarConfig();
    showToast('Configurações salvas!');
  } catch (e) { showToast(e.message, 'err'); }
}

async function uploadLogoAdmin() {
  const input = document.getElementById('logo-input');
  if (!input?.files.length) { showToast('Selecione um arquivo.', 'err'); return; }
  const fd = new FormData();
  fd.append('logo', input.files[0]);
  try {
    const r = await API.uploadLogo(fd);
    aplicarLogo(r.logo_path);
    const prev = document.getElementById('logo-preview');
    if (prev) { prev.src = API_BASE + r.logo_path; prev.style.display = 'block'; }
    showToast('Logo atualizada!');
  } catch (e) { showToast(e.message, 'err'); }
}

// ═══════════════════════════════════════════════════════════════
//  ATALHOS DE TECLADO (PDV profissional)
//  F1        → foco na busca de produtos
//  F2 a F8   → seleciona a categoria correspondente (na ordem das abas)
//  F9        → alterna forma de pagamento (Dinheiro → Débito → Crédito → Pix)
//  F10       → Cobrar / registrar venda
//  Setas     → navega entre os produtos do grid (destaque visual)
//  Enter     → adiciona ao pedido o produto destacado no grid
//              (funciona também digitando na busca, ou com leitor de
//              código de barras que "digita" o código + Enter)
//  Delete    → remove o último item adicionado ao pedido
//  Esc       → fecha modal aberto, ou limpa o pedido (com confirmação)
// ═══════════════════════════════════════════════════════════════

/** Avança para a próxima forma de pagamento no ciclo. */
function cicloPagamento() {
  const ordem = ['dinheiro', 'cartao', 'credito', 'pix'];
  const atual = ordem.indexOf(pgto);
  const prox  = ordem[(atual + 1) % ordem.length];
  setPgto(prox);
}

/** Remove o item mais recente do carrinho (último inserido). */
function removerUltimoItem() {
  const keys = Object.keys(carrinho);
  if (!keys.length) return;
  const ultima = keys[keys.length - 1];
  const nome   = carrinho[ultima]?.nome || '';
  delItem(ultima);
  showToast('✕ Removido: ' + nome);
}

/** Clica na aba de categoria pelo índice visual (0 = Todos, 1 = próxima, ...). */
function selecionarCategoriaPorIndice(i) {
  const tabs = document.querySelectorAll('#cats .cat-tab');
  tabs[i]?.click();
}

/** Esc: fecha modal aberto; se não houver modal, limpa o pedido (pede confirmação). */
function tratarEsc() {
  const modalAberto = document.querySelector('.modal-bg.open');
  if (modalAberto) { fecharModal(modalAberto.id); return; }

  const telaCaixaAtiva = document.getElementById('tela-caixa')?.classList.contains('active');
  if (telaCaixaAtiva && Object.keys(carrinho).length) {
    if (confirm('Limpar todos os itens do pedido?')) limpar();
  }
}

const MAPA_TECLAS_CATEGORIA = { F2: 0, F3: 1, F4: 2, F5: 3, F6: 4, F7: 5, F8: 6 };

function initAtalhosTeclado() {
  document.addEventListener('keydown', (e) => {
    // Esc funciona em qualquer aba (fecha modal / limpa pedido)
    if (e.key === 'Escape') { tratarEsc(); return; }

    // Os demais atalhos só operam com a tela do Caixa ativa e nenhum modal aberto
    const telaCaixaAtiva = document.getElementById('tela-caixa')?.classList.contains('active');
    if (!telaCaixaAtiva || document.querySelector('.modal-bg.open')) return;

    if (e.key === 'F1') {
      e.preventDefault();
      document.getElementById('busca')?.focus();
      return;
    }

    if (e.key in MAPA_TECLAS_CATEGORIA) {
      e.preventDefault();
      selecionarCategoriaPorIndice(MAPA_TECLAS_CATEGORIA[e.key]);
      return;
    }

    if (e.key === 'F9') {
      e.preventDefault();
      cicloPagamento();
      return;
    }

    if (e.key === 'F10') {
      e.preventDefault();
      cobrar();
      return;
    }

    // "+" foca o campo "Recebido" — só faz sentido quando a forma é Dinheiro,
    // já que nas outras formas o campo existe no DOM mas fica oculto (reserva de espaço)
    if (e.key === '+') {
      const campoRecebido = document.getElementById('recebido-val');
      if (campoRecebido && pgto === 'dinheiro') {
        e.preventDefault();
        campoRecebido.focus();
        campoRecebido.select();
      }
      return;
    }

    // A partir daqui, os atalhos abaixo NUNCA devem disparar se o usuário
    // estiver digitando dentro de um campo (input/select/textarea) — senão
    // "roubam" teclas como Delete e as Setas que deveriam editar o texto.
    const emCampoDigitavel = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);

    // 1-4 selecionam a forma de pagamento diretamente (não conflita com a busca,
    // que continua aceitando números normalmente enquanto estiver focada)
    const MAPA_TECLA_PGTO = { '1': 'dinheiro', '2': 'cartao', '3': 'credito', '4': 'pix' };
    if (!emCampoDigitavel && e.key in MAPA_TECLA_PGTO) {
      e.preventDefault();
      setPgto(MAPA_TECLA_PGTO[e.key]);
      return;
    }

    if (e.key === 'Delete' && !emCampoDigitavel) {
      e.preventDefault();
      removerUltimoItem();
      return;
    }

    // Setas: navegam pelo grid de produtos — só quando o foco NÃO está em
    // nenhum campo de texto (senão precisam mover o cursor dentro do valor digitado)
    if (!emCampoDigitavel) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        moverSelecaoGrid(1);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        moverSelecaoGrid(-1);
        return;
      }
    }

    // Enter no campo "Recebido" finaliza a venda direto (equivalente ao F10)
    if (e.key === 'Enter' && document.activeElement?.id === 'recebido-val') {
      e.preventDefault();
      cobrar();
      return;
    }

    // Enter: adiciona o produto destacado no grid — funciona fora de campos de
    // texto, ou dentro da busca (inclusive leitor de código de barras, que
    // "digita" o código do produto e envia Enter)
    if (e.key === 'Enter' && (!emCampoDigitavel || document.activeElement?.id === 'busca')) {
      e.preventDefault();
      adicionarSelecaoGrid();
      return;
    }
  });
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  ['modal-prod', 'modal-enc', 'modal-seletor', 'modal-user', 'modal-abrir-caixa', 'modal-fechar-caixa'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', function (e) {
      if (e.target === this) fecharModal(id);
    });
  });
  initAtalhosTeclado();
  inicializar();
});