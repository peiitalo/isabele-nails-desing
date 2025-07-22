# 🚀 Guia de Configuração - Isa Nails Design

Este guia te ajudará a configurar e rodar o sistema completo Isa Nails Design.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn instalado
- Git instalado

## 🛠️ Configuração Passo a Passo

### 1. Clone o Repositório

```bash
git clone [url-do-repositorio]
cd isa-nails-design
```

### 2. Configurar o Backend

```bash
# Navegar para a pasta do backend
cd backend

# Instalar dependências
npm install

# Gerar cliente Prisma
npm run db:generate

# Criar tabelas no banco de dados
npm run db:push

# Popular banco com dados iniciais
npm run db:seed
```

### 3. Iniciar o Backend

```bash
# Em desenvolvimento (com hot reload)
npm run dev

# OU em produção
npm start
```

O backend estará rodando em `http://localhost:3333`

### 4. Configurar o Frontend

```bash
# Voltar para a pasta raiz
cd ..

# Instalar dependências do frontend
npm install
```

### 5. Iniciar o Frontend

```bash
# Em uma nova aba/terminal
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## 🔐 Credenciais de Teste

### Administrador
- **Email:** admin@isa.com
- **Senha:** admin123

### Cliente
- **Email:** cliente@teste.com
- **Senha:** cliente123

## 📊 Dados Iniciais

O sistema já vem com:

- **1 administrador** (Isabela)
- **1 cliente** (Maria Silva)
- **6 serviços** de exemplo
- **2 agendamentos** de exemplo

## 🔧 Comandos Úteis

### Backend

```bash
cd backend

# Desenvolvimento
npm run dev

# Produção
npm start

# Gerar cliente Prisma
npm run db:generate

# Sincronizar banco
npm run db:push

# Popular dados
npm run db:seed

# Abrir Prisma Studio (visualizar banco)
npm run db:studio
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Linter
npm run lint
```

## 🗄️ Banco de Dados

- **Tipo:** SQLite
- **Arquivo:** `backend/prisma/dev.db`
- **ORM:** Prisma
- **Interface:** Prisma Studio (`npm run db:studio`)

## 🔌 API Endpoints

### Base URL: `http://localhost:3333/api`

- **Auth:** `/auth/*`
- **Services:** `/services/*`
- **Bookings:** `/bookings/*`
- **Users:** `/users/*`

## 🐛 Solução de Problemas

### Backend não inicia
1. Verifique se Node.js 18+ está instalado
2. Verifique se todas as dependências foram instaladas
3. Verifique se o banco foi configurado corretamente

### Frontend não conecta ao backend
1. Verifique se o backend está rodando na porta 3333
2. Verifique se o CORS está configurado corretamente
3. Verifique o console do navegador para erros

### Erro de autenticação
1. Verifique se o banco foi populado com `npm run db:seed`
2. Use as credenciais de teste fornecidas
3. Verifique se o token está sendo salvo no localStorage

### Erro de banco de dados
1. Delete o arquivo `backend/prisma/dev.db`
2. Execute `npm run db:push` novamente
3. Execute `npm run db:seed` para popular dados

## 📱 Testando o Sistema

1. **Acesse:** `http://localhost:3000`
2. **Faça login** com as credenciais de teste
3. **Teste as funcionalidades:**
   - Como cliente: agendar serviços, ver histórico
   - Como admin: gerenciar agendamentos, serviços, clientes

## 🚀 Deploy

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
npm run build
# Servir a pasta dist/
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no console
2. Verifique se todas as dependências estão instaladas
3. Verifique se as portas 3000 e 3333 estão livres
4. Consulte a documentação do README.md

---

**Boa sorte! 🎉** 