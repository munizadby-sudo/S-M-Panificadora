// ============================================================
//  api.js — Camada central de comunicação com o backend
//  Todos os módulos usam este arquivo. Nunca chamam fetch diretamente.
// ============================================================

const API_BASE = 'http://localhost:3000';

function getToken() {
  return sessionStorage.getItem('pdv_token');
}

/**
 * Requisição HTTP genérica com tratamento padronizado de erros.
 */
async function req(method, path, body) {
  const opts = {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': 'Bearer ' + getToken()
    }
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(API_BASE + path, opts);
  } catch {
    throw new Error('Servidor indisponível. Verifique se o Node.js está rodando.');
  }

  // Token expirado ou inválido → volta para login
  if (res.status === 401) {
    sessionStorage.clear();
    window.location.href = 'login.html';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro desconhecido.');
  return data;
}

/**
 * Upload de arquivo multipart (logo, etc.)
 */
async function upload(path, formData) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method:  'POST',
      headers: { 'Authorization': 'Bearer ' + getToken() },
      body:    formData
    });
  } catch {
    throw new Error('Servidor indisponível.');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro no upload.');
  return data;
}

// ── API pública ───────────────────────────────────────────────
const API = {

  // ── Auth ──
  getMe:        ()         => req('GET',  '/api/auth/me'),

  // ── Configurações ──
  getConfig:    ()         => req('GET',  '/api/config'),
  saveConfig:   (d)        => req('PUT',  '/api/config', d),
  uploadLogo:   (fd)       => upload('/api/config/logo', fd),

  // ── Categorias ──
  getCats:      ()         => req('GET',  '/api/categorias'),
  addCat:       (nome)     => req('POST', '/api/categorias', { nome }),
  delCat:       (id)       => req('DELETE', `/api/categorias/${id}`),

  // ── Produtos ──
  getProdutos:  ()         => req('GET',  '/api/produtos'),
  addProduto:   (d)        => req('POST', '/api/produtos', d),
  editProduto:  (id, d)    => req('PUT',  `/api/produtos/${id}`, d),
  delProduto:   (id)       => req('DELETE', `/api/produtos/${id}`),

  // ── Vendas ──
  getVendas:    (ini, fim) => req('GET',  `/api/vendas?data_ini=${ini}&data_fim=${fim}`),
  addVenda:     (d)        => req('POST', '/api/vendas', d),
  cancelarVenda:(id, motivo) => req('DELETE', `/api/vendas/${id}`, { motivo }),

  // ── Encomendas ──
  getEncomendas:(status)   => req('GET',  `/api/encomendas${status && status !== 'todos' ? '?status=' + status : ''}`),
  addEncomenda: (d)        => req('POST', '/api/encomendas', d),
  editEncomenda:(id, d)    => req('PUT',  `/api/encomendas/${id}`, d),
  setStatusEnc: (id, s)    => req('PATCH', `/api/encomendas/${id}/status`, { status: s }),
  delEncomenda: (id)       => req('DELETE', `/api/encomendas/${id}`),

  // ── Estoque ──
  getEstoque:   (dt, per)  => req('GET',  `/api/estoque?data=${dt}&limit=500`),
  saveEstoque:  (d)        => req('POST', '/api/estoque', d),
  saveEstoqueLote: (itens) => req('POST', '/api/estoque/salvar-lote', { itens }),

  // ── Fluxo ──
  getFluxo:     (dt)       => req('GET',  `/api/fluxo?data=${dt}`),
  addFluxo:     (d)        => req('POST', '/api/fluxo', d),
  delFluxo:     (id)       => req('DELETE', `/api/fluxo/${id}`),

  // ── Caixa ──
  getCaixaStatus: ()       => req('GET',  '/api/caixa/status'),
  abrirCaixa:   (d)        => req('POST', '/api/caixa/abrir', d),
  fecharCaixa:  (d)        => req('POST', '/api/caixa/fechar', d),

  // ── Perdas ──
  getPerdas:    (dt)       => req('GET',  `/api/perdas?data=${dt}`),
  addPerda:     (d)        => req('POST', '/api/perdas', d),
  delPerda:     (id)       => req('DELETE', `/api/perdas/${id}`),

  // ── Usuários ──
  getUsuarios:  ()         => req('GET',  '/api/usuarios'),
  addUsuario:   (d)        => req('POST', '/api/usuarios', d),
  editUsuario:  (id, d)    => req('PUT',  `/api/usuarios/${id}`, d),
  delUsuario:   (id)       => req('DELETE', `/api/usuarios/${id}`)
};
