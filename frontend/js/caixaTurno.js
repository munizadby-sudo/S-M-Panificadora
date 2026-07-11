// ============================================================
//  caixaTurno.js — Abertura e fechamento de caixa por turno
//  Compatível com api.js (getCaixaStatus, abrirCaixa, fecharCaixa)
// ============================================================

let _turnoAtual = null;

// Alias para compatibilidade com app.js que chama verificarCaixaAberto()
async function verificarCaixaAberto() {
  await carregarStatusCaixa();
}

function periodoLabel() {
  return new Date().getHours() < 14 ? 'Manhã' : 'Tarde';
}

async function carregarStatusCaixa() {
  try {
    const resp = await req('GET', '/api/caixa-turno/status');
    _turnoAtual = resp?.turno || null;
    renderBannerCaixa(resp?.aberto, _turnoAtual);
  } catch {
    // silencioso — não bloqueia carregamento
  }
}

function renderBannerCaixa(aberto, turno) {
  const banner = document.getElementById('caixa-turno-banner');
  if (!banner) return;

  if (!aberto || !turno) {
    banner.innerHTML = `
      <div style="
        background:linear-gradient(135deg,#3d1a1a,#2a1010);
        border:1px solid var(--red);border-radius:10px;
        padding:12px 16px;display:flex;align-items:center;
        justify-content:space-between;margin-bottom:12px;gap:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:20px;">🔴</span>
          <div>
            <div style="font-weight:600;color:#e87a7a;font-size:13px;">
              Caixa fechado — Turno da ${periodoLabel()}
            </div>
            <div style="color:var(--muted);font-size:11px;margin-top:2px;">
              Abra o caixa antes de registrar vendas
            </div>
          </div>
        </div>
        <button onclick="abrirModalAberturaCaixa()" style="
          background:#2d6a2d;color:#fff;border:none;border-radius:8px;
          padding:8px 16px;font-size:12px;font-weight:600;
          cursor:pointer;white-space:nowrap;">
          🟢 Abrir Caixa
        </button>
      </div>`;
  } else {
    const fundo = (parseFloat(turno.fundo_especie||0) + parseFloat(turno.fundo_moedas||0)).toFixed(2);
    const abertoEm = new Date(turno.aberto_em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    banner.innerHTML = `
      <div style="
        background:linear-gradient(135deg,#0d2e1a,#0a1f12);
        border:1px solid #2d6a2d;border-radius:10px;
        padding:12px 16px;display:flex;align-items:center;
        justify-content:space-between;margin-bottom:12px;gap:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:20px;">🟢</span>
          <div>
            <div style="font-weight:600;color:#6fcf6f;font-size:13px;">
              Caixa aberto — Turno da ${periodoLabel()}
            </div>
            <div style="color:var(--muted);font-size:11px;margin-top:2px;">
              Fundo: R$ ${fundo} · Aberto às ${abertoEm}
            </div>
          </div>
        </div>
        <button onclick="abrirModalFechamentoCaixa()" style="
          background:#8b2020;color:#fff;border:none;border-radius:8px;
          padding:8px 16px;font-size:12px;font-weight:600;
          cursor:pointer;white-space:nowrap;">
          🔴 Fechar Caixa
        </button>
      </div>`;
  }
}

// ── Modal Abertura ────────────────────────────────────────────
function abrirModalAberturaCaixa() {
  const periodo = document.getElementById('abertura-periodo-label');
  if (periodo) periodo.textContent = `🌅 Turno da ${periodoLabel()}`;
  atualizarTotalAbertura();
  const el = document.getElementById('modal-abrir-caixa');
  if (el) el.classList.add('open');
}

function atualizarTotalAbertura() {
  const especie = parseFloat(document.getElementById('abertura-especie')?.value) || 0;
  const moedas  = parseFloat(document.getElementById('abertura-moedas')?.value)  || 0;
  const total   = document.getElementById('abertura-total');
  if (total) total.textContent = `R$ ${(especie + moedas).toFixed(2)}`;
}

async function confirmarAberturaCaixa() {
  const fundo_especie = parseFloat(document.getElementById('abertura-especie')?.value) || 0;
  const fundo_moedas  = parseFloat(document.getElementById('abertura-moedas')?.value)  || 0;
  try {
    await req('POST', '/api/caixa-turno/abrir', { fundo_especie, fundo_moedas });
    fecharModal('modal-abrir-caixa');
    await carregarStatusCaixa();
    showToast(`✅ Caixa aberto — Turno da ${periodoLabel()}`);
  } catch (e) { showToast('❌ ' + e.message, 'err'); }
}

// ── Modal Fechamento ──────────────────────────────────────────
function abrirModalFechamentoCaixa() {
  ['fechamento-dinheiro','fechamento-moedas','fechamento-pix',
   'fechamento-cartao','fechamento-obs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const resumo = document.getElementById('fechamento-resumo');
  if (resumo) resumo.style.display = 'none';
  const el = document.getElementById('modal-fechar-caixa');
  if (el) el.classList.add('open');
}

function atualizarResumoFechamento() {
  const dinheiro = parseFloat(document.getElementById('fechamento-dinheiro')?.value) || 0;
  const moedas   = parseFloat(document.getElementById('fechamento-moedas')?.value)   || 0;
  const pix      = parseFloat(document.getElementById('fechamento-pix')?.value)      || 0;
  const cartao   = parseFloat(document.getElementById('fechamento-cartao')?.value)   || 0;

  const resumo = document.getElementById('fechamento-resumo');
  if (!resumo) return;

  if (dinheiro + moedas + pix + cartao === 0) {
    resumo.style.display = 'none';
    return;
  }
  resumo.style.display = 'block';
}

async function confirmarFechamentoCaixa() {
  const contado_dinheiro = parseFloat(document.getElementById('fechamento-dinheiro')?.value) || 0;
  const contado_moedas   = parseFloat(document.getElementById('fechamento-moedas')?.value)   || 0;
  const contado_pix      = parseFloat(document.getElementById('fechamento-pix')?.value)      || 0;
  const contado_cartao   = parseFloat(document.getElementById('fechamento-cartao')?.value)   || 0;
  const observacao       = document.getElementById('fechamento-obs')?.value?.trim() || '';

  try {
    const r = await req('POST', '/api/caixa-turno/fechar', {
      contado_dinheiro, contado_moedas, contado_pix, contado_cartao, observacao
    });
    _turnoAtual = null;
    fecharModal('modal-fechar-caixa');
    await carregarStatusCaixa();

    const diff = r.diferenca?.total ?? 0;
    if (diff === 0)     showToast('✅ Caixa fechado. Bateu certinho!');
    else if (diff > 0)  showToast(`✅ Caixa fechado. Sobra de R$ ${Math.abs(diff).toFixed(2)}`);
    else                showToast(`⚠️ Caixa fechado. Falta de R$ ${Math.abs(diff).toFixed(2)}`, 'err');
  } catch (e) { showToast('❌ ' + e.message, 'err'); }
}

// Atualiza total ao digitar no modal de abertura
document.addEventListener('input', e => {
  if (e.target.id === 'abertura-especie' || e.target.id === 'abertura-moedas') {
    atualizarTotalAbertura();
  }
});