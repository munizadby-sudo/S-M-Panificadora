# Registro de Decisões de Arquitetura (ADRs) — Padaria PDV

Este documento registra as decisões de arquitetura mais relevantes tomadas durante a concepção e o desenvolvimento do backend do sistema de Ponto de Venda (PDV) para Padarias. Cada registro segue a estrutura padrão de contexto, decisão e consequências.

---

## ADR 01: Escolha do Node.js como Ambiente de Execução do Backend
**Status:** Aprovado

### Contexto
A padaria necessita de um sistema de PDV que responda com baixíssima latência para garantir que as transações na frente de caixa ocorram sem travamentos ou lentidões que possam gerar filas. O desenvolvedor responsável possui forte domínio em JavaScript/TypeScript e tecnologias web modernas.

### Decisão
Adotar o Node.js como o ambiente de execução do backend, utilizando Express como framework para a construção da API REST. Essa escolha permite uma arquitetura baseada em eventos não-bloqueantes, otimizando o consumo de memória e a velocidade de resposta nas requisições.

### Consequências
* **Pontos Positivos:** Respostas rápidas da API, facilidade de integração com bibliotecas de validação, criptografia e manipulação de banco de dados SQL através de ORMs/Query Builders. Curva de aprendizado reduzida.
* **Pontos Negativos:** Sendo single-threaded por padrão, processos pesados de processamento de imagem ou relatórios analíticos massivos exigem cuidado de design para não bloquear o loop de eventos.

---

## ADR 02: Autenticação Baseada em Stateless JSON Web Tokens (JWT)
**Status:** Aprovado

### Contexto
O sistema de PDV precisa ser escalável e seguro, impedindo o acesso não autorizado à API sem sobrecarregar o servidor com gerenciamento de sessões em memória (Sessions baseadas em cookies).

### Decisão
Implementar autenticação stateless utilizando JWT (JSON Web Tokens). Após o login bem-sucedido, o servidor emite um token assinado digitalmente contendo o ID do usuário e seu cargo. Esse token deve ser enviado no cabeçalho `Authorization` das requisições subsequentes e validado por um middleware central (`auth.js`).

### Consequências
* **Pontos Positivos:** O servidor não precisa armazenar sessões em memória, facilitando a escalabilidade horizontal. A validação do token é extremamente rápida e auto-contida.
* **Pontos Negativos:** Dificuldade inerente em revogar tokens individuais de forma imediata antes do seu vencimento natural, a menos que se implemente uma lista de bloqueio (blacklist) temporária.

---

## ADR 03: Controle de Acesso Baseado em Perfis (RBAC — Role-Based Access Control)
**Status:** Aprovado

### Contexto
O sistema será operado por diferentes atores: Administradores, Gerentes e Operadores de Caixa. Operações críticas (como alteração de preço de produtos, visualização de margens de lucro ou exclusão de registros) não podem estar acessíveis aos operadores para evitar fraudes ou erros operacionais.

### Decisão
Adotar um modelo de controle de acesso baseado em papéis (RBAC). A tabela de usuários armazenará o papel atribuído (`cargo`), e um middleware dedicado (`permission.js`) interceptará as rotas restritas, decodificando o JWT do usuário e liberando ou bloqueando o acesso com base em uma lista de cargos autorizados para aquela rota.

### Consequências
* **Pontos Positivos:** Garantia de segurança operacional; facilidade para auditar quem tem acesso a quais recursos; separação clara de responsabilidades no código do backend.
* **Pontos Negativos:** A adição de novas funcionalidades ou rotas exige sempre a definição explícita do middleware de permissão, sob o risco de expor rotas sensíveis caso o desenvolvedor esqueça de configurá-lo.

---

## ADR 04: Isolamento e Validação de Sessão de Caixa (Middleware exigirCaixaAberto)
**Status:** Aprovado

### Contexto
Em operações de varejo e panificação, o dinheiro físico em gaveta deve ser rastreado meticulosamente. Vendas, sangrias ou suprimentos realizados fora de um turno de caixa ativo quebram a conciliação financeira do fechamento do dia.

### Decisão
Desenvolver e aplicar o middleware `exigirCaixaAberto.js` em todas as rotas operacionais e financeiras de venda e movimentação física de caixa. Esse middleware consulta o banco de dados buscando um registro na tabela `caixas` com o status "aberto" associado ao operador logado. Se não houver caixa ativo, a requisição é abortada imediatamente com erro HTTP 403.

### Consequências
* **Pontos Positivos:** Previne furos financeiros e transações "fantasmas"; garante que cada venda do sistema esteja necessariamente vinculada a uma sessão de caixa auditável, mantendo a integridade contábil.
* **Pontos Negativos:** Cria uma consulta de banco de dados adicional a cada venda, o que requer otimização via indexação de chaves (como o ID do usuário e o status do caixa) na tabela `caixas`.

---

## ADR 05: Proteção Contra Brute-Force e Abuso com Limitador de Taxas (Rate Limiting)
**Status:** Aprovado

### Contexto
As credenciais dos usuários do PDV são as chaves de acesso a dados financeiros e ao estoque. Ataques de força bruta nas rotas de login representam um risco real à integridade e à disponibilidade do sistema backend.

### Decisão
Configurar e aplicar um limitador de requisições por IP nas rotas sensíveis do sistema, especialmente na rota pública de login. O middleware `rateLimiter.js` definirá um teto de requisições permitidas em uma janela de tempo (ex: no máximo 5 tentativas de login a cada 15 minutos por endereço IP).

### Consequências
* **Pontos Positivos:** Protege o sistema contra ataques automatizados de força bruta e mitiga potenciais ataques distribuídos de negação de serviço (DDoS) que tentem sobrecarregar o processo de hashing de senhas.
* **Pontos Negativos:** Operadores legítimos que errarem repetidamente suas senhas serão bloqueados temporariamente, exigindo suporte administrativo ou um mecanismo amigável de recuperação de acesso.

---

## ADR 06: Validação Estrita de Payloads (Validação de Esquemas no Middleware)
**Status:** Aprovado

### Contexto
A falta de validação de dados de entrada pode gerar erros inesperados de runtime no Node.js ou corromper o banco de dados relacional (por exemplo, aceitar quantidades negativas de produtos ou preços de venda inválidos no carrinho de compras).

### Decisão
Criar o middleware `validacao.js` integrado com bibliotecas de validação de esquemas (como Joi ou Zod). Todas as requisições de criação ou atualização (POST, PUT, PATCH) de recursos devem passar por esse validador para assegurar que os tipos, tamanhos e regras numéricas de cada campo obedeçam ao contrato estabelecido antes mesmo de tocar as camadas de serviço ou banco de dados.

### Consequências
* **Pontos Positivos:** Segurança contra injeção de dados corrompidos; respostas de erro claras e automáticas para o frontend informando quais campos falharam na validação; menor quantidade de código de checagem condicional (ifs) dentro dos controladores de negócios.
* **Pontos Negativos:** Pequeno aumento inicial no tempo de desenvolvimento para escrever os schemas estruturados para cada recurso do sistema.
