# 🥖 Padaria PDV v2.0

Sistema PDV completo para padarias com Node.js + MySQL + HTML/CSS/JS.

---

## 📁 Estrutura completa — onde colocar cada arquivo

```
padaria-pdv/
│
├── backend/                          ← pasta do servidor Node.js
│   ├── server.js                     ← ponto de entrada: node server.js
│   ├── package.json
│   ├── .env                          ← crie a partir do .env.example
│   ├── .env.example
│   │
│   ├── database/
│   │   ├── db.js                     ← pool de conexão MySQL
│   │   └── padaria.sql               ← execute isso no MySQL primeiro
│   │
│   ├── routes/
│   │   ├── auth.js                   ← POST /api/auth/login
│   │   ├── produtos.js               ← GET/POST/PUT/DELETE /api/produtos
│   │   ├── categorias.js             ← GET/POST/DELETE /api/categorias
│   │   ├── vendas.js                 ← GET/POST/DELETE /api/vendas
│   │   ├── encomendas.js             ← CRUD /api/encomendas
│   │   ├── estoque.js                ← GET/POST /api/estoque
│   │   ├── fluxo.js                  ← CRUD /api/fluxo
│   │   ├── usuarios.js               ← CRUD /api/usuarios
│   │   ├── configuracoes.js          ← GET/PUT/POST /api/config
│   │   ├── perdas.js                 ← CRUD /api/perdas (NOVO)
│   │   └── caixa.js                  ← abertura/fechamento (NOVO)
│   │
│   ├── services/
│   │   ├── vendaService.js           ← lógica de venda com transação completa
│   │   └── auditService.js           ← gravação de audit_log
│   │
│   ├── middlewares/
│   │   ├── auth.js                   ← gerarToken, autenticar, apenasAdmin
│   │   ├── permission.js             ← temPermissao('modulo')
│   │   ├── rateLimiter.js            ← proteção brute force no login
│   │   └── errorHandler.js           ← handler global de erros
│   │
│   ├── uploads/                      ← logos enviadas (criada automaticamente)
│   └── logs/                         ← pasta para logs futuros
│
└── frontend/                         ← pasta dos arquivos HTML/CSS/JS
    ├── login.html                    ← tela de login
    ├── index.html                    ← tela principal (PDV)
    │
    ├── css/
    │   └── style.css                 ← todos os estilos
    │
    └── js/
        ├── utils.js                  ← fmtR, hoje, showToast, baixarCSV
        ├── api.js                    ← todas as chamadas HTTP centralizadas
        ├── auth.js                   ← boot, logout, temPermissao
        └── app.js                    ← lógica de todas as telas
```

---

## ⚡ Instalação passo a passo

### 1. Pré-requisitos
- Node.js 18+ → https://nodejs.org
- MySQL 8.0+ → https://dev.mysql.com/downloads/
- Git (opcional)

### 2. Criar e popular o banco de dados
```bash
# Entre no MySQL
mysql -u root -p

# Execute o schema
mysql -u root -p < backend/database/padaria.sql

# Ou dentro do MySQL:
source /caminho/para/backend/database/padaria.sql
```

### 3. Configurar variáveis de ambiente
```bash
cd backend

# Copie o modelo
cp .env.example .env

# Edite com seus dados
nano .env   # ou notepad .env no Windows
```

Conteúdo do `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha_mysql
DB_NAME=padaria
JWT_SECRET=cole_aqui_uma_string_aleatoria_longa_de_64_chars
PORT=3000
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:3000
```

> **Gerar JWT_SECRET seguro:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 4. Instalar dependências
```bash
cd backend
npm install
```

### 5. Iniciar o servidor
```bash
# Produção
npm start

# Desenvolvimento (reinicia ao salvar)
npm run dev
```

### 6. Acessar o sistema
Abra no navegador: **http://localhost:3000**

**Login padrão:**
- Usuário: `admin`
- Senha: `admin123`

> ⚠️ **Troque a senha imediatamente após o primeiro login!**

---

## 🔒 Segurança implementada

| Recurso | Descrição |
|---------|-----------|
| JWT | Token com expiração de 12h |
| bcrypt | Senhas com hash seguro |
| Helmet | Headers HTTP de segurança |
| CORS restrito | Apenas a origem configurada em `.env` |
| Rate Limit | 10 tentativas de login por 15 minutos |
| Permissões no backend | Cada rota verifica permissão do token |
| Soft delete | Vendas canceladas, não deletadas |
| Audit log | Toda ação importante é registrada |
| Transações SQL | Venda + estoque + fluxo em uma só transação |

---

## ✅ Correções aplicadas em relação à versão anterior

1. **Estoque** — não é mais debitado ao adicionar item no carrinho. Só deduz após `COBRAR` com sucesso.
2. **Vendas** — não são mais deletadas fisicamente. Usam `status = 'cancelada'` com motivo e estorno automático.
3. **Fluxo de caixa** — ao cancelar venda, a entrada automática é revertida com um lançamento de estorno.
4. **Transação atômica** — venda + itens + estoque + fluxo tudo na mesma `beginTransaction()`.
5. **Permissões no backend** — middleware `temPermissao()` aplicado em todas as rotas.
6. **Race condition** — número de pedido usa `SELECT ... FOR UPDATE` na mesma transação.
7. **CORS** — restrito ao `ALLOWED_ORIGIN` do `.env`.
8. **Rate limit** — 10 tentativas de login por 15 minutos.
9. **Helmet** — headers de segurança HTTP ativados.
10. **Map()** — lookups de produtos usam `Map` em vez de `array.find()` (O(1) vs O(n)).
11. **Campo `custo`** — adicionado a produtos para calcular margem de lucro.
12. **Campos padronizados** — `telefone` usado consistentemente em encomendas.

---

## 📦 Dependências (package.json)

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.6",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "express-rate-limit": "^7.3.1",
    "express-validator": "^7.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "mysql2": "^3.9.4"
  }
}
```

---

## 🗺️ Roadmap v3.0 (React + Vite)

O backend v2.0 já está pronto e não muda. A migração é 100% frontend:

```
npm create vite@latest frontend-v3 -- --template react
```

Tecnologias sugeridas:
- **React 18** + **Vite**
- **TanStack Query** — cache e sync com a API
- **Zustand** — estado do carrinho
- **shadcn/ui** — componentes acessíveis
- **Recharts** — gráficos nativos React
