# Isa Nails Design - Guia de Configuração e Execução (SETUP)

Guia prático para instalação, configuração de banco de dados, execução local, testes automatizados e solução de problemas.

Para uma visão detalhada da arquitetura em camadas, especificações de endpoints e tecnologias, consulte a [Documentação do Projeto (README.md)](README.md).

---

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:
- **Node.js**: versão 18 ou superior (`node -v`)
- **npm**: versão 9 ou superior (`npm -v`)
- **Git**

---

## 🛠️ Instalação Passo a Passo

### 1. Clonar o Repositório

```bash
git clone [url-do-repositorio]
cd isabele-nails-desing
```

---

### 2. Configurar e Inicializar o Backend

O backend utiliza **Fastify**, **Prisma ORM** e banco de dados **SQLite**.

```bash
# 1. Navegue até a pasta do backend
cd backend

# 2. Instale as dependências
npm install

# 3. Gere o Prisma Client com os modelos configurados
npm run db:generate

# 4. Sincronize o schema com o banco de dados SQLite (cria o arquivo prisma/dev.db)
npm run db:push

# 5. Popule o banco com os dados iniciais e usuários de demonstração
npm run db:seed

# 6. Inicie o servidor em modo de desenvolvimento (hot reload)
npm run dev
```

O servidor da API iniciará em: **`http://localhost:3333`**  
Verificação de integridade (Health check): **`http://localhost:3333/health`**

---

### 3. Configurar e Inicializar o Frontend

Abra um **novo terminal** para iniciar o frontend React:

```bash
# 1. Navegue até a pasta do frontend
cd frontend

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento Vite
npm run dev
```

A aplicação web estará disponível em: **`http://localhost:3000`**

---

## 🔐 Credenciais de Teste

O script de seed (`npm run db:seed`) cadastra automaticamente duas contas de demonstração:

| Perfil | Email | Senha | Nível de Acesso |
|---|---|---|---|
| **Administrador** | `admin@isa.com` | `admin123` | Acesso completo ao painel administrativo |
| **Cliente** | `cliente@teste.com` | `cliente123` | Agendamentos e perfil de cliente |

---

## 🧪 Testes Automatizados

O backend conta com **150 testes automatizados** cobrindo todas as camadas da aplicação (autenticação, usuários, serviços, agendamentos, horários de expediente e cálculo de disponibilidade com dias especiais).

Para executar toda a suíte de testes:

```bash
cd backend
npm test
```

### Estrutura dos Testes:
- **Testes Unitários de Serviços (`tests/services/`)**:
  - `auth.service.test.js` - Validações de login, registro e busca de perfil com mocks de modelo.
  - `users.service.test.js` - Permissões de cliente vs admin, atualização de perfil e métricas de clientes.
  - `services.service.test.js` - Catálogo de serviços, agrupamentos e tratamento de erros `P2025`/`AppError`.
  - `bookings.service.test.js` - Cálculo de disponibilidade, normalização de datas UTC, prioridade de dias especiais sobre horário semanal e regras de cancelamento.
- **Testes de Integração de Rotas (`tests/routes/`)**:
  - `auth.test.js` - Endpoints `/api/auth` com cookies HTTPOnly e tokens JWT.
  - `services.test.js` - Endpoints `/api/services` e proteções por role.
  - `users.test.js` - Endpoints `/api/users` e regras de autorização.
  - `bookings.test.js` - Endpoints `/api/bookings`, slots de disponibilidade por query params e dias especiais.

---

## 🗄️ Gerenciamento do Banco de Dados

### Scripts Disponíveis no Backend:
- `npm run db:generate` - Regenera os tipos e artefatos do Prisma Client.
- `npm run db:push` - Atualiza o banco de dados SQLite com a versão mais recente do `schema.prisma`.
- `npm run db:seed` - Popula o banco com os serviços padrão, admin e agendamentos de exemplo.
- `npm run db:studio` - Abre a interface visual do Prisma Studio no navegador (`http://localhost:5555`).

### Como Resetar o Banco de Dados:
Caso queira restaurar o banco ao estado inicial limpo:

```bash
cd backend

# No Linux / macOS:
rm prisma/dev.db

# No Windows (Command Prompt):
del prisma\dev.db

# No Windows (PowerShell):
Remove-Item prisma/dev.db

# Recrie o banco e popule os dados:
npm run db:push
npm run db:seed
```

---

## 🐛 Solução de Problemas (Troubleshooting)

### 1. Backend não inicializa ou erro de porta em uso (`EADDRINUSE`)
- Verifique se a porta `3333` já está em uso por outro processo.
- No Linux/macOS: `lsof -i :3333` e finalize com `kill -9 <PID>`.
- No Windows: `netstat -ano | findstr :3333` e finalize com `taskkill /PID <PID> /F`.

### 2. Erro de inicialização do Prisma (`PrismaClientInitializationError`)
- Certifique-se de executar `npm run db:generate` seguido de `npm run db:push`.
- Garanta que o arquivo `prisma/dev.db` possui permissões de leitura e escrita.

### 3. Frontend não conecta ao Backend
- Certifique-se de que o backend está ativo na porta `3333`.
- O Vite está configurado com proxy reverso redirecionando requisições `/api` para `http://localhost:3333`.
- Verifique se os cookies de autenticação não estão sendo bloqueados pelas configurações de segurança do navegador.

### 4. Falha de autenticação ao tentar entrar
- Execute novamente o seed: `npm run db:seed`.
- Confirme se utilizou as credenciais exatas: `admin@isa.com` / `admin123` ou `cliente@teste.com` / `cliente123`.

---

## 📦 Build para Produção

### Backend:
```bash
cd backend
npm start
```

### Frontend:
```bash
cd frontend
npm run build
# A pasta dist/ gerada pode ser servida por qualquer servidor de arquivos estáticos (Nginx, Vercel, Netlify, etc.)
```

---

Para mais informações sobre a arquitetura do sistema, design system e detalhes dos endpoints, leia o [**README.md**](README.md).
