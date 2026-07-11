// ============================================================
//  auth.js — Gerenciamento de sessão
// ============================================================

let operador = null;

function getOperador() { return operador; }

/**
 * Inicializa a sessão. Redireciona para login se não autenticado.
 */
async function boot() {
  const tok  = sessionStorage.getItem('pdv_token');
  const uStr = sessionStorage.getItem('pdv_usuario');

  if (!tok || !uStr) {
    window.location.href = 'login.html';
    return false;
  }

  operador = JSON.parse(uStr);
  return true;
}

function logout() {
  if (!confirm('Deseja sair do sistema?')) return;
  sessionStorage.clear();
  window.location.href = 'login.html';
}

/**
 * Verifica se o operador tem determinada permissão.
 * Admin sempre retorna true.
 */
function temPermissao(modulo) {
  if (!operador) return false;
  if (operador.role === 'admin') return true;
  return (operador.permissoes || []).includes(modulo);
}
