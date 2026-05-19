# Isa Nails Design

Sistema de agendamento para salão de manicure. [Documentação técnica completa → SETUP.md](SETUP.md)

## 🛠️ Configuração Passo a Passo

### 1. Clone o Repositório

```bash
git clone [url-do-repositorio]
cd isa-nails-design
```

### 2. Configurar o Backend

```bash
cd backend
npm install
npm run db:generate   # Gerar cliente Prisma
npm run db:push       # Criar tabelas no banco
npm run db:seed       # Popular com dados iniciais
```

### 3. Iniciar o Backend

```bash
npm run dev
```

O backend estará rodando em `http://localhost:3333`

### 4. Configurar e Iniciar o Frontend

```bash
# Em outro terminal
cd frontend
npm install
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## 🧪 Testes

O backend possui testes automatizados com Vitest. Para rodar:

```bash
cd backend
npm test
```

Atualmente há **80 testes** cobrindo autenticação, serviços, usuários, agendamentos, horários de trabalho e dias especiais.

## 🔐 Credenciais de Teste

**Administrador:**
- Email: `admin@isa.com`
- Senha: `admin123`

**Cliente:**
- Email: `cliente@teste.com`
- Senha: `cliente123`

## 🔜 Dados Iniciais

Após rodar `npm run db:seed`, o sistema vem com:

- 1 administrador (Isabela)
- 1 cliente (Maria Silva)
- 6 serviços de exemplo
- 2 agendamentos de exemplo

## 🐛 Solução de Problemas

### Backend não inicia
1. Verifique se Node.js 18+ está instalado
2. Execute `npm install` novamente
3. Rode `npm run db:generate` e `npm run db:push`

### Frontend não conecta ao backend
1. Verifique se o backend está rodando na porta 3333
2. Abra o console do navegador para erros de CORS

### Erro de autenticação
1. Rode `npm run db:seed` para garantir que os usuários existem
2. Use as credenciais acima

### Erro de banco de dados
1. Delete `backend/prisma/dev.db`
2. Rode `npm run db:push` novamente
3. Rode `npm run db:seed`

## 🧑‍💻 Testando o Sistema

1. Acesse `http://localhost:3000`
2. Faça login com as credenciais de teste
3. **Como cliente:** agende serviços, veja histórico
4. **Como admin:** gerencie agendamentos, serviços, clientes

## 📦 Deploy

```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build
# Sirva a pasta dist/ gerada
```

---

Veja a [documentação técnica completa (SETUP.md)](SETUP.md) para detalhes sobre arquitetura, API endpoints, banco de dados, estrutura do projeto e scripts disponíveis.
