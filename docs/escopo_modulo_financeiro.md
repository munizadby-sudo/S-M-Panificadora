# Documento de Escopo: Módulo Financeiro e de Controle de Caixa (v2.0)

Este documento estabelece as fronteiras, os requisitos, as regras de negócio e a fundamentação arquitetural para a reestruturação e implementação das novas capacidades do módulo de **Controle de Caixa e Fluxo Financeiro** do sistema **Padaria PDV v2.0** (Panificadora Souza).

---

## 1. Visão Geral e Objetivos

O sistema `padaria-pdv` atualmente utiliza um modelo fortemente acoplado, onde rotas do Express executam consultas SQL diretamente através do driver `mysql2`. O objetivo deste escopo é reestruturar o módulo financeiro aplicando os princípios de **Arquitetura Limpa (Clean Architecture)** e **ISOLAMENTO de Domínio**, garantindo que as regras de fechamento de turnos e fluxo de caixa permaneçam portáveis, testáveis e seguras contra mudanças de infraestrutura.

### Objetivos Técnicos e de Negócio:
* **Isolamento de Regras de Negócio:** Garantir que cálculos de quebra de caixa, totais de sangria e conciliações matemáticas ocorram de forma totalmente isolada de bibliotecas de terceiros ou frameworks.
* **Desacoplamento de Infraestrutura (MySQL):** Substituir as queries brutas presentes nos controladores/rotas por adaptadores de repositórios padronizados.
* **Testabilidade Avançada:** Permitir que as rotas e casos de uso sejam testados utilizando dublês de teste (Mocks/In-Memory) por meio do ecossistema de testes **Jest** já instalado no projeto.

---

## 2. Escopo Funcional (O que o sistema VAI fazer)

### 🔹 2.1. Camada de Domínio (Domain - Regras Puras)
Definição de entidades puras em JavaScript (ES6) livre de dependências externas:

* **Entidade `CaixaMovimento`:**
  * Representação lógica das ações de abertura e fechamento de caixa.
  * Validações obrigatórias: consistência de valores monetários (rejeitar valores negativos) e presença do operador (`usuario_id`).
  * Regra de Negócio: Cálculo automatizado de diferença/quebra de caixa:
    $$\text{Esperado} = \text{Valor Inicial} + \text{Total de Vendas} - \text{Total de Sangrias}$$
    $$\text{Diferenca} = \text{Valor Contado} - \text{Valor Esperado}$$

* **Entidade `CaixaTurno`:**
  * Gestão do estado lógico do turno atual de trabalho (Aberto, Fechado, Em Pausa).
  * Consistência de estados: Não permitir a abertura de um turno novo se já houver um ativo no sistema.

---

### 🔹 2.2. Camada de Aplicação (Application - Casos de Uso)
Mapeamento dos fluxos de operação do sistema por meio de Casos de Uso bem definidos:

* **Caso de Uso `AbrirCaixa` (`AbrirCaixa.js`):**
  * Orquestra a verificação de turnos abertos.
  * Instancia um novo `CaixaMovimento` do tipo `'abertura'`.
  * Registra a transação de abertura no repositório.

* **Caso de Uso `FecharCaixa` (`FecharCaixa.js`):**
  * Recupera o saldo inicial a partir do último movimento de abertura.
  * Consulta as vendas ativas do período correspondente.
  * Consulta as sangrias (saídas manuais geradas pelo fluxo de caixa).
  * Executa os cálculos matemáticos de fechamento delegados à entidade de Domínio.
  * Salva o registro final contendo o valor esperado, valor contado e a diferença apurada.

---

### 🔹 2.3. Camada de Infraestrutura (Infrastructure - Detalhes de Implementação)
Substituição direta do código acoplado por adaptadores de infraestrutura:

* **Adaptadores de Banco de Dados (`infrastructure/database/`):**
  * Criação do `MySQLCaixaRepository.js` que implementará a interface necessária para consultar e salvar as movimentações de caixa utilizando o pool de conexões do arquivo `db.js`.
  * Criação do `JSONCaixaRepository.js` para servir de fallback local ou simulação em desenvolvimento sem requerer banco MySQL rodando.

* **Rotas e Controladores de Entrada (`routes/caixa.js`):**
  * Simplificação total dos endpoints `/status`, `/abrir` e `/fechar`.
  * As rotas deixam de fazer consultas diretas via `db.execute()`. Passam a apenas instanciar o Caso de Uso, injetar o repositório MySQL e repassar os parâmetros recebidos no `req.body`.

---

## 3. Requisitos Não-Funcionais

* **Portabilidade de Regras:** Todas as regras da camada de `domain` e `application` devem ser escritas de modo a serem facilmente portáveis para qualquer outra linguagem orientada a objetos (TypeScript, PHP, C# ou VBA), mantendo a integridade sem requerer reescrita da lógica.
* **Desempenho de Query:** Toda agregação matemática realizada pelo banco (MySQL) no fluxo de fechamento (soma de totais de vendas e sangrias) deve utilizar índices eficientes pela coluna `criado_em` e `status` para responder em sub-100ms.
* **Garantia Transacional (ACID):** O fechamento de caixa deve rodar dentro de uma transação SQL (`START TRANSACTION` ... `COMMIT`), garantindo que se a inserção falhar em qualquer etapa, nenhum registro inconsistente permaneça no banco.

---

## 4. Fora de Escopo

* **Migração do Código Existente para TS:** Embora o projeto use TypeScript de forma complementar, a refatoração imediata desse módulo manterá o JavaScript (ES6) nativo para evitar quebra de compatibilidade com as rotas que não serão alteradas nesta iteração.
* **Integração com Emissão de NFC-e:** O processo de emissão de cupom fiscal não faz parte desta refatoração de caixa.
* **Módulo Multi-loja:** O suporte a múltiplos caixas concorrentes em bancos separados permanece fora do escopo atual.

---

## 5. Próximas Etapas (Fluxo de Trabalho)

1. **Aprovação do Escopo (Este Documento - .md).**
2. **Desenvolvimento do PRD (Product Requirement Document):** Detalhar detalhadamente as regras de negócio de quebra e as permissões de usuário.
3. **Especificação Técnica (SPEC):** Desenhar o novo modelo de dados (SQL) e o diagrama de classes das entidades desacopladas.
