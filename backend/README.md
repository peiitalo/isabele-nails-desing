# Isa Nails Design - Backend

Backend completo para o sistema Isa Nails Design, construído com Fastify, Prisma e SQLite.

## 🚀 Tecnologias

- **Fastify** - Framework web rápido e eficiente
- **Prisma** - ORM moderno para Node.js
- **SQLite** - Banco de dados leve e rápido
- **JWT** - Autenticação baseada em tokens
- **bcryptjs** - Criptografia de senhas
- **CORS** - Cross-Origin Resource Sharing

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## 🛠️ Instalação

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar banco de dados:**
```bash
# Gerar cliente Prisma
npm run db:generate

# Criar tabelas no banco
npm run db:push

# Popular banco com dados iniciais
npm run db:seed
```

3. **Iniciar servidor:**
```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

O servidor estará rodando em `http://localhost:3333`

## 📊 Banco de Dados

### Estrutura

- **Users** - Usuários (admin e clientes)
- **Services** - Serviços oferecidos
- **Bookings** - Agendamentos

### Dados Iniciais

O seed cria automaticamente:

- **Admin:** admin@isa.com / admin123
- **Cliente:** cliente@teste.com / cliente123
- **6 serviços** de exemplo
- **2 agendamentos** de exemplo

## 🔌 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Dados do usuário atual

### Serviços
- `GET /api/services` - Listar serviços
- `GET /api/services/:id` - Buscar serviço
- `POST /api/services` - Criar serviço (admin)
- `PUT /api/services/:id` - Atualizar serviço (admin)
- `DELETE /api/services/:id` - Deletar serviço (admin)

### Agendamentos
- `GET /api/bookings` - Listar agendamentos
- `GET /api/bookings/:id` - Buscar agendamento
- `POST /api/bookings` - Criar agendamento
- `PATCH /api/bookings/:id/status` - Atualizar status (admin)
- `DELETE /api/bookings/:id` - Cancelar agendamento
- `GET /api/bookings/availability/:date` - Horários disponíveis

### Usuários
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/:id` - Buscar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `PATCH /api/users/:id/password` - Alterar senha
- `DELETE /api/users/:id` - Deletar usuário (admin)

### Estatísticas
- `GET /api/bookings/stats/dashboard` - Stats de agendamentos
- `GET /api/services/stats/overview` - Stats de serviços
- `GET /api/users/stats/overview` - Stats de usuários

## 🔐 Autenticação

A API usa JWT para autenticação. Inclua o token no header:

```
Authorization: Bearer <seu-token>
```

## 🛡️ Permissões

- **ADMIN:** Acesso total a todas as funcionalidades
- **CLIENT:** Acesso limitado aos próprios dados e agendamentos

## 📝 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do backend:

```env
JWT_SECRET=sua-chave-secreta-aqui
PORT=3333
HOST=0.0.0.0
```

## 🗄️ Comandos do Prisma

```bash
# Gerar cliente Prisma
npm run db:generate

# Sincronizar schema com banco
npm run db:push

# Criar migração
npm run db:migrate

# Abrir Prisma Studio
npm run db:studio

# Executar seed
npm run db:seed
```

## 🔧 Desenvolvimento

### Estrutura de Pastas

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── dev.db
├── src/
│   ├── database/
│   │   ├── client.js
│   │   └── seed.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── services.js
│   │   ├── bookings.js
│   │   └── users.js
│   └── server.js
├── package.json
└── README.md
```

### Logs

O servidor usa o logger do Fastify. Em desenvolvimento, todos os logs são exibidos no console.

## 🚀 Deploy

Para produção, configure as variáveis de ambiente adequadas e use:

```bash
npm start
```

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação ou entre em contato com a equipe de desenvolvimento. 