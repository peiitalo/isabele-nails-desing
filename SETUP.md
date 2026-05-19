# Isa Nails Design - Sistema Completo

Sistema completo de agendamento para salão de manicure com frontend React + Vite e backend Fastify + Prisma.

## 🚀 Funcionalidades

### Para Clientes:
- **Página Inicial**: Apresentação dos serviços e informações do salão
- **Catálogo de Serviços**: Visualização de todos os serviços disponíveis com filtros
- **Sistema de Agendamento**: Interface intuitiva para agendar horários
- **Perfil do Cliente**: Gerenciamento de informações pessoais e histórico de agendamentos

### Para Administradores:
- **Dashboard**: Visão geral com estatísticas do negócio
- **Gerenciamento de Agendamentos**: Controle completo dos horários marcados
- **Gestão de Serviços**: Cadastro, edição e remoção de serviços
- **Base de Clientes**: Visualização e gerenciamento da carteira de clientes

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática para JavaScript
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento da aplicação
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Ícones modernos
- **React Hook Form** - Gerenciamento de formulários
- **React Hot Toast** - Notificações toast
- **Date-fns** - Manipulação de datas

### Backend
- **Fastify** - Framework web rápido e eficiente
- **Prisma** - ORM moderno para Node.js
- **SQLite** - Banco de dados leve e rápido
- **JWT** - Autenticação baseada em tokens
- **bcryptjs** - Criptografia de senhas
- **CORS** - Cross-Origin Resource Sharing

## 📁 Estrutura do Projeto

```
├── frontend                    # Frontend
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── contexts/           # Contextos React (AuthContext)
│   │   ├── layouts/            # Layouts das páginas
│   │   ├── pages/              # Páginas da aplicação
│   │   │   ├── admin/          # Páginas do administrador
│   │   │   └── client/         # Páginas do cliente
│   │   ├── services/           # Serviços de API
│   │   ├── types/              # Definições TypeScript
│   │   ├── App.tsx             # Componente principal
│   │   └── main.tsx            # Ponto de entrada
├── backend/                    # Backend
│   ├── prisma/                 # Schema e banco de dados
│   ├── src/
│   │   ├── database/           # Cliente Prisma e seed
│   │   ├── middleware/         # Middlewares de autenticação
│   │   ├── routes/             # Rotas da API
│   │   └── server.js           # Servidor principal
│   └── package.json
└── README.md                   # Guia de configuração
```

## 🔌 API Endpoints

Base URL: `http://localhost:3333/api`

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Dados do usuário atual

### Serviços
- `GET /api/services` - Listar serviços
- `GET /api/services/:id` - Buscar serviço por ID
- `POST /api/services` - Criar serviço (admin)
- `PUT /api/services/:id` - Atualizar serviço (admin)
- `DELETE /api/services/:id` - Deletar serviço (admin)
- `GET /api/services/stats/overview` - Estatísticas (admin)

### Agendamentos
- `GET /api/bookings` - Listar agendamentos
- `GET /api/bookings/:id` - Buscar agendamento por ID
- `POST /api/bookings` - Criar agendamento
- `PATCH /api/bookings/:id/status` - Atualizar status (admin)
- `DELETE /api/bookings/:id` - Cancelar agendamento
- `GET /api/bookings/availability/:date` - Horários disponíveis
- `PATCH /api/bookings/:id/payment` - Registrar pagamento (admin)
- `GET /api/bookings/stats/dashboard` - Dashboard (admin)
- `GET/POST/PUT/DELETE /api/bookings/working-hours` - Horários de trabalho (admin)
- `GET/POST/PUT/DELETE /api/bookings/special-days` - Dias especiais (admin)

### Usuários
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/:id` - Buscar usuário por ID
- `PUT /api/users/:id` - Atualizar usuário
- `PATCH /api/users/:id/password` - Alterar senha
- `DELETE /api/users/:id` - Deletar usuário (admin)
- `GET /api/users/stats/overview` - Estatísticas (admin)

## 🗄️ Banco de Dados

O sistema usa **SQLite** com **Prisma ORM**. O banco é criado automaticamente e populado com dados de exemplo via `npm run db:seed`.

### Tabelas
- **Users** - Usuários com roles ADMIN e CLIENT
- **Services** - Serviços oferecidos (nome, preço, duração, categoria)
- **Bookings** - Agendamentos (status, pagamento, notas)
- **WorkingHours** - Horários de funcionamento por dia da semana
- **SpecialDays** - Horários especiais para feriados/datas específicas

### Interface
Use Prisma Studio para visualizar e editar dados visualmente:
```bash
cd backend && npm run db:studio
```

## 🎨 Design System

- **Cores Primárias**: Rosa (#ec4899) e Azul (#0ea5e9)
- **Tipografia**: Inter (sistema)
- **Componentes**: Cards, botões, inputs padronizados
- **Responsividade**: Design mobile-first

## 🔧 Scripts Disponíveis

### Frontend
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Visualiza o build
- `npm run lint` - Linter

### Backend
- `npm run dev` - Servidor de desenvolvimento (hot reload)
- `npm start` - Servidor de produção
- `npm run db:generate` - Gera cliente Prisma
- `npm run db:push` - Sincroniza schema com banco
- `npm run db:seed` - Popula banco com dados iniciais
- `npm run db:studio` - Abre Prisma Studio
- `npm test` - Roda testes automatizados

## 🔐 Autenticação

O sistema usa **JWT** para autenticação. Tokens HTTPOnly são enviados como cookies com `sameSite: lax`.

### Rotas protegidas
- Rotas com `preHandler: [fastify.authenticate]` exigem usuário logado
- Rotas com `preHandler: [fastify.adminAuth]` exigem role ADMIN
- O middleware tenta ler o token do cookie caso não haja header `Authorization`

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (até 767px)

---

Para instruções de configuração e como rodar o projeto localmente, veja o [README.md](README.md).

Desenvolvido com ❤️ para o Isa Nails Design
