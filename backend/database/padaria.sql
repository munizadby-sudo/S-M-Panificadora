-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 07/07/2026 às 03:28
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `padaria`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `audit_log`
--

CREATE TABLE `audit_log` (
  `id` bigint(20) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `acao` varchar(80) NOT NULL,
  `tabela` varchar(50) DEFAULT NULL,
  `registro_id` int(11) DEFAULT NULL,
  `dados_antes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dados_antes`)),
  `dados_depois` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dados_depois`)),
  `ip` varchar(45) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `audit_log`
--

INSERT INTO `audit_log` (`id`, `usuario_id`, `username`, `acao`, `tabela`, `registro_id`, `dados_antes`, `dados_depois`, `ip`, `criado_em`) VALUES
(1, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 00:51:40'),
(2, 1, 'admin', 'criar_usuario', 'usuarios', 2, NULL, '{\"nome\":\"Isadora Karem\",\"username\":\"Isa\",\"role\":\"operador\"}', '::1', '2026-07-05 00:52:37'),
(3, 2, 'isa', 'login', 'usuarios', 2, NULL, NULL, '::1', '2026-07-05 00:52:49'),
(4, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 00:53:19'),
(5, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 00:56:23'),
(6, 1, 'admin', 'criar_produto', 'produtos', 1, NULL, '{\"nome\":\"Pão Françês\",\"preco\":0.5}', '::1', '2026-07-05 00:58:01'),
(7, 1, 'admin', 'criar_produto', 'produtos', 2, NULL, '{\"nome\":\"Pão Doce Cocô\",\"preco\":0.5}', '::1', '2026-07-05 00:58:16'),
(8, 1, 'admin', 'criar_produto', 'produtos', 3, NULL, '{\"nome\":\"Pão Doce Creme\",\"preco\":0.5}', '::1', '2026-07-05 00:58:30'),
(9, 1, 'admin', 'criar_produto', 'produtos', 4, NULL, '{\"nome\":\"Pão Doce Gelo\",\"preco\":0.5}', '::1', '2026-07-05 00:58:45'),
(10, 1, 'admin', 'criar_produto', 'produtos', 5, NULL, '{\"nome\":\"Pão Carteira\",\"preco\":0.5}', '::1', '2026-07-05 00:59:04'),
(11, 1, 'admin', 'criar_produto', 'produtos', 6, NULL, '{\"nome\":\"Pão Brote\",\"preco\":0.5}', '::1', '2026-07-05 00:59:15'),
(12, 1, 'admin', 'criar_produto', 'produtos', 7, NULL, '{\"nome\":\"Catupiry\",\"preco\":35}', '::1', '2026-07-05 00:59:38'),
(13, 1, 'admin', 'criar_produto', 'produtos', 8, NULL, '{\"nome\":\"Olho de Sogra\",\"preco\":35}', '::1', '2026-07-05 00:59:52'),
(14, 1, 'admin', 'criar_produto', 'produtos', 9, NULL, '{\"nome\":\"Coxinha\",\"preco\":4.5}', '::1', '2026-07-05 01:00:01'),
(15, 1, 'admin', 'criar_produto', 'produtos', 10, NULL, '{\"nome\":\"Pastel Carne\",\"preco\":4.5}', '::1', '2026-07-05 01:00:23'),
(16, 1, 'admin', 'criar_produto', 'produtos', 11, NULL, '{\"nome\":\"Pastel Forno Frango\",\"preco\":4.5}', '::1', '2026-07-05 01:00:49'),
(17, 1, 'admin', 'criar_produto', 'produtos', 12, NULL, '{\"nome\":\"Pastel Misto\",\"preco\":4.5}', '::1', '2026-07-05 01:01:06'),
(18, 1, 'admin', 'criar_produto', 'produtos', 13, NULL, '{\"nome\":\"Coca Cola 1 L\",\"preco\":9.9}', '::1', '2026-07-05 01:01:48'),
(19, 1, 'admin', 'criar_produto', 'produtos', 14, NULL, '{\"nome\":\"Coca Cola Zero 250ml\",\"preco\":4.5}', '::1', '2026-07-05 01:02:09'),
(20, 1, 'admin', 'criar_produto', 'produtos', 15, NULL, '{\"nome\":\"Coca Cola 250ml\",\"preco\":4.5}', '::1', '2026-07-05 01:02:25'),
(21, 1, 'admin', 'criar_produto', 'produtos', 16, NULL, '{\"nome\":\"Fanta Uva\",\"preco\":4.5}', '::1', '2026-07-05 01:02:39'),
(22, 1, 'admin', 'criar_produto', 'produtos', 17, NULL, '{\"nome\":\"Guaraná 250ml\",\"preco\":3.5}', '::1', '2026-07-05 01:02:56'),
(23, 1, 'admin', 'criar_produto', 'produtos', 18, NULL, '{\"nome\":\"Toddinho\",\"preco\":3.5}', '::1', '2026-07-05 01:03:08'),
(24, 1, 'admin', 'criar_produto', 'produtos', 19, NULL, '{\"nome\":\"Coca Cola 600ml\",\"preco\":8.9}', '::1', '2026-07-05 01:03:26'),
(25, 1, 'admin', 'criar_produto', 'produtos', 20, NULL, '{\"nome\":\"Queijo Coalho\",\"preco\":40}', '::1', '2026-07-05 01:03:51'),
(26, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 12:51:32'),
(27, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 13:04:20'),
(28, 1, 'admin', 'abrir_caixa', 'caixa_turnos', 1, NULL, '{\"id\":1,\"data\":\"2026-07-05\",\"periodo\":\"manha\",\"status\":\"aberto\"}', '::1', '2026-07-05 13:25:54'),
(29, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 13:26:49'),
(30, 1, 'admin', 'fechar_caixa', 'caixa_turnos', 1, NULL, '{\"id\":1,\"periodo\":\"manha\",\"esperado\":{\"dinheiro\":45,\"pix\":0,\"cartao\":0},\"contado\":{\"dinheiro\":0,\"pix\":0,\"cartao\":0},\"diferenca\":{\"dinheiro\":-45,\"pix\":0,\"cartao\":0,\"total\":-45},\"status_resumo\":\"falta\"}', '::1', '2026-07-05 13:27:19'),
(31, 1, 'admin', 'abrir_caixa', 'caixa_turnos', 2, NULL, '{\"id\":2,\"data\":\"2026-07-05\",\"periodo\":\"manha\",\"status\":\"aberto\"}', '::1', '2026-07-05 13:28:36'),
(32, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 13:45:33'),
(33, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 14:10:30'),
(34, 1, 'admin', 'criar_produto', 'produtos', 21, NULL, '{\"nome\":\"Torrada\",\"preco\":4}', '::1', '2026-07-05 14:40:42'),
(35, 1, 'admin', 'criar_produto', 'produtos', 22, NULL, '{\"nome\":\"Torada Doce\",\"preco\":4}', '::1', '2026-07-05 14:40:55'),
(36, 1, 'admin', 'criar_produto', 'produtos', 23, NULL, '{\"nome\":\"Farinha de Rosca\",\"preco\":12}', '::1', '2026-07-05 14:44:49'),
(37, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 15:39:51'),
(38, 2, 'isa', 'login', 'usuarios', 2, NULL, NULL, '::1', '2026-07-05 15:41:06'),
(39, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 17:11:43'),
(40, 1, 'admin', 'criar_venda', 'vendas', 8, NULL, '{\"numero\":1000,\"total\":29.700000000000003,\"forma_pagamento\":\"dinheiro\"}', '::1', '2026-07-05 17:12:10'),
(41, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 18:51:09'),
(42, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-05 18:52:41'),
(43, 1, 'admin', 'criar_venda', 'vendas', 10, NULL, '{\"numero\":1001,\"total\":9.9,\"forma_pagamento\":\"dinheiro\"}', '::1', '2026-07-05 19:23:32'),
(44, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-06 11:55:09'),
(45, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-06 14:09:57'),
(46, 2, 'isa', 'login', 'usuarios', 2, NULL, NULL, '::1', '2026-07-06 14:10:07'),
(47, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-06 14:10:22'),
(48, 1, 'admin', 'abrir_caixa', 'caixa_turnos', 3, NULL, '{\"id\":3,\"data\":\"2026-07-06\",\"periodo\":\"tarde\",\"status\":\"aberto\"}', '::1', '2026-07-07 00:53:11'),
(49, 1, 'admin', 'criar_venda', 'vendas', 11, NULL, '{\"numero\":1002,\"total\":17.9,\"forma_pagamento\":\"pix\"}', '::1', '2026-07-07 00:53:19'),
(50, 1, 'admin', 'criar_venda', 'vendas', 12, NULL, '{\"numero\":1003,\"total\":11.5,\"forma_pagamento\":\"pix\"}', '::1', '2026-07-07 00:53:32'),
(51, 1, 'admin', 'fechar_caixa', 'caixa_turnos', 3, NULL, '{\"id\":3,\"periodo\":\"tarde\",\"esperado\":{\"dinheiro\":45,\"pix\":29.4,\"cartao\":0},\"contado\":{\"dinheiro\":100,\"pix\":0,\"cartao\":0},\"diferenca\":{\"dinheiro\":55,\"pix\":-29.4,\"cartao\":0,\"total\":25.6},\"status_resumo\":\"sobra\"}', '::1', '2026-07-07 00:53:53'),
(52, 1, 'admin', 'abrir_caixa', 'caixa_turnos', 4, NULL, '{\"id\":4,\"data\":\"2026-07-06\",\"periodo\":\"tarde\",\"status\":\"aberto\"}', '::1', '2026-07-07 00:54:11'),
(53, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-07 00:55:04'),
(54, 1, 'admin', 'login', 'usuarios', 1, NULL, NULL, '::1', '2026-07-07 00:59:29');

-- --------------------------------------------------------

--
-- Estrutura para tabela `caixa_movimentos`
--

CREATE TABLE `caixa_movimentos` (
  `id` int(11) NOT NULL,
  `tipo` enum('abertura','fechamento') NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `valor_inicial` decimal(10,2) DEFAULT 0.00,
  `valor_final` decimal(10,2) DEFAULT 0.00,
  `total_vendas` decimal(10,2) DEFAULT 0.00,
  `total_sangrias` decimal(10,2) DEFAULT 0.00,
  `diferenca` decimal(10,2) DEFAULT 0.00,
  `observacoes` text DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `caixa_turnos`
--

CREATE TABLE `caixa_turnos` (
  `id` int(11) NOT NULL,
  `data` date NOT NULL,
  `periodo` enum('manha','tarde') NOT NULL,
  `status` enum('aberto','fechado') NOT NULL DEFAULT 'aberto',
  `aberto_por` int(11) NOT NULL,
  `aberto_em` datetime NOT NULL DEFAULT current_timestamp(),
  `fundo_especie` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fundo_moedas` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fechado_por` int(11) DEFAULT NULL,
  `fechado_em` datetime DEFAULT NULL,
  `esperado_dinheiro` decimal(10,2) DEFAULT NULL,
  `esperado_pix` decimal(10,2) DEFAULT NULL,
  `esperado_cartao` decimal(10,2) DEFAULT NULL,
  `contado_dinheiro` decimal(10,2) DEFAULT NULL,
  `contado_pix` decimal(10,2) DEFAULT NULL,
  `contado_cartao` decimal(10,2) DEFAULT NULL,
  `contado_moedas` decimal(10,2) DEFAULT NULL,
  `diferenca_dinheiro` decimal(10,2) DEFAULT NULL,
  `diferenca_pix` decimal(10,2) DEFAULT NULL,
  `diferenca_cartao` decimal(10,2) DEFAULT NULL,
  `diferenca_total` decimal(10,2) DEFAULT NULL,
  `observacao` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `caixa_turnos`
--

INSERT INTO `caixa_turnos` (`id`, `data`, `periodo`, `status`, `aberto_por`, `aberto_em`, `fundo_especie`, `fundo_moedas`, `fechado_por`, `fechado_em`, `esperado_dinheiro`, `esperado_pix`, `esperado_cartao`, `contado_dinheiro`, `contado_pix`, `contado_cartao`, `contado_moedas`, `diferenca_dinheiro`, `diferenca_pix`, `diferenca_cartao`, `diferenca_total`, `observacao`) VALUES
(1, '2026-07-05', 'manha', 'fechado', 1, '2026-07-05 10:25:54', 40.00, 5.00, 1, '2026-07-05 10:27:19', 45.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, -45.00, 0.00, 0.00, -45.00, ''),
(2, '2026-07-05', 'manha', 'aberto', 1, '2026-07-05 10:28:36', 40.00, 5.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, '2026-07-06', 'tarde', 'fechado', 1, '2026-07-06 21:53:11', 40.00, 5.00, 1, '2026-07-06 21:53:53', 45.00, 29.40, 0.00, 100.00, 0.00, 0.00, 0.00, 55.00, -29.40, 0.00, 25.60, ''),
(4, '2026-07-06', 'tarde', 'aberto', 1, '2026-07-06 21:54:11', 40.00, 5.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nome` varchar(50) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `categorias`
--

