# 🥖 Padaria PDV

Sistema de ponto de venda (PDV) e gestão para padarias, construído do zero para resolver um problema real de operação diária: **controlar venda, estoque, caixa e encomendas de uma padaria de bairro sem depender de planilha e papel.**

> Projeto em produção, usado na operação real da Panificadora Souza (Campina Grande - PB).

---

## 📌 O problema

Padarias pequenas e médias no Brasil costumam operar com uma combinação frágil de caderno, planilha e memória do dono. Isso gera problemas recorrentes:

- **Estoque sem controle real** — sobra e falta de insumo/produto sem visibilidade, perdas não registradas.
- **Caixa sem rastreabilidade** — sem separação por turno/operador, é difícil saber quem fechou o caixa com diferença e quando.
- **Vendas sem histórico consistente** — sem dado confiável não dá pra saber o que vende mais, em que horário, por qual forma de pagamento.
- **Encomendas soltas** — pedidos por WhatsApp/caderno que se perdem ou são esquecidos.

O Padaria PDV nasceu para substituir esse fluxo manual por um sistema web simples, rodando em um computador comum da loja, sem depender de infraestrutura cara ou de internet de alta qualidade.

---

## ✅ O que o sistema faz hoje

| Módulo | Funcionalidade |
|---|---|
| **PDV / Caixa** | Venda com múltiplas formas de pagamento, abertura/fechamento de caixa por turno, controle de diferença de caixa |
| **Produtos & Categorias** | Cadastro, precificação, ativação/desativação |
| **Estoque** | Registro diário por produto, com **carryover automático** do saldo do fechamento anterior |
| **Encomendas** | Cadastro, itens, status e histórico de pedidos de clientes |
| **Fluxo de caixa** | Entradas e saídas manuais (contas, retiradas, despesas) |
| **Perdas** | Registro de quebra/perda de produto, com motivo |
| **Usuários & Permissões** | Login com JWT, papéis `admin`/`operador`, permissões granulares por módulo |
| **Auditoria** | Log de toda ação sensível (quem, quando, o que mudou) |
| **Configurações** | Nome da loja, logotipo, parâmetros gerais |

### Em desenvolvimento
- **Módulo de Funcionários e Folha de Pagamento** — cadastro de funcionários, pagamento quinzenal, vale, controle de falta, atestado e hora extra. Veja a proposta completa em [`docs/PRD-modulo-funcionarios.md`](docs/PRD-modulo-funcionarios.md).

---

## 🖼️ Screenshots

> _Adicione aqui prints das telas principais: PDV/Caixa, Estoque, Encomendas, Relatórios. Recomendo salvar em `docs/screenshots/` e referenciar como abaixo._

```md
[Tela de Caixa](docs/screenshots/caixa.png)
[Controle de Estoque](docs/screenshots/estoque.png)
[Encomendas](docs/screenshots/encomendas.png)
```

---

## 🏗️ Stack técnica

**Backend**
- Node.js + Express
- MySQL (`mysql2`, pool de conexões)
- JWT (`jsonwebtoken`) para autenticação stateless
- `bcryptjs` para hash de senha
- `helmet` (CSP, HSTS), `cors` com whitelist, `express-rate-limit` no login
- `express-validator` para validação de entrada
- `winston` para logging estruturado
- `multer` para upload de logotipo
- TypeScript configurado (`tsc`) para checagem de tipos gradual
- Testes com `jest` + `supertest`

**Frontend**
- HTML/CSS/JS puro (vanilla), sem framework — proposital, para rodar leve em qualquer PC de loja sem build step
- Consumo de API via `fetch` centralizado em `api.js`

**Arquitetura**
- API REST, autenticação via JWT em `Authorization: Bearer`
- Permissões por módulo, checadas em middleware (`temPermissao`)
- Transações de banco garantindo integridade em operações críticas (ex: venda = baixa de estoque + registro de venda + itens, tudo ou nada)
- Auditoria automática de criação/edição/exclusão em tabelas sensíveis

Veja o detalhamento completo em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) e as decisões de design registradas em [`docs/adr/`](docs/adr/).

---

## 📁 Estrutura do projeto

```
padaria-pdv/
├── backend/
│   ├── server.js              # bootstrap da aplicação
│   ├── database/
│   │   ├── db.js              # pool de conexão MySQL
│   │   └── padaria.sql        # schema completo
│   ├── routes/                # um arquivo por recurso REST
│   ├── services/               # regras de negócio (venda, turno de caixa, auditoria)
│   ├── middlewares/            # auth, permissão, rate limit, validação, erro
│   └── tests/
├── frontend/
│   ├── login.html
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── api.js              # chamadas HTTP centralizadas
│       ├── app.js              # lógica das telas
│       ├── auth.js             # sessão e permissões
│       └── utils.js
└── docs/
    ├── ARCHITECTURE.md
    ├── PRD-modulo-funcionarios.md
    ├── SPEC-modulo-funcionarios.md
    └── adr/                     # Architecture Decision Records
```

---

## ⚡ Rodando localmente

### Pré-requisitos
- Node.js 18+
- MySQL 8.0+

### 1. Banco de dados
```bash
mysql -u root -p < backend/database/padaria.sql
```

### 2. Variáveis de ambiente
```bash
cd backend
cp .env.example .env
```
Preencha `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` e um `JWT_SECRET` forte (string aleatória longa — **nunca** use um valor padrão em produção).

### 3. Instalar e rodar
```bash
npm install
npm run dev      # com nodemon, ambiente de desenvolvimento
# ou
npm start        # produção
```

O servidor sobe em `http://localhost:3000` e já serve o frontend estático.

### 4. Testes
```bash
npm test
npm run test:coverage
```

---

## 🔐 Segurança

O projeto passou por uma rodada de auditoria e hardening, incluindo:
- Eliminação de secret padrão de JWT em produção (o processo aborta se `JWT_SECRET` não estiver configurado)
- CSP habilitada via `helmet`
- CORS restrito por whitelist de origem
- Rate limiting no endpoint de login (proteção contra força bruta)
- Transações de banco em operações que envolvem múltiplas tabelas (venda, estoque)
- Log de auditoria para ações administrativas

Detalhes de cada decisão em [`docs/adr/`](docs/adr/).

---

## 🗺️ Roadmap

- [x] PDV com controle de turno de caixa
- [x] Estoque diário com carryover automático
- [x] Hardening de segurança (CORS, CSP, rate limit, JWT)
- [ ] Módulo de Funcionários e Folha de Pagamento (quinzenal, vale, falta, atestado, hora extra) — PRD pronta
- [ ] Relatórios gerenciais (curva ABC de produtos, DRE simplificado)
- [ ] Migração incremental para TypeScript

---

## 👤 Autor

**Adby Souza**
Análise e Desenvolvimento de Sistemas | Campina Grande - PB
