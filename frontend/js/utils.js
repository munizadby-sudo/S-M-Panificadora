// ============================================================
//  utils.js — Funções auxiliares globais
// ============================================================

/** Formata valor como moeda brasileira */
function fmtR(v) {
  return 'R$ ' + parseFloat(v || 0).toFixed(2).replace('.', ',');
}

/** Retorna a data atual no formato YYYY-MM-DD */
function hoje() {
  const agora = new Date();
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
}

/** Normaliza qualquer valor de data para YYYY-MM-DD */
function dataISO(valor) {
  if (!valor) return hoje();
  if (typeof valor === 'string') return valor.slice(0, 10);
  const dt = new Date(valor);
  if (Number.isNaN(dt.getTime())) return hoje();
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
}

/** Exibe toast de notificação */
function showToast(msg, tipo = '') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast' + (tipo ? ' ' + tipo : '') + ' show';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

/** Fecha um modal pelo id */
function fecharModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

/** Baixa dados como arquivo CSV */
function baixarCSV(nome, rows) {
  const csv  = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = nome;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Atualiza relógio */
function relogio() {
  const el = document.getElementById('relogio');
  if (el) el.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
