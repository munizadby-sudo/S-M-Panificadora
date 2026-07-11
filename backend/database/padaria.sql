-- ============================================================
--  PADARIA PDV v2.0 — Schema do Banco de Dados
--  Execute: mysql -u root -p < padaria.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS padaria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE padaria;

-- ── Configurações ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracoes (
  chave         VARCHAR(100) NOT NULL PRIMARY KEY,
  valor         TEXT,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO configuracoes (chave, valor) VALUES
  ('nome_loja', 'Padaria Dourada'),
  ('slogan',    'Sistema de Gestão PDV'),
  ('logo_path', NULL)
ON DUPLICATE KEY UPDATE chave = chave;

-- ── Usuários ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  role       ENUM('admin','operador') NOT NULL DEFAULT 'operador',
  permissoes JSON NOT NULL DEFAULT ('["caixa"]'),
  ativo      TINYINT(1) NOT NULL DEFAULT 1,
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Auditoria ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT,
  username    VARCHAR(50),
  acao        VARCHAR(80)  NOT NULL,
  tabela      VARCHAR(50),
  registro_id INT,
  dados_antes JSON,
  dados_depois JSON,
  ip          VARCHAR(45),
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tabela   (tabela, registro_id),
  INDEX idx_usuario  (usuario_id),
  INDEX idx_criado   (criado_em)
);

-- ── Categorias ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  nome  VARCHAR(50) NOT NULL UNIQUE,
  ativo TINYINT(1) NOT NULL DEFAULT 1
);

INSERT INTO categorias (nome) VALUES
  ('Pães'), ('Doces'), ('Salgados'), ('Bebidas')
ON DUPLICATE KEY UPDATE nome = nome;

-- ── Produtos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  icone        VARCHAR(10)   DEFAULT '🛒',
  nome         VARCHAR(100)  NOT NULL,
  categoria_id INT,
  preco        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  custo        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ativo        TINYINT(1)    NOT NULL DEFAULT 1,
  criado_em    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- ── Vendas ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  numero          INT           NOT NULL,
  usuario_id      INT,
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  desconto        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  forma_pagamento VARCHAR(20)   NOT NULL DEFAULT 'dinheiro',
  valor_recebido  DECIMAL(10,2),
  troco           DECIMAL(10,2),
  status          ENUM('ativa','cancelada') NOT NULL DEFAULT 'ativa',
  cancelado_por   INT,
  cancelado_em    TIMESTAMP NULL,
  motivo_cancel   VARCHAR(200),
  criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)    REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (cancelado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_vendas_data   (criado_em),
  INDEX idx_vendas_status (status)
);

CREATE TABLE IF NOT EXISTS venda_itens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  venda_id   INT           NOT NULL,
  produto_id INT,
  nome       VARCHAR(100)  NOT NULL,
  icone      VARCHAR(10),
  preco_unit DECIMAL(10,2) NOT NULL,
  quantidade INT           NOT NULL DEFAULT 1,
  subtotal   DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (venda_id)   REFERENCES vendas(id)   ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL,
  INDEX idx_venda_itens (venda_id)
);

-- ── Encomendas ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS encomendas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  numero       INT          NOT NULL,
  cliente      VARCHAR(100) NOT NULL,
  telefone     VARCHAR(20),
  data_entrega DATE,
  sinal        DECIMAL(10,2) DEFAULT 0.00,
  observacoes  TEXT,
  status       ENUM('pendente','pronto','entregue') DEFAULT 'pendente',
  total        DECIMAL(10,2) DEFAULT 0.00,
  usuario_id   INT,
  criado_em    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_encomendas_entrega (data_entrega),
  INDEX idx_encomendas_status  (status)
);

CREATE TABLE IF NOT EXISTS encomenda_itens (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  encomenda_id INT           NOT NULL,
  nome         VARCHAR(100)  NOT NULL,
  quantidade   INT           NOT NULL DEFAULT 1,
  preco        DECIMAL(10,2) DEFAULT 0.00,
  FOREIGN KEY (encomenda_id) REFERENCES encomendas(id) ON DELETE CASCADE
);

-- ── Estoque ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estoque (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  produto_id    INT  NOT NULL,
  data          DATE NOT NULL,
  periodo       ENUM('manha','tarde') NOT NULL DEFAULT 'manha',
  inicial       INT NOT NULL DEFAULT 0,
  produzido     INT NOT NULL DEFAULT 0,
  vendido       INT NOT NULL DEFAULT 0,
  minimo        INT NOT NULL DEFAULT 5,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY estoque_unico (produto_id, data, periodo),
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  INDEX idx_estoque_data (data, periodo)
);

-- ── Fluxo de Caixa ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fluxo_caixa (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT,
  tipo        ENUM('entrada','saida') NOT NULL,
  descricao   VARCHAR(200) NOT NULL,
  categoria   VARCHAR(50),
  forma       VARCHAR(30),
  valor       DECIMAL(10,2) NOT NULL,
  data        DATE          NOT NULL,
  gerado_auto TINYINT(1)    NOT NULL DEFAULT 0,
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_fluxo_data (data)
);

-- ── Abertura / Fechamento de Caixa ────────────────────────────
CREATE TABLE IF NOT EXISTS caixa_movimentos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tipo            ENUM('abertura','fechamento') NOT NULL,
  usuario_id      INT,
  valor_inicial   DECIMAL(10,2) DEFAULT 0.00,
  valor_final     DECIMAL(10,2) DEFAULT 0.00,
  total_vendas    DECIMAL(10,2) DEFAULT 0.00,
  total_sangrias  DECIMAL(10,2) DEFAULT 0.00,
  diferenca       DECIMAL(10,2) DEFAULT 0.00,
  observacoes     TEXT,
  criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ── Perdas / Desperdício ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS perdas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  produto_id  INT NOT NULL,
  quantidade  INT NOT NULL DEFAULT 1,
  motivo      ENUM('queimado','vencido','danificado','sobra') NOT NULL,
  data        DATE NOT NULL,
  periodo     ENUM('manha','tarde') DEFAULT 'manha',
  usuario_id  INT,
  obs         VARCHAR(200),
  custo_total DECIMAL(10,2) DEFAULT 0.00,
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ── Sequências ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sequencias (
  chave VARCHAR(50) PRIMARY KEY,
  valor INT NOT NULL DEFAULT 0
);

INSERT INTO sequencias (chave, valor) VALUES
  ('pedido',    1000),
  ('encomenda', 1)
ON DUPLICATE KEY UPDATE chave = chave;
