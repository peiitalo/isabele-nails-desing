# Isa Nails Design - Backend API

Backend completo para o sistema Isa Nails Design, construído com **Fastify 5**, **Prisma ORM 5** e **SQLite**, seguindo uma arquitetura limpa em camadas:

$$\text{Routes} \longrightarrow \text{Controllers} \longrightarrow \text{Services} \longrightarrow \text{Models/Repositories} \longrightarrow \text{Prisma ORM}$$

---

## 🚀 Tecnologias

- **Node.js (ES Modules)** - Runtime JavaScript moderno
- **Fastify 5** - Framework web rápido e eficiente
- **Prisma ORM 5** - Modelagem e manipulação do banco de dados
- **SQLite** - Banco de dados relacional leve e autocontido
- **@fastify/jwt** & **@fastify/cookie** - Autenticação segura via cookies HTTPOnly
- **@fastify/cors** - Gerenciamento de CORS
- **bcryptjs** - Criptografia e hashing de senhas
- **Vitest 4** - Testes automatizados (150 testes passando)

---

## 📋 Pré-requisitos

- Node.js 18+
- npm 9+

---

## 🛠️ Instalação e Execução

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar banco de dados:**
```bash
# Gerar cliente Prisma
npm run db:generate

# Sincronizar schema com o banco SQLite
npm run db:push

# Popular banco com dados iniciais
npm run db:seed
```

3. **Iniciar servidor:**
```bash
# Modo desenvolvimento (com hot reload)
npm run dev

# Modo produção
npm start
```

O servidor iniciará em `http://localhost:3333`.  
Endpoint de verificação: `http://localhost:3333/health`

---

## 🧪 Testes Automatizados

Para rodar todos os testes (150 testes passando):

```bash
npm test
```

A suíte inclui:
- **`tests/services/`**: Testes unitários isolados com mocks da camada de modelos.
- **`tests/routes/`**: Testes de integração de endpoints validando cookies, JWT, rotas e banco real de teste.

---

## 📊 Banco de Dados & Credenciais

### Tabelas
- **users**: Contas de usuários (`ADMIN` e `CLIENT`)
- **services**: Serviços oferecidos (nome, preço, duração, categoria, status)
- **bookings**: Agendamentos com status, data, horário e pagamento
- **working_hours**: Grade semanal de horários de trabalho
- **special_days**: Exceções e feriados com horários específicos

### Credenciais Iniciais de Demonstração
- **Admin:** `admin@isa.com` / `admin123`
- **Cliente:** `cliente@teste.com` / `cliente123`

---

## 📁 Estrutura do Backend

```
backend/
├── prisma/
│   ├── schema.prisma       # Definição das tabelas e relacionamentos
│   └── dev.db              # Banco SQLite local
├── src/
│   ├── controllers/        # Controladores HTTP (req, res, JWT, cookies)
│   │   ├── auth.controller.js
│   │   ├── booking.controller.js
│   │   ├── service.controller.js
│   │   └── user.controller.js
│   ├── database/           # Cliente Prisma singleton e script seed
│   │   ├── client.js
│   │   └── seed.js
│   ├── errors/             # Classe de erro de domínio
│   │   └── AppError.js
│   ├── middleware/         # Middlewares de autenticação (JWT) e autorização (Admin)
│   │   └── auth.js
│   ├── models/             # Camada de Repositório / Queries brutas no Prisma
│   │   ├── auth.model.js
│   │   ├── booking.model.js
│   │   ├── service.model.js
│   │   └── user.model.js
│   ├── routes/             # Definição de endpoints, métodos e schemas Fastify
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   ├── services.js
│   │   └── users.js
│   ├── services/           # Regras de negócio puras e cálculos de domínio
│   │   ├── auth.service.js
│   │   ├── bookings.service.js
│   │   ├── services.service.js
│   │   └── users.service.js
│   └── server.js           # Ponto de entrada e configuração do Fastify
├── tests/                  # Suíte de testes automatizados Vitest
│   ├── helpers/            # Setup do Fastify e helpers de banco de dados
│   ├── routes/             # Testes de integração de rotas
│   └── services/           # Testes unitários com modelos mockados
├── package.json
└── vitest.config.js
```

---

## 🔌 Endpoints da API

Consulte o [**README.md principal da raiz**](../README.md) e o [**SETUP.md**](../SETUP.md) para a lista completa e detalhada de endpoints e instruções de configuração.