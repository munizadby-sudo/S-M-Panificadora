const db = require('../database/db');

/**
 * Registra uma ação no audit_log.
 *
 * @param {object} usuario    - req.usuario (id, username)
 * @param {string} acao       - ex: 'login', 'criar_venda', 'cancelar_venda', 'editar_produto'
 * @param {string} tabela     - nome da tabela afetada
 * @param {number} registroId - id do registro afetado
 * @param {object} antes      - estado anterior (para updates/deletes)
 * @param {object} depois     - estado novo (para inserts/updates)
 * @param {string} ip         - IP do cliente
 */
async function log(usuario, acao, tabela = null, registroId = null, antes = null, depois = null, ip = null) {
  try {
    await db.execute(
      `INSERT INTO audit_log 
       (usuario_id, username, acao, tabela, registro_id, dados_antes, dados_depois, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario?.id   ?? null,
        usuario?.username ?? null,
        acao,
        tabela,
        registroId,
        antes  ? JSON.stringify(antes)  : null,
        depois ? JSON.stringify(depois) : null,
        ip
      ]
    );
  } catch (e) {
    // Audit nunca deve quebrar o fluxo principal
    console.error('[audit]', e.message);
  }
}

module.exports = { log };