INSERT INTO `categorias` (`id`, `nome`, `ativo`) VALUES
(1, 'Pães', 1),
(2, 'Doces', 1),
(3, 'Salgados', 1),
(4, 'Bebidas', 1),
(5, 'Lactatos', 1),
(6, 'Farinha', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `configuracoes`
--

CREATE TABLE `configuracoes` (
  `chave` varchar(100) NOT NULL,
  `valor` text DEFAULT NULL,
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `configuracoes`
--

INSERT INTO `configuracoes` (`chave`, `valor`, `atualizado_em`) VALUES
('logo_path', NULL, '2026-07-05 00:49:23'),
('nome_loja', 'Padaria Souza & Moraes', '2026-07-07 00:09:06'),
('slogan', 'Sistema de Gestão PDV', '2026-07-05 00:49:23');

-- --------------------------------------------------------

--
-- Estrutura para tabela `encomendas`
--

CREATE TABLE `encomendas` (
  `id` int(11) NOT NULL,
  `numero` int(11) NOT NULL,
  `cliente` varchar(100) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `data_entrega` date DEFAULT NULL,
  `sinal` decimal(10,2) DEFAULT 0.00,
  `observacoes` text DEFAULT NULL,
  `status` enum('pendente','pronto','entregue') DEFAULT 'pendente',
  `total` decimal(10,2) DEFAULT 0.00,
  `usuario_id` int(11) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `encomenda_itens`
--

CREATE TABLE `encomenda_itens` (
  `id` int(11) NOT NULL,
  `encomenda_id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 1,
  `preco` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estoque`
--

CREATE TABLE `estoque` (
  `id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `data` date NOT NULL,
  `periodo` enum('manha','tarde') DEFAULT 'manha',
  `inicial` int(11) NOT NULL DEFAULT 0,
  `produzido` int(11) NOT NULL DEFAULT 0,
  `vendido` int(11) NOT NULL DEFAULT 0,
  `minimo` int(11) NOT NULL DEFAULT 5,
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `estoque`
--

INSERT INTO `estoque` (`id`, `produto_id`, `data`, `periodo`, `inicial`, `produzido`, `vendido`, `minimo`, `atualizado_em`) VALUES
(1, 13, '2026-07-05', '', 6, 0, 4, 5, '2026-07-05 19:23:31'),
(2, 15, '2026-07-05', '', 12, 0, 0, 5, '2026-07-05 14:38:40'),
(3, 19, '2026-07-05', '', 6, 0, 0, 5, '2026-07-05 14:38:40'),
(4, 14, '2026-07-05', '', 12, 0, 0, 5, '2026-07-05 14:38:40'),
(5, 16, '2026-07-05', '', 12, 0, 0, 5, '2026-07-05 14:38:40'),
(6, 17, '2026-07-05', '', 24, 0, 0, 5, '2026-07-05 14:38:40'),
(7, 18, '2026-07-05', '', 27, 0, 0, 5, '2026-07-05 14:38:40'),
(8, 8, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(9, 20, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(10, 6, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(11, 5, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(12, 2, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(13, 3, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(14, 4, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(15, 1, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(16, 7, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(17, 9, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(18, 10, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(19, 11, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(20, 12, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:38:40'),
(36, 22, '2026-07-05', '', 0, 0, 0, 5, '2026-07-05 14:43:46'),
(37, 21, '2026-07-05', '', 10, 0, 0, 5, '2026-07-05 14:43:46'),
(43, 13, '2026-07-06', '', 2, 0, 0, 5, '2026-07-06 11:55:16'),
(44, 15, '2026-07-06', '', 12, 0, 1, 5, '2026-07-07 00:53:19'),
(45, 19, '2026-07-06', '', 6, 0, 1, 5, '2026-07-07 00:53:19'),
(46, 14, '2026-07-06', '', 12, 0, 1, 5, '2026-07-07 00:53:19'),
(47, 16, '2026-07-06', '', 12, 0, 1, 5, '2026-07-07 00:53:32'),
(48, 17, '2026-07-06', '', 24, 0, 1, 5, '2026-07-07 00:53:32'),
(49, 18, '2026-07-06', '', 27, 0, 1, 5, '2026-07-07 00:53:32'),
(50, 8, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(51, 20, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(52, 6, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(53, 5, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(54, 2, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(55, 3, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(56, 4, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(57, 1, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(58, 7, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(59, 9, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(60, 10, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(61, 11, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(62, 12, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(63, 22, '2026-07-06', '', 0, 0, 0, 5, '2026-07-06 11:55:16'),
(64, 21, '2026-07-06', '', 10, 0, 0, 5, '2026-07-06 11:55:16');

-- --------------------------------------------------------

--
-- Estrutura para tabela `fluxo_caixa`
--

CREATE TABLE `fluxo_caixa` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `tipo` enum('entrada','saida') NOT NULL,
  `descricao` varchar(200) NOT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `forma` varchar(30) DEFAULT NULL,
  `valor` decimal(10,2) NOT NULL,
  `data` date NOT NULL,
  `gerado_auto` tinyint(1) NOT NULL DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `fluxo_caixa`
--

INSERT INTO `fluxo_caixa` (`id`, `usuario_id`, `tipo`, `descricao`, `categoria`, `forma`, `valor`, `data`, `gerado_auto`, `criado_em`) VALUES
(1, 1, 'entrada', 'Venda #1000', 'vendas', 'dinheiro', 29.70, '2026-07-05', 1, '2026-07-05 17:12:10'),
(2, 1, 'entrada', 'Venda #1001', 'vendas', 'dinheiro', 9.90, '2026-07-05', 1, '2026-07-05 19:23:31'),
(3, 1, 'entrada', 'Venda #1002', 'vendas', 'pix', 17.90, '2026-07-06', 1, '2026-07-07 00:53:19'),
(4, 1, 'entrada', 'Venda #1003', 'vendas', 'pix', 11.50, '2026-07-06', 1, '2026-07-07 00:53:32');

-- --------------------------------------------------------

--
-- Estrutura para tabela `perdas`
--

CREATE TABLE `perdas` (
  `id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 1,
  `motivo` enum('queimado','vencido','danificado','sobra') NOT NULL,
  `data` date NOT NULL,
  `periodo` enum('manha','tarde') DEFAULT 'manha',
  `usuario_id` int(11) DEFAULT NULL,
  `obs` varchar(200) DEFAULT NULL,
  `custo_total` decimal(10,2) DEFAULT 0.00,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos`
--

CREATE TABLE `produtos` (
  `id` int(11) NOT NULL,
  `icone` varchar(10) DEFAULT '?',
  `nome` varchar(100) NOT NULL,
  `categoria_id` int(11) DEFAULT NULL,
  `preco` decimal(10,2) NOT NULL DEFAULT 0.00,
  `custo` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `produtos`
--

INSERT INTO `produtos` (`id`, `icone`, `nome`, `categoria_id`, `preco`, `custo`, `ativo`, `criado_em`) VALUES
(1, '🛒', 'Pão Françês', 1, 0.50, 0.00, 1, '2026-07-05 00:58:01'),
(2, '🛒', 'Pão Doce Cocô', 1, 0.50, 0.00, 1, '2026-07-05 00:58:16'),
(3, '🛒', 'Pão Doce Creme', 1, 0.50, 0.00, 1, '2026-07-05 00:58:30'),
(4, '🛒', 'Pão Doce Gelo', 1, 0.50, 0.00, 1, '2026-07-05 00:58:45'),
(5, '🛒', 'Pão Carteira', 1, 0.50, 0.00, 1, '2026-07-05 00:59:04'),
(6, '🛒', 'Pão Brote', 1, 0.50, 0.00, 1, '2026-07-05 00:59:15'),
(7, '🛒', 'Catupiry', 3, 35.00, 0.00, 1, '2026-07-05 00:59:38'),
(8, '🛒', 'Olho de Sogra', 2, 35.00, 0.00, 1, '2026-07-05 00:59:52'),
(9, '🛒', 'Coxinha', 3, 4.50, 0.00, 1, '2026-07-05 01:00:01'),
(10, '🛒', 'Pastel Carne', 3, 4.50, 0.00, 1, '2026-07-05 01:00:23'),
(11, '🛒', 'Pastel Forno Frango', 3, 4.50, 0.00, 1, '2026-07-05 01:00:49'),
(12, '🛒', 'Pastel Misto', 3, 4.50, 0.00, 1, '2026-07-05 01:01:06'),
(13, '🛒', 'Coca Cola 1 L', 4, 9.90, 0.00, 1, '2026-07-05 01:01:48'),
(14, '🛒', 'Coca Cola Zero 250ml', 4, 4.50, 0.00, 1, '2026-07-05 01:02:09'),
(15, '🛒', 'Coca Cola 250ml', 4, 4.50, 0.00, 1, '2026-07-05 01:02:25'),
(16, '🛒', 'Fanta Uva', 4, 4.50, 0.00, 1, '2026-07-05 01:02:39'),
(17, '🛒', 'Guaraná 250ml', 4, 3.50, 0.00, 1, '2026-07-05 01:02:56'),
(18, '🛒', 'Toddinho', 4, 3.50, 0.00, 1, '2026-07-05 01:03:08'),
(19, '🛒', 'Coca Cola 600ml', 4, 8.90, 0.00, 1, '2026-07-05 01:03:26'),
(20, '🛒', 'Queijo Coalho', 5, 40.00, 0.00, 1, '2026-07-05 01:03:51'),
(21, '🛒', 'Torrada', 1, 4.00, 0.00, 1, '2026-07-05 14:40:42'),
(22, '🛒', 'Torada Doce', 1, 4.00, 0.00, 1, '2026-07-05 14:40:55'),
(23, '🛒', 'Farinha de Rosca', 6, 12.00, 0.00, 1, '2026-07-05 14:44:49');

-- --------------------------------------------------------

--
-- Estrutura para tabela `sequencias`
--

CREATE TABLE `sequencias` (
  `chave` varchar(50) NOT NULL,
  `valor` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `sequencias`
--

INSERT INTO `sequencias` (`chave`, `valor`) VALUES
('encomenda', 1),
('pedido', 1004);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `role` enum('admin','operador') NOT NULL DEFAULT 'operador',
  `permissoes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '["caixa"]' CHECK (json_valid(`permissoes`)),
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `username`, `senha_hash`, `role`, `permissoes`, `ativo`, `criado_em`) VALUES
(1, 'Administrador', 'admin', '$2a$10$8KrK3/S7a23b1eDwAIMKgei0OKuhbHcFebnzmYdeXa6yCbMHzdy66', 'admin', '[\"caixa\",\"encomendas\",\"estoque\",\"fluxo\",\"rel\",\"produtos\"]', 1, '2026-07-05 00:50:10'),
(2, 'Isadora Karem', 'isa', '$2a$10$KJYqI9XR3/Dxuo30/2eBK.BKJX63PNUfXBhmMvq/tnRZT18TknhSy', 'operador', '[\"caixa\",\"encomendas\"]', 1, '2026-07-05 00:52:37');

-- --------------------------------------------------------

--
-- Estrutura para tabela `vendas`
--

CREATE TABLE `vendas` (
  `id` int(11) NOT NULL,
  `numero` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `desconto` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `forma_pagamento` varchar(20) NOT NULL DEFAULT 'dinheiro',
  `valor_recebido` decimal(10,2) DEFAULT NULL,
  `troco` decimal(10,2) DEFAULT NULL,
  `status` enum('ativa','cancelada') NOT NULL DEFAULT 'ativa',
  `cancelado_por` int(11) DEFAULT NULL,
  `cancelado_em` timestamp NULL DEFAULT NULL,
  `motivo_cancel` varchar(200) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `vendas`
--

INSERT INTO `vendas` (`id`, `numero`, `usuario_id`, `subtotal`, `desconto`, `total`, `forma_pagamento`, `valor_recebido`, `troco`, `status`, `cancelado_por`, `cancelado_em`, `motivo_cancel`, `criado_em`) VALUES
(8, 1000, 1, 29.70, 0.00, 29.70, 'dinheiro', 0.00, 0.00, 'ativa', NULL, NULL, NULL, '2026-07-05 17:12:10'),
(10, 1001, 1, 9.90, 0.00, 9.90, 'dinheiro', 0.00, 0.00, 'ativa', NULL, NULL, NULL, '2026-07-05 19:23:31'),
(11, 1002, 1, 17.90, 0.00, 17.90, 'pix', 17.90, 0.00, 'ativa', NULL, NULL, NULL, '2026-07-07 00:53:19'),
(12, 1003, 1, 11.50, 0.00, 11.50, 'pix', 11.50, 0.00, 'ativa', NULL, NULL, NULL, '2026-07-07 00:53:32');

-- --------------------------------------------------------

--
-- Estrutura para tabela `venda_itens`
--

CREATE TABLE `venda_itens` (
  `id` int(11) NOT NULL,
  `venda_id` int(11) NOT NULL,
  `produto_id` int(11) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `icone` varchar(10) DEFAULT NULL,
  `preco_unit` decimal(10,2) NOT NULL,
  `quantidade` int(11) NOT NULL DEFAULT 1,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `venda_itens`
--

INSERT INTO `venda_itens` (`id`, `venda_id`, `produto_id`, `nome`, `icone`, `preco_unit`, `quantidade`, `subtotal`) VALUES
(1, 8, 13, 'Coca Cola 1 L', '🛒', 9.90, 3, 29.70),
(2, 10, 13, 'Coca Cola 1 L', '🛒', 9.90, 1, 9.90),
(3, 11, 14, 'Coca Cola Zero 250ml', '🛒', 4.50, 1, 4.50),
(4, 11, 15, 'Coca Cola 250ml', '🛒', 4.50, 1, 4.50),
(5, 11, 19, 'Coca Cola 600ml', '🛒', 8.90, 1, 8.90),
(6, 12, 16, 'Fanta Uva', '🛒', 4.50, 1, 4.50),
(7, 12, 17, 'Guaraná 250ml', '🛒', 3.50, 1, 3.50),
(8, 12, 18, 'Toddinho', '🛒', 3.50, 1, 3.50);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tabela` (`tabela`,`registro_id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_criado` (`criado_em`);

--
-- Índices de tabela `caixa_movimentos`
--
ALTER TABLE `caixa_movimentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `caixa_turnos`
--
ALTER TABLE `caixa_turnos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_turno_unico` (`data`,`periodo`,`status`),
  ADD KEY `aberto_por` (`aberto_por`),
  ADD KEY `fechado_por` (`fechado_por`);

--
-- Índices de tabela `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);

--
-- Índices de tabela `configuracoes`
--
ALTER TABLE `configuracoes`
  ADD PRIMARY KEY (`chave`);

--
-- Índices de tabela `encomendas`
--
ALTER TABLE `encomendas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_encomendas_entrega` (`data_entrega`),
  ADD KEY `idx_encomendas_status` (`status`);

--
-- Índices de tabela `encomenda_itens`
--
ALTER TABLE `encomenda_itens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `encomenda_id` (`encomenda_id`);

--
-- Índices de tabela `estoque`
--
ALTER TABLE `estoque`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_produto_data` (`produto_id`,`data`),
  ADD UNIQUE KEY `estoque_unico` (`produto_id`,`data`,`periodo`),
  ADD KEY `idx_estoque_data` (`data`,`periodo`);

--
-- Índices de tabela `fluxo_caixa`
--
ALTER TABLE `fluxo_caixa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_fluxo_data` (`data`);

--
-- Índices de tabela `perdas`
--
ALTER TABLE `perdas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produto_id` (`produto_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `produtos`
--
ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `categoria_id` (`categoria_id`);

--
-- Índices de tabela `sequencias`
--
ALTER TABLE `sequencias`
  ADD PRIMARY KEY (`chave`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Índices de tabela `vendas`
--
ALTER TABLE `vendas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `cancelado_por` (`cancelado_por`),
  ADD KEY `idx_vendas_data` (`criado_em`),
  ADD KEY `idx_vendas_status` (`status`);

--
-- Índices de tabela `venda_itens`
--
ALTER TABLE `venda_itens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produto_id` (`produto_id`),
  ADD KEY `idx_venda_itens` (`venda_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT de tabela `caixa_movimentos`
--
ALTER TABLE `caixa_movimentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `caixa_turnos`
--
ALTER TABLE `caixa_turnos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `encomendas`
--
ALTER TABLE `encomendas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `encomenda_itens`
--
ALTER TABLE `encomenda_itens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estoque`
--
ALTER TABLE `estoque`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT de tabela `fluxo_caixa`
--
ALTER TABLE `fluxo_caixa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `perdas`
--
ALTER TABLE `perdas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `vendas`
--
ALTER TABLE `vendas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de tabela `venda_itens`
--
ALTER TABLE `venda_itens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `caixa_movimentos`
--
ALTER TABLE `caixa_movimentos`
  ADD CONSTRAINT `caixa_movimentos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `caixa_turnos`
--
ALTER TABLE `caixa_turnos`
  ADD CONSTRAINT `caixa_turnos_ibfk_1` FOREIGN KEY (`aberto_por`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `caixa_turnos_ibfk_2` FOREIGN KEY (`fechado_por`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `encomendas`
--
ALTER TABLE `encomendas`
  ADD CONSTRAINT `encomendas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `encomenda_itens`
--
ALTER TABLE `encomenda_itens`
  ADD CONSTRAINT `encomenda_itens_ibfk_1` FOREIGN KEY (`encomenda_id`) REFERENCES `encomendas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `estoque`
--
ALTER TABLE `estoque`
  ADD CONSTRAINT `estoque_ibfk_1` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `fluxo_caixa`
--
ALTER TABLE `fluxo_caixa`
  ADD CONSTRAINT `fluxo_caixa_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `perdas`
--
ALTER TABLE `perdas`
  ADD CONSTRAINT `perdas_ibfk_1` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `perdas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `produtos`
--
ALTER TABLE `produtos`
  ADD CONSTRAINT `produtos_ibfk_1` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `vendas`
--
ALTER TABLE `vendas`
  ADD CONSTRAINT `vendas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `vendas_ibfk_2` FOREIGN KEY (`cancelado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `venda_itens`
--
ALTER TABLE `venda_itens`
  ADD CONSTRAINT `venda_itens_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `venda_itens_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
